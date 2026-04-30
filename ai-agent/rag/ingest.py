"""
rag/ingest.py
-------------
Document ingestion pipeline.

Flow
----
    file / URL
        │
        ▼
    parse  ──► Unstructured  (PDF, DOCX, CSV, TXT, …)
             ──► pytesseract  (PNG, JPG, TIFF, BMP, WEBP, …)
             ──► faster-whisper  (MP3, WAV, M4A, OGG, FLAC, …)
        │
        ▼
    chunk  (512 tokens, 50 token overlap)
        │
        ▼
    embed  (sentence-transformers/all-MiniLM-L6-v2, local)
        │
        ▼
    upsert to Qdrant
        │
        ▼
    store raw text in Redis  (for read_file tool)
"""

import hashlib
import logging
import uuid
import shutil
from pathlib import Path
from typing import Any

import httpx
from langchain_text_splitters import RecursiveCharacterTextSplitter
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, PointStruct, VectorParams
from sentence_transformers import SentenceTransformer
from upstash_redis import Redis

from utils.config import get_settings

logger = logging.getLogger(__name__)

# ── singletons ────────────────────────────────────────────────────────────────
_embedder: SentenceTransformer | None = None
_qdrant: QdrantClient | None = None
_whisper_model: Any | None = None  # faster_whisper.WhisperModel


def _get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        settings = get_settings()
        logger.info("Loading embedding model: %s", settings.embedding_model)
        _embedder = SentenceTransformer(settings.embedding_model)
    return _embedder


def _get_qdrant() -> QdrantClient:
    global _qdrant
    if _qdrant is None:
        settings = get_settings()
        _qdrant = QdrantClient(
            url=settings.qdrant_url, 
            api_key=settings.qdrant_api_key,
            prefer_grpc=False,  # Force HTTP for Windows compatibility
            timeout=30
        )
    return _qdrant


def _get_whisper() -> Any:
    """Lazy-load the faster-whisper model for audio transcription."""
    global _whisper_model
    if _whisper_model is None:
        from faster_whisper import WhisperModel
        logger.info("Loading Whisper model (base) for audio transcription...")
        # Use 'base' model for speed/accuracy balance. Options: tiny, base, small, medium, large
        _whisper_model = WhisperModel("base", device="cpu", compute_type="int8")
    return _whisper_model


def _ensure_collection() -> None:
    """Create the Qdrant collection if it does not already exist."""
    settings = get_settings()
    client = _get_qdrant()
    existing = [c.name for c in client.get_collections().collections]
    if settings.qdrant_collection not in existing:
        client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=VectorParams(
                size=settings.embedding_dim,
                distance=Distance.COSINE,
            ),
        )
        logger.info("Created Qdrant collection: %s", settings.qdrant_collection)


# ── parsing ───────────────────────────────────────────────────────────────────


def _parse_file(file_path: str | Path) -> str:
    """
    Parse a local file using Unstructured and return its full text.

    Supports PDF, DOCX, CSV, TXT, PPTX, XLSX, and more via Unstructured's
    auto-detection.

    Parameters
    ----------
    file_path:
        Absolute or relative path to the file on disk.

    Returns
    -------
    str
        Concatenated text from all Unstructured elements.
    """
    from unstructured.partition.auto import partition

    elements = partition(filename=str(file_path))
    return "\n\n".join(str(el) for el in elements)


def _parse_url(url: str) -> str:
    """
    Fetch a URL and extract its plain text content.

    Parameters
    ----------
    url:
        HTTP/HTTPS URL to fetch.

    Returns
    -------
    str
        The response body as UTF-8 text (HTML is not stripped; callers may
        wish to run it through BeautifulSoup or Unstructured's HTML partition).
    """
    from unstructured.partition.html import partition_html

    response = httpx.get(url, follow_redirects=True, timeout=30)
    response.raise_for_status()
    elements = partition_html(text=response.text)
    return "\n\n".join(str(el) for el in elements)


# ── image OCR ─────────────────────────────────────────────────────────────────

#: Extensions handled by pytesseract OCR
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".tif", ".webp", ".gif"}


