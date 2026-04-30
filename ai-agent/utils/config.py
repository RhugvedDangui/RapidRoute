"""
utils/config.py
---------------
Centralized configuration loaded from environment variables via pydantic-settings.
All services (LLM, Qdrant, Redis, mem0, Langfuse, Tavily) are configured here.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── LLM (OpenCode Zen / Big Pickle) ──────────────────────────────────────
    opencode_api_key: str
    opencode_base_url: str = "https://opencode.ai/zen/v1"
    llm_model: str = "big-pickle"

    # ── Tavily Web Search ─────────────────────────────────────────────────────
    tavily_api_key: str

    # ── Qdrant Vector DB ──────────────────────────────────────────────────────
    qdrant_url: str
    qdrant_api_key: str
    qdrant_collection: str = "agent_knowledge"

    # ── Upstash Redis (short-term memory) ────────────────────────────────────
    upstash_redis_url: str
    upstash_redis_token: str

    # ── mem0 (long-term memory) ───────────────────────────────────────────────
    mem0_api_key: str

    # ── Langfuse (tracing) ────────────────────────────────────────────────────
    langfuse_public_key: str
    langfuse_secret_key: str
    langfuse_host: str = "https://cloud.langfuse.com"

    # ── Embedding model (local, no API cost) ─────────────────────────────────
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_dim: int = 384

    # ── RAG chunking ──────────────────────────────────────────────────────────
    chunk_size: int = 512
    chunk_overlap: int = 50

    # ── Short-term memory ─────────────────────────────────────────────────────
    session_history_limit: int = 20
    session_ttl_seconds: int = 7200  # 2 hours

    # ── Long-term memory ──────────────────────────────────────────────────────
    long_term_top_k: int = 5

    # ── Supabase (database access) ────────────────────────────────────────────
    supabase_url: str = ""
    supabase_key: str = ""


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached singleton of Settings."""
    return Settings()
