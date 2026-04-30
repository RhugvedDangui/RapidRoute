"""
api/routes.py
-------------
All FastAPI routers.

Endpoints
---------
POST   /ingest              – Ingest a file or URL into Qdrant
POST   /chat                – Run the ReAct agent for one user turn
POST   /chat/stream         – Stream the ReAct agent as SSE events
GET    /history/{session_id} – Retrieve conversation history from Redis
POST   /reset/{session_id}  – Clear a session from Redis
GET    /health              – Check status of all external services
"""

import json
import logging
import os
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

from agent.graph import run_agent, stream_agent
from agent.memory import ShortTermMemory
from api.schemas import (
    ChatRequest,
    ChatResponse,
    HealthResponse,
    HistoryResponse,
    IngestResponse,
    IngestURLRequest,
    MessageItem,
    ResetResponse,
    ServiceStatus,
    SourceItem,
)
from rag.ingest import (
    AUDIO_EXTENSIONS,
    IMAGE_EXTENSIONS,
    ingest_file,
    ingest_url,
)
from utils.config import get_settings
from utils.tracer import LangfuseTracer

logger = logging.getLogger(__name__)
router = APIRouter()

# ── shared singletons ─────────────────────────────────────────────────────────
_tracer = LangfuseTracer()
_stm = ShortTermMemory()


# ── POST /ingest ──────────────────────────────────────────────────────────────


@router.post(
    "/ingest",
    response_model=IngestResponse,
    summary="Ingest a document or URL into the vector store",
    tags=["RAG"],
)
async def ingest_endpoint(
    file: UploadFile | None = File(default=None, description="PDF, DOCX, CSV, TXT, PNG, JPG, MP3, WAV, and more."),
    url: str | None = Form(default=None, description="HTTP/HTTPS URL to ingest instead of a file."),
) -> IngestResponse:
    """
    Parse, chunk, embed, and store a document or URL.

    Accepts **either** a multipart file upload **or** a ``url`` form field —
    not both.  The returned ``file_id`` can be passed to the ``read_file`` tool.

    Supported file types
    --------------------
    - **Documents**: PDF, DOCX, TXT, CSV, PPTX, XLSX, HTML (via Unstructured)
    - **Images**: PNG, JPG, JPEG, BMP, TIFF, WEBP, GIF (via Tesseract OCR)
    - **Audio**: MP3, WAV, M4A, OGG, FLAC, AAC, WMA, OPUS (via faster-whisper)
    """
    if file is None and url is None:
        raise HTTPException(status_code=422, detail="Provide either a 'file' or a 'url'.")

    try:
        if file is not None:
            # Write uploaded file to a temp path so the parser can read it
            suffix = Path(file.filename or "upload").suffix or ".bin"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                tmp.write(await file.read())
                tmp_path = tmp.name

            result = ingest_file(file_path=tmp_path, original_name=file.filename or "upload")
            os.unlink(tmp_path)
        else:
            result = ingest_url(url=url)  # type: ignore[arg-type]

        return IngestResponse(**result)

    except Exception as exc:
        logger.exception("Ingest failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ── POST /chat ────────────────────────────────────────────────────────────────


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Run the ReAct agent for one conversational turn",
    tags=["Agent"],
)
async def chat_endpoint(body: ChatRequest) -> ChatResponse:
    """
    Send a message to the AI agent and receive a structured response.

    The agent will:
    1. Load short-term history from Redis.
    2. Retrieve long-term memories from mem0.
    3. Execute a LangGraph ReAct loop (potentially chaining multiple tools).
    4. Return the answer, tools used, sources, and a Langfuse trace URL.
    """
    with _tracer.trace(
        name="chat",
        input_data={
            "session_id": body.session_id,
            "user_id": body.user_id,
            "message": body.message,
        },
    ) as span:
        try:
            result = await run_agent(
                session_id=body.session_id,
                user_id=body.user_id,
                user_message=body.message,
                span=span,
            )

            sources = [SourceItem(**s) for s in result.get("sources", [])]

            response = ChatResponse(
                session_id=body.session_id,
                response=result["response"],
                tools_used=result.get("tools_used", []),
                sources=sources,
                trace_url=span.trace_url,
            )

            span.update_output({"response": result["response"], "tools_used": result.get("tools_used", [])})
            return response

        except Exception as exc:
            span.log_error(exc, context="chat_endpoint")
            logger.exception("Chat failed for session=%s", body.session_id)
            raise HTTPException(status_code=500, detail=str(exc)) from exc


# ── POST /chat/stream ─────────────────────────────────────────────────────────