def _parse_image(file_path: str | Path) -> str:
    """
    Extract text from an image file using Tesseract OCR via pytesseract.

    Requires Tesseract to be installed on the system:
      - Windows: https://github.com/UB-Mannheim/tesseract/wiki
      - Linux:   sudo apt install tesseract-ocr
      - macOS:   brew install tesseract

    Parameters
    ----------
    file_path:
        Path to the image file (PNG, JPG, TIFF, BMP, WEBP, GIF).

    Returns
    -------
    str
        Extracted text from the image, or an empty string if OCR yields nothing.

    Raises
    ------
    RuntimeError
        If pytesseract or Tesseract is not available.
    """
    try:
        import pytesseract
        from PIL import Image
    except ImportError as exc:
        raise RuntimeError(
            "pytesseract and Pillow are required for image OCR. "
            "Install with: pip install pytesseract Pillow"
        ) from exc

    logger.info("Running OCR on image: %s", file_path)
    image = Image.open(str(file_path))

    # Convert palette/RGBA images to RGB for better OCR accuracy
    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")

    text: str = pytesseract.image_to_string(image, lang="eng")
    text = text.strip()

    if not text:
        logger.warning("OCR produced no text for %s — image may be blank or unreadable.", file_path)
        return f"[Image file: {Path(file_path).name} — OCR produced no readable text]"

    logger.info("OCR extracted %d characters from %s", len(text), file_path)
    return f"[OCR extracted from image: {Path(file_path).name}]\n\n{text}"


# ── audio transcription ───────────────────────────────────────────────────────

#: Extensions handled by faster-whisper transcription
AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".ogg", ".flac", ".aac", ".wma", ".opus"}


def _parse_audio(file_path: str | Path) -> str:
    """
    Transcribe an audio file to text using faster-whisper (local, no API cost).

    Uses the 'base' Whisper model by default (good speed/accuracy balance).
    The model is downloaded on first use (~150 MB) and cached locally.

    Parameters
    ----------
    file_path:
        Path to the audio file (MP3, WAV, M4A, OGG, FLAC, etc.).

    Returns
    -------
    str
        Full transcription text with detected language noted.

    Raises
    ------
    RuntimeError
        If faster-whisper is not installed.
    """
    try:
        from faster_whisper import WhisperModel  # noqa: F401 — ensure importable
    except ImportError as exc:
        raise RuntimeError(
            "faster-whisper is required for audio transcription. "
            "Install with: pip install faster-whisper"
        ) from exc

    logger.info("Transcribing audio: %s", file_path)
    model = _get_whisper()

    segments, info = model.transcribe(str(file_path), beam_size=5)
    detected_lang = info.language
    lang_prob = info.language_probability

    logger.info(
        "Detected language: %s (%.0f%%) for %s",
        detected_lang, lang_prob * 100, file_path,
    )

    transcript_parts: list[str] = []
    for segment in segments:
        transcript_parts.append(segment.text.strip())

    full_transcript = " ".join(transcript_parts).strip()

    if not full_transcript:
        logger.warning("Transcription produced no text for %s", file_path)
        return f"[Audio file: {Path(file_path).name} — transcription produced no text]"

    logger.info("Transcribed %d characters from %s", len(full_transcript), file_path)
    return (
        f"[Audio transcription of: {Path(file_path).name} | "
        f"Language: {detected_lang} ({lang_prob:.0%})]\n\n"
        f"{full_transcript}"
    )


# ── chunking ──────────────────────────────────────────────────────────────────


def _chunk_text(text: str) -> list[str]:
    """
    Split *text* into overlapping chunks using LangChain's
    RecursiveCharacterTextSplitter.

    Uses character-based splitting as a proxy for token-based (one token ≈
    4 chars).  chunk_size=2048 chars ≈ 512 tokens; overlap=200 chars ≈ 50 tokens.
    """
    settings = get_settings()
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size * 4,  # chars → approx tokens
        chunk_overlap=settings.chunk_overlap * 4,
        separators=["\n\n", "\n", " ", ""],
    )
    return splitter.split_text(text)


# ── embedding + upsert ────────────────────────────────────────────────────────


def _embed_and_upsert(
    chunks: list[str], source: str, file_id: str, local_path: str = ""
) -> int:
    """
    Embed *chunks* and upsert them into Qdrant.

    Parameters
    ----------
    chunks:
        List of text chunks to embed.
    source:
        Human-readable source label (file name or URL).
    file_id:
        Unique file identifier used as a payload field.
    local_path:
        Local path where the file is saved (if any).

    Returns
    -------
    int
        Number of chunks upserted.
    """
    settings = get_settings()
    embedder = _get_embedder()
    client = _get_qdrant()
    _ensure_collection()

    embeddings = embedder.encode(chunks, show_progress_bar=False).tolist()

    points: list[PointStruct] = []
    for i, (chunk, vector) in enumerate(zip(chunks, embeddings)):
        point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{file_id}:{i}"))
        points.append(
            PointStruct(
                id=point_id,
                vector=vector,
                payload={
                    "text": chunk,
                    "source": source,
                    "file_id": file_id,
                    "chunk_index": i,
                    "local_path": local_path,
                },
            )
        )

    client.upsert(collection_name=settings.qdrant_collection, points=points)
    return len(points)


