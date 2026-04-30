"""
api/schemas.py
--------------
Pydantic request / response models for every FastAPI endpoint.
"""

from typing import Any
from pydantic import BaseModel, Field


# ── /ingest ───────────────────────────────────────────────────────────────────


class IngestURLRequest(BaseModel):
    """Request body for ingesting a URL instead of an uploaded file."""

    url: str = Field(..., description="HTTP/HTTPS URL to fetch and ingest.")


class IngestResponse(BaseModel):
    """Response returned by POST /ingest."""

    file_id: str = Field(..., description="Unique identifier for the ingested document.")
    chunk_count: int = Field(..., description="Number of chunks stored in Qdrant.")
    source: str = Field(..., description="Original file name or URL used as source label.")
    status: str = Field(..., description="'success' or an error message.")


# ── /chat ─────────────────────────────────────────────────────────────────────


class ChatRequest(BaseModel):
    """Request body for POST /chat."""

    session_id: str = Field(
        ...,
        description="Unique session identifier. Use the same ID across turns to maintain context.",
    )
    message: str = Field(..., description="The user's message or question.")
    user_id: str = Field(
        default="anonymous",
        description="Stable user identifier used for long-term memory (optional).",
    )


class SourceItem(BaseModel):
    """A single source citation produced by the agent."""

    tool: str = Field(..., description="Tool that produced this source.")
    reference: str = Field(..., description="URL, file name, or tool name.")
    snippet: str = Field(..., description="Short excerpt from the source.")


class ChatResponse(BaseModel):
    """Response returned by POST /chat."""

    session_id: str
    response: str = Field(..., description="Final answer from the agent.")
    tools_used: list[str] = Field(default_factory=list, description="Tools invoked during this turn.")
    sources: list[SourceItem] = Field(default_factory=list, description="Source attributions.")
    trace_url: str = Field(..., description="Langfuse trace URL for observability.")


# ── /history ──────────────────────────────────────────────────────────────────


class MessageItem(BaseModel):
    """A single message in the conversation history."""

    role: str = Field(..., description="'user' or 'assistant'.")
    content: str


class HistoryResponse(BaseModel):
    """Response returned by GET /history/{session_id}."""

    session_id: str
    messages: list[MessageItem] = Field(default_factory=list)


# ── /reset ────────────────────────────────────────────────────────────────────


class ResetResponse(BaseModel):
    """Response returned by POST /reset/{session_id}."""

    session_id: str
    status: str = Field(..., description="'cleared' or an error message.")


# ── /health ───────────────────────────────────────────────────────────────────


class ServiceStatus(BaseModel):
    """Status of a single external service."""

    name: str
    status: str = Field(..., description="'ok', 'degraded', or 'error'.")
    detail: str = Field(default="", description="Additional detail or error message.")


class HealthResponse(BaseModel):
    """Response returned by GET /health."""

    overall: str = Field(..., description="'ok' if all services are healthy, otherwise 'degraded'.")
    services: list[ServiceStatus]


# ── /chat/stream ──────────────────────────────────────────────────────────────


class StreamThinkingData(BaseModel):
    """Payload for a 'thinking' SSE event."""

    content: str = Field(..., description="LLM output text (may be empty if only tool calls).")
    tool_calls: list[dict[str, Any]] = Field(
        default_factory=list,
        description="Tool calls the LLM is requesting in this step.",
    )


class StreamToolCallData(BaseModel):
    """Payload for a 'tool_call' SSE event."""

    tool: str = Field(..., description="Name of the tool being invoked.")
    args: dict[str, Any] = Field(default_factory=dict, description="Arguments passed to the tool.")


class StreamToolResultData(BaseModel):
    """Payload for a 'tool_result' SSE event."""

    tool: str = Field(..., description="Name of the tool that returned this result.")
    result: str = Field(..., description="Snippet of the tool's output (first 300 chars).")


class StreamAnswerData(BaseModel):
    """Payload for the final 'answer' SSE event."""

    session_id: str
    response: str = Field(..., description="Final answer from the agent.")
    tools_used: list[str] = Field(default_factory=list)
    sources: list[SourceItem] = Field(default_factory=list)


class StreamErrorData(BaseModel):
    """Payload for an 'error' SSE event."""

    message: str
