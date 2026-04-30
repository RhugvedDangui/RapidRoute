"""
main.py
-------
FastAPI application entry point.

Run with:
    uvicorn main:app --reload
"""

import logging
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.routes import router
from utils.config import get_settings

# ── logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

# ── settings ──────────────────────────────────────────────────────────────────
settings = get_settings()

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="AI Agent API",
    description=(
        "Production-ready general-purpose AI agent powered by "
        "Big Pickle (OpenCode Zen), LangGraph ReAct loop, Qdrant RAG, "
        "Redis short-term memory, mem0 long-term memory, and Langfuse tracing."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── routers ───────────────────────────────────────────────────────────────────
app.include_router(router)


# ── global exception handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception):
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please check the server logs."},
    )


# ── startup / shutdown events ─────────────────────────────────────────────────
@app.on_event("startup")
async def on_startup() -> None:
    logger.info("🚀 AI Agent API starting up — model=%s", settings.llm_model)
    logger.info("📡 Qdrant: %s", settings.qdrant_url)
    logger.info("🧠 Langfuse: %s", settings.langfuse_host)


@app.on_event("shutdown")
async def on_shutdown() -> None:
    logger.info("👋 AI Agent API shutting down.")
