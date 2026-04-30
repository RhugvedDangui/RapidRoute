"""
agent/memory.py
---------------
Short-term memory  → Upstash Redis  (per-session, last 20 messages, TTL 2h)
Long-term memory   → mem0            (cross-session, top-5 relevant memories)
"""

import json
import logging
from typing import Any

from mem0 import MemoryClient
from upstash_redis import Redis

from utils.config import get_settings

logger = logging.getLogger(__name__)


# ── helpers ───────────────────────────────────────────────────────────────────


def _session_key(session_id: str) -> str:
    """Return the Redis key for a session's history list."""
    return f"session:{session_id}:history"


# ── Short-term memory (Upstash Redis) ─────────────────────────────────────────


class ShortTermMemory:
    """
    Manages per-session conversation history in Upstash Redis.

    History is stored as a JSON-serialised list of OpenAI-style message dicts
    (``{"role": ..., "content": ...}``) under the key ``session:{id}:history``.
    The list is capped at ``settings.session_history_limit`` entries and given
    a TTL of ``settings.session_ttl_seconds`` on every write.
    """

    def __init__(self) -> None:
        settings = get_settings()
        self._redis = Redis(
            url=settings.upstash_redis_url,
            token=settings.upstash_redis_token,
        )
        self._limit = settings.session_history_limit
        self._ttl = settings.session_ttl_seconds

    # ── public API ────────────────────────────────────────────────────────────

    def get_history(self, session_id: str) -> list[dict[str, str]]:
        """
        Retrieve the full conversation history for *session_id*.

        Returns
        -------
        list[dict]
            List of ``{"role": ..., "content": ...}`` dicts, oldest first.
            Returns ``[]`` if the session does not exist or an error occurs.
        """
        try:
            raw: str | None = self._redis.get(_session_key(session_id))
            if raw is None:
                return []
            return json.loads(raw)
        except Exception as exc:
            logger.error("ShortTermMemory.get_history error: %s", exc)
            return []

    def append_message(
        self, session_id: str, role: str, content: str
    ) -> None:
        """
        Append a single message to the session history.

        The history is trimmed to the last ``session_history_limit`` messages
        and the TTL is refreshed.
        """
        try:
            history = self.get_history(session_id)
            history.append({"role": role, "content": content})
            # Keep only the most recent N messages
            history = history[-self._limit :]
            key = _session_key(session_id)
            self._redis.setex(key, self._ttl, json.dumps(history))
        except Exception as exc:
            logger.error("ShortTermMemory.append_message error: %s", exc)

    def clear_history(self, session_id: str) -> None:
        """Delete the session's history from Redis."""
        try:
            self._redis.delete(_session_key(session_id))
        except Exception as exc:
            logger.error("ShortTermMemory.clear_history error: %s", exc)

    def get_full_conversation_text(self, session_id: str) -> str:
        """Return the session history as a human-readable conversation string."""
        history = self.get_history(session_id)
        lines: list[str] = []
        for msg in history:
            role = msg.get("role", "unknown").upper()
            content = msg.get("content", "")
            lines.append(f"{role}: {content}")
        return "\n".join(lines)


# ── Long-term memory (mem0) ───────────────────────────────────────────────────


class LongTermMemory:
    """
    Manages cross-session memories using the mem0 cloud API.

    On session end, the conversation is summarised and stored.
    On session start, the top-k most relevant memories are retrieved and
    injected into the system prompt.
    """

    def __init__(self) -> None:
        settings = get_settings()
        self._client = MemoryClient(api_key=settings.mem0_api_key)
        self._top_k = settings.long_term_top_k

    # ── public API ────────────────────────────────────────────────────────────

    def store_memory(
        self,
        user_id: str,
        messages: list[dict[str, Any]],
    ) -> None:
        """
        Persist a conversation (list of message dicts) into mem0 for *user_id*.

        Parameters
        ----------
        user_id:
            Stable identifier for the user across sessions.
        messages:
            List of ``{"role": ..., "content": ...}`` dicts.
        """
        try:
            self._client.add(messages, user_id=user_id)
        except Exception as exc:
            logger.error("LongTermMemory.store_memory error: %s", exc)

    def retrieve_memories(self, user_id: str, query: str) -> list[str]:
        """
        Retrieve the top-k memories most relevant to *query* for *user_id*.

        Returns
        -------
        list[str]
            Plain-text memory strings, ready to inject into the system prompt.
            Returns ``[]`` on error.
        """
        try:
            results = self._client.search(
                query=query,
                filters={"user_id": user_id},
                limit=self._top_k,
            )
            # mem0 API returns a list of strings or dicts depending on version
            memories = []
            for r in results:
                if isinstance(r, str):
                    memories.append(r)
                elif isinstance(r, dict) and r.get("memory"):
                    memories.append(r["memory"])
            return memories
        except Exception as exc:
            logger.error("LongTermMemory.retrieve_memories error: %s", exc)
            return []
