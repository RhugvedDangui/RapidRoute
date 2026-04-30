"""
utils/tracer.py
---------------
Thin wrapper around the Langfuse SDK.

Usage
-----
    tracer = LangfuseTracer()
    with tracer.trace(name="chat", input={"msg": "..."}) as span:
        span.log_event("tool_call", {"tool": "web_search", "result": "..."})
        span.update_output({"answer": "..."})
        url = span.trace_url
"""

import time
from contextlib import contextmanager
from typing import Any, Generator

from langfuse import Langfuse

from utils.config import get_settings


class AgentSpan:
    """Wrapper around a Langfuse trace / generation that exposes helper methods."""

    def __init__(self, langfuse: Langfuse, name: str, input_data: dict[str, Any]):
        self._lf = langfuse
        self._trace = langfuse.trace(
            name=name,
            input=input_data,
            metadata={"service": "ai-agent"},
        )
        self._start = time.perf_counter()

    # ── public helpers ────────────────────────────────────────────────────────

    def log_event(self, name: str, data: dict[str, Any]) -> None:
        """Log a discrete event (tool call, error, etc.) inside this trace."""
        self._trace.event(name=name, input=data)

    def log_tool(
        self,
        tool_name: str,
        tool_input: dict[str, Any],
        tool_output: Any,
        latency_ms: float | None = None,
    ) -> None:
        """Log a tool call as a Langfuse span."""
        self._trace.span(
            name=f"tool:{tool_name}",
            input=tool_input,
            output={"result": str(tool_output)},
            metadata={"latency_ms": latency_ms},
        )

    def update_output(
        self,
        output: dict[str, Any],
        usage: dict[str, int] | None = None,
    ) -> None:
        """Set the final output and optional token usage on the trace."""
        elapsed_ms = (time.perf_counter() - self._start) * 1000
        self._trace.update(
            output=output,
            metadata={"total_latency_ms": round(elapsed_ms, 2)},
            usage=usage,
        )

    def log_error(self, error: Exception, context: str = "") -> None:
        """Log an exception as a Langfuse event."""
        self._trace.event(
            name="error",
            level="ERROR",
            input={"context": context, "error": str(error), "type": type(error).__name__},
        )

    @property
    def trace_url(self) -> str:
        """Return a direct link to this trace in Langfuse."""
        settings = get_settings()
        return f"{settings.langfuse_host}/trace/{self._trace.id}"

    def flush(self) -> None:
        """Flush pending events to Langfuse (call before returning response)."""
        self._lf.flush()


class LangfuseTracer:
    """Singleton-style tracer that creates AgentSpan instances per request."""

    def __init__(self) -> None:
        settings = get_settings()
        self._lf = Langfuse(
            public_key=settings.langfuse_public_key,
            secret_key=settings.langfuse_secret_key,
            host=settings.langfuse_host,
        )

    @contextmanager
    def trace(
        self, name: str, input_data: dict[str, Any]
    ) -> Generator[AgentSpan, None, None]:
        """Context manager that yields an AgentSpan and flushes on exit."""
        span = AgentSpan(self._lf, name, input_data)
        try:
            yield span
        finally:
            span.flush()