def _store_raw_in_redis(file_id: str, text: str) -> None:
    """
    Store the raw parsed text in Redis so the ``read_file`` tool can retrieve it.

    The key format is ``file:{file_id}:content``.  No TTL is set — files
    persist until Redis evicts them.
    """
    settings = get_settings()
    redis = Redis(url=settings.upstash_redis_url, token=settings.upstash_redis_token)
    redis.set(f"file:{file_id}:content", text)


# ── public API ────────────────────────────────────────────────────────────────


def ingest_file(file_path: str | Path, original_name: str) -> dict[str, Any]:
    """
    Ingest a local file: parse → chunk → embed → upsert to Qdrant + Redis.

    Supported file types
    --------------------
    - Documents: PDF, DOCX, TXT, CSV, PPTX, XLSX, HTML, and more (Unstructured)
    - Images:    PNG, JPG, JPEG, BMP, TIFF, WEBP, GIF  (pytesseract OCR)
    - Audio:     MP3, WAV, M4A, OGG, FLAC, AAC, WMA, OPUS  (faster-whisper)

    Parameters
    ----------
    file_path:
        Path to the temp file written by FastAPI's UploadFile.
    original_name:
        Original filename sent by the client (used as source label).

    Returns
    -------
    dict
        ``{"file_id": str, "chunk_count": int, "source": str, "status": str}``
    """
    logger.info("Ingesting file: %s", original_name)
    file_id = hashlib.md5(original_name.encode()).hexdigest()[:12] + "-" + str(uuid.uuid4())[:8]

    ext = Path(original_name).suffix.lower()

    # ── route to correct parser ───────────────────────────────────────────────
    if ext in IMAGE_EXTENSIONS:
        folder = "images"
        save_dir = Path("rag/data") / folder
        save_dir.mkdir(parents=True, exist_ok=True)
        saved_path = save_dir / f"{file_id}{ext}"
        shutil.copy(file_path, saved_path)
        text = _parse_image(saved_path)

    elif ext in AUDIO_EXTENSIONS:
        folder = "audio"
        save_dir = Path("rag/data") / folder
        save_dir.mkdir(parents=True, exist_ok=True)
        saved_path = save_dir / f"{file_id}{ext}"
        shutil.copy(file_path, saved_path)
        text = _parse_audio(saved_path)

    else:
        # Default: Unstructured handles PDF, DOCX, CSV, TXT, PPTX, XLSX, etc.
        if ext == ".pdf":
            folder = "pdfs"
        elif ext == ".csv":
            folder = "csv"
        else:
            folder = "docs"

        save_dir = Path("rag/data") / folder
        save_dir.mkdir(parents=True, exist_ok=True)
        saved_path = save_dir / f"{file_id}{ext}"
        shutil.copy(file_path, saved_path)
        text = _parse_file(saved_path)

    chunks = _chunk_text(text)
    chunk_count = _embed_and_upsert(chunks, source=original_name, file_id=file_id, local_path=str(saved_path))
    _store_raw_in_redis(file_id, text[:50_000])  # store first 50k chars

    logger.info("Ingested %d chunks for file_id=%s", chunk_count, file_id)
    return {
        "file_id": file_id,
        "chunk_count": chunk_count,
        "source": original_name,
        "status": "success",
    }


def ingest_url(url: str) -> dict[str, Any]:
    """
    Ingest a URL: fetch → parse → chunk → embed → upsert to Qdrant + Redis.

    Parameters
    ----------
    url:
        The HTTP/HTTPS URL to ingest.

    Returns
    -------
    dict
        ``{"file_id": str, "chunk_count": int, "source": str, "status": str}``
    """
    logger.info("Ingesting URL: %s", url)
    file_id = hashlib.md5(url.encode()).hexdigest()[:12] + "-" + str(uuid.uuid4())[:8]

    text = _parse_url(url)
    chunks = _chunk_text(text)
    chunk_count = _embed_and_upsert(chunks, source=url, file_id=file_id)
    _store_raw_in_redis(file_id, text[:50_000])

    logger.info("Ingested %d chunks for URL file_id=%s", chunk_count, file_id)
    return {
        "file_id": file_id,
        "chunk_count": chunk_count,
        "source": url,
        "status": "success",
    }
