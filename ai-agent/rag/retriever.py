"""
rag/retriever.py
----------------
Similarity search over the Qdrant vector store.

Used directly by ``agent/tools.py:rag_search``.
"""

import logging
from typing import Any

from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer

from utils.config import get_settings

logger = logging.getLogger(__name__)

# ── singletons (shared with ingest.py) ───────────────────────────────────────
_embedder: SentenceTransformer | None = None
_qdrant: QdrantClient | None = None


def _get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        settings = get_settings()
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


# ── public API ────────────────────────────────────────────────────────────────


def retrieve_chunks(query: str, top_k: int = 5) -> list[dict[str, Any]]:
    """
    Embed *query* and return the top-k most similar chunks from Qdrant.

    Parameters
    ----------
    query:
        Natural-language search query.
    top_k:
        Number of results to return (default 5, increased for better recall).

    Returns
    -------
    list[dict]
        Each dict has keys: ``text``, ``source``, ``file_id``, ``score``.
        Returns ``[]`` if the collection is empty or an error occurs.
    """
    settings = get_settings()

    try:
        embedder = _get_embedder()
        client = _get_qdrant()

        # Check if collection exists and has points
        try:
            collection_info = client.get_collection(settings.qdrant_collection)
            if collection_info.points_count == 0:
                logger.warning("Qdrant collection '%s' is empty", settings.qdrant_collection)
                return []
        except Exception as e:
            logger.error("Failed to check collection: %s", e)
            return []

        query_vector = embedder.encode([query], show_progress_bar=False)[0].tolist()

        # Use query_points for newer qdrant-client versions (1.17+)
        try:
            results = client.query_points(
                collection_name=settings.qdrant_collection,
                query=query_vector,
                limit=top_k,
                with_payload=True,
            ).points
        except AttributeError:
            # Fallback to search() for older versions
            results = client.search(
                collection_name=settings.qdrant_collection,
                query_vector=query_vector,
                limit=top_k,
                with_payload=True,
            )

        if not results:
            logger.info("No results found for query: %s", query)
            return []

        chunks: list[dict[str, Any]] = []
        for hit in results:
            payload = hit.payload or {}
            chunks.append(
                {
                    "text": payload.get("text", ""),
                    "source": payload.get("source", "unknown"),
                    "file_id": payload.get("file_id", ""),
                    "chunk_index": payload.get("chunk_index", 0),
                    "score": hit.score,
                }
            )
        
        logger.info("Retrieved %d chunks for query: %s", len(chunks), query)
        return chunks

    except Exception as exc:
        logger.error("retrieve_chunks failed: %s", exc, exc_info=True)
        return []