@router.post(
    "/chat/stream",
    summary="Stream the ReAct agent as Server-Sent Events",
    tags=["Agent"],
    response_class=EventSourceResponse,
)
async def chat_stream_endpoint(body: ChatRequest) -> EventSourceResponse:
    """
    Stream the agent's reasoning and final answer as **Server-Sent Events**.

    Each SSE message has the form::

        event: <type>
        data: <json>

    Event types
    -----------
    ``thinking``
        LLM produced output (may include tool call requests).
        ``data``: ``{"content": "...", "tool_calls": [...]}``

    ``tool_call``
        Agent is invoking a tool.
        ``data``: ``{"tool": "web_search", "args": {"query": "..."}}``

    ``tool_result``
        Tool returned a result.
        ``data``: ``{"tool": "web_search", "result": "...snippet..."}``

    ``answer``
        Final answer — always the last event.
        ``data``: ``{"response": "...", "tools_used": [...], "sources": [...], "session_id": "..."}``

    ``error``
        Unhandled exception.
        ``data``: ``{"message": "..."}``

    Example (JavaScript)
    --------------------
    .. code-block:: javascript

        const es = await fetch('/chat/stream', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({session_id: 'abc', message: 'Hello', user_id: 'u1'}),
        });
        const reader = es.body.getReader();
        // parse SSE lines from reader...
    """
    async def event_generator():
        try:
            async for event in stream_agent(
                session_id=body.session_id,
                user_id=body.user_id,
                user_message=body.message,
            ):
                event_type = event.get("event", "message")
                data = event.get("data", {})
                yield {
                    "event": event_type,
                    "data": json.dumps(data),
                }
        except Exception as exc:
            logger.exception("SSE stream error for session=%s", body.session_id)
            yield {
                "event": "error",
                "data": json.dumps({"message": str(exc)}),
            }

    return EventSourceResponse(event_generator())


# ── GET /history/{session_id} ─────────────────────────────────────────────────


@router.get(
    "/history/{session_id}",
    response_model=HistoryResponse,
    summary="Retrieve conversation history for a session",
    tags=["Memory"],
)
async def history_endpoint(session_id: str) -> HistoryResponse:
    """Return the full conversation history stored in Redis for *session_id*."""
    try:
        raw = _stm.get_history(session_id)
        messages = [MessageItem(role=m.get("role", "user"), content=m.get("content", "")) for m in raw]
        return HistoryResponse(session_id=session_id, messages=messages)
    except Exception as exc:
        logger.exception("History fetch failed for session=%s", session_id)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ── POST /reset/{session_id} ──────────────────────────────────────────────────


@router.post(
    "/reset/{session_id}",
    response_model=ResetResponse,
    summary="Clear a session's conversation history",
    tags=["Memory"],
)
async def reset_endpoint(session_id: str) -> ResetResponse:
    """Delete the session history from Redis (start fresh on next /chat call)."""
    try:
        _stm.clear_history(session_id)
        return ResetResponse(session_id=session_id, status="cleared")
    except Exception as exc:
        logger.exception("Reset failed for session=%s", session_id)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ── GET /health ───────────────────────────────────────────────────────────────


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Check health of all external services",
    tags=["Observability"],
)
async def health_endpoint() -> HealthResponse:
    """
    Probe Qdrant, Redis, Tavily, and Langfuse.

    Returns ``overall: 'ok'`` only if every service responds successfully.
    """
    statuses: list[ServiceStatus] = []

    # ── Qdrant ────────────────────────────────────────────────────────────────
    try:
        from qdrant_client import QdrantClient

        settings = get_settings()
        qc = QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key)
        info = qc.get_collections()
        statuses.append(ServiceStatus(name="qdrant", status="ok", detail=f"{len(info.collections)} collections"))
    except Exception as exc:
        statuses.append(ServiceStatus(name="qdrant", status="error", detail=str(exc)))

    # ── Upstash Redis ─────────────────────────────────────────────────────────
    try:
        from upstash_redis import Redis

        settings = get_settings()
        r = Redis(url=settings.upstash_redis_url, token=settings.upstash_redis_token)
        r.ping()
        statuses.append(ServiceStatus(name="redis", status="ok", detail="PONG"))
    except Exception as exc:
        statuses.append(ServiceStatus(name="redis", status="error", detail=str(exc)))

    # ── Tavily ────────────────────────────────────────────────────────────────
    try:
        from tavily import TavilyClient

        settings = get_settings()
        tc = TavilyClient(api_key=settings.tavily_api_key)
        # lightweight ping — search with very small limit
        tc.search("ping", max_results=1)
        statuses.append(ServiceStatus(name="tavily", status="ok"))
    except Exception as exc:
        statuses.append(ServiceStatus(name="tavily", status="error", detail=str(exc)))

    # ── Langfuse ──────────────────────────────────────────────────────────────
    try:
        from langfuse import Langfuse

        settings = get_settings()
        lf = Langfuse(
            public_key=settings.langfuse_public_key,
            secret_key=settings.langfuse_secret_key,
            host=settings.langfuse_host,
        )
        lf.auth_check()
        statuses.append(ServiceStatus(name="langfuse", status="ok"))
    except Exception as exc:
        statuses.append(ServiceStatus(name="langfuse", status="error", detail=str(exc)))

    # ── mem0 ──────────────────────────────────────────────────────────────────
    try:
        from mem0 import MemoryClient

        settings = get_settings()
        mc = MemoryClient(api_key=settings.mem0_api_key)
        # Just instantiating checks the API key
        mc.get_all(filters={"user_id": "_health_check_"})
        statuses.append(ServiceStatus(name="mem0", status="ok"))
    except Exception as exc:
        statuses.append(ServiceStatus(name="mem0", status="error", detail=str(exc)))

    overall = "ok" if all(s.status == "ok" for s in statuses) else "degraded"
    return HealthResponse(overall=overall, services=statuses)
