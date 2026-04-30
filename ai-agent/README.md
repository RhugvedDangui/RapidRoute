# 🤖 AI Agent — Production-Ready General-Purpose Backend

A fully production-ready AI agent backend built with **FastAPI**, **LangGraph**, and **Big Pickle** (OpenCode Zen), featuring RAG, dual-layer memory, web search, image OCR, audio transcription, streaming SSE, and full observability via Langfuse.

---

## ✨ Architecture Overview

```
User Request
     │
     ▼
FastAPI  ──► LangGraph ReAct Loop  ──► SSE Stream (/chat/stream)
                  │
                  ▼
           Big Pickle LLM (OpenCode Zen)
                  │
         ┌────────┼────────────────────┐
         ▼        ▼                    ▼
    web_search  rag_search         calculator
    (Tavily)    (Qdrant + ST)      (numexpr)
                     │
               wikipedia_search   read_file
               (Wikipedia API)    (Redis)
                  │
         ┌────────┼────────────┐
         ▼        ▼            ▼
      Qdrant    Redis       mem0
     (vectors) (short-term) (long-term)
                  │
              Langfuse
             (tracing)

Ingest Pipeline:
  Documents → Unstructured → chunk → embed → Qdrant
  Images    → pytesseract OCR → chunk → embed → Qdrant
  Audio     → faster-whisper → chunk → embed → Qdrant
```

---

## 📁 Project Structure

```
agent/
├── main.py                  # FastAPI app entry point
├── agent/
│   ├── graph.py             # LangGraph ReAct loop + stream_agent()
│   ├── memory.py            # Short + long term memory managers
│   └── prompts.py           # System prompt + template builders
├── rag/
│   ├── ingest.py            # Parse → chunk → embed → upsert (docs/images/audio)
│   └── retriever.py         # Qdrant similarity search
├── api/
│   ├── routes.py            # FastAPI route handlers
│   └── schemas.py           # Pydantic request/response models
├── tools/
│   ├── web_search.py        # Tavily web search
│   ├── rag_search.py        # Qdrant semantic search
│   ├── calculator.py        # numexpr math
│   ├── wikipedia.py         # Wikipedia API
│   └── file_reader.py       # Redis file retrieval
├── utils/
│   ├── tracer.py            # Langfuse tracing wrapper
│   └── config.py            # Pydantic-settings config
├── ui.py                    # Gradio UI (streaming)
├── .env.example             # Environment variable template
├── requirements.txt         # All Python dependencies
└── README.md
```

---

## 🆓 Free Tier Setup

Sign up for all services (all free):

| Service | Free Tier | Sign-up URL |
|---------|-----------|-------------|
| **OpenCode Zen** (Big Pickle LLM) | Completely free during feedback period | https://opencode.ai/zen |
| **Qdrant Cloud** | 1 GB cluster | https://cloud.qdrant.io |
| **Upstash Redis** | 10 000 commands / day | https://upstash.com |
| **Tavily** | 1 000 searches / month | https://tavily.com |
| **mem0** | Free tier | https://app.mem0.ai |
| **Langfuse** | Free cloud | https://cloud.langfuse.com |

---

## 🚀 Setup & Installation

### 1. Clone & create environment

```bash
git clone <repo-url>
cd ai-agent

conda create -n shrishtiai python=3.11 -y
conda activate shrishtiai
```

### 2. Install system dependencies (for OCR)

```bash
# Windows: download installer from https://github.com/UB-Mannheim/tesseract/wiki
# Linux:
sudo apt install tesseract-ocr
# macOS:
brew install tesseract
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment

```bash
cp .env.example .env
# Open .env and fill in all API keys
```

### 5. Start the server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: **http://localhost:8000/docs**

---

## 🔌 API Endpoints

### `POST /ingest` — Ingest a document, image, or audio file

Supported file types:

| Category | Extensions |
|----------|-----------|
| Documents | PDF, DOCX, TXT, CSV, PPTX, XLSX, HTML |
| Images (OCR) | PNG, JPG, JPEG, BMP, TIFF, WEBP, GIF |
| Audio (Transcription) | MP3, WAV, M4A, OGG, FLAC, AAC, OPUS |

**Option A — File upload:**
```bash
curl -X POST http://localhost:8000/ingest \
  -F "file=@/path/to/document.pdf"

# Image OCR:
curl -X POST http://localhost:8000/ingest \
  -F "file=@/path/to/screenshot.png"

# Audio transcription:
curl -X POST http://localhost:8000/ingest \
  -F "file=@/path/to/meeting.mp3"
```

**Option B — URL:**
```bash
curl -X POST http://localhost:8000/ingest \
  -F "url=https://example.com/article"
```

**Response:**
```json
{
  "file_id": "a1b2c3d4e5f6-ab12cd34",
  "chunk_count": 42,
  "source": "document.pdf",
  "status": "success"
}
```

---

### `POST /chat` — Run the ReAct agent (blocking)

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session-001",
    "message": "What is the latest news about GPT-5?",
    "user_id": "user-42"
  }'
```

**Response:**
```json
{
  "session_id": "session-001",
  "response": "Based on my web search...",
  "tools_used": ["web_search"],
  "sources": [{"tool": "web_search", "reference": "https://...", "snippet": "..."}],
  "trace_url": "https://cloud.langfuse.com/trace/abc123"
}
```

---

### `POST /chat/stream` — Stream the ReAct agent as SSE ⚡

Real-time streaming of agent reasoning, tool calls, and the final answer.

```bash
curl -X POST http://localhost:8000/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"session_id": "s1", "message": "Latest AI news?", "user_id": "u1"}'
```

**SSE event stream:**
```
event: thinking
data: {"content": "", "tool_calls": [{"tool": "web_search", "args": {"query": "latest AI news"}}]}

event: tool_call
data: {"tool": "web_search", "args": {"query": "latest AI news"}}

event: tool_result
data: {"tool": "web_search", "result": "1. OpenAI announces..."}

event: thinking
data: {"content": "Based on the search results...", "tool_calls": []}

event: answer
data: {"response": "Here's the latest...", "tools_used": ["web_search"], "sources": [...], "session_id": "s1"}
```

**JavaScript example:**
```javascript
const resp = await fetch('/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ session_id: 'abc', message: 'Hello', user_id: 'u1' }),
});

const reader = resp.body.getReader();
const decoder = new TextDecoder();
let eventType = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const lines = decoder.decode(value).split('\n');
  for (const line of lines) {
    if (line.startsWith('event:')) eventType = line.slice(6).trim();
    if (line.startsWith('data:')) {
      const data = JSON.parse(line.slice(5).trim());
      console.log(eventType, data);
    }
  }
}
```

---

### `GET /history/{session_id}` — Retrieve conversation history

```bash
curl http://localhost:8000/history/session-001
```

---

### `POST /reset/{session_id}` — Clear session history

```bash
curl -X POST http://localhost:8000/reset/session-001
```

---

### `GET /health` — Check all service statuses

```bash
curl http://localhost:8000/health
```

---

## 🧠 Memory System

| Layer | Backend | Scope | TTL |
|-------|---------|-------|-----|
| Short-term | Upstash Redis | Per session, last 20 messages | 2 hours |
| Long-term | mem0 | Cross-session, per user | Permanent |

---

## 🔍 Tools

| Tool | Backend | Purpose |
|------|---------|---------|
| `web_search` | Tavily | Real-time web search, top 5 results |
| `rag_search` | Qdrant + sentence-transformers | Semantic search over ingested docs |
| `calculator` | numexpr | Safe math evaluation |
| `wikipedia_search` | Wikipedia API | Encyclopedic facts + URL |
| `read_file` | Redis | Fetch full parsed text of an uploaded file |

---

## 📊 Observability

Every `/chat` request is wrapped in a Langfuse trace. The `trace_url` in every response links directly to it.

---

## 🛡️ Error Handling

- Every tool catches all exceptions and returns a graceful error string.
- The global FastAPI exception handler catches unhandled errors.
- SSE stream emits an `error` event on failure instead of crashing.

---

## 📝 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENCODE_API_KEY` | ✅ | OpenCode Zen API key |
| `TAVILY_API_KEY` | ✅ | Tavily web search key |
| `QDRANT_URL` | ✅ | Qdrant Cloud cluster URL |
| `QDRANT_API_KEY` | ✅ | Qdrant Cloud API key |
| `UPSTASH_REDIS_URL` | ✅ | Upstash Redis REST URL |
| `UPSTASH_REDIS_TOKEN` | ✅ | Upstash Redis REST token |
| `MEM0_API_KEY` | ✅ | mem0 API key |
| `LANGFUSE_PUBLIC_KEY` | ✅ | Langfuse public key |
| `LANGFUSE_SECRET_KEY` | ✅ | Langfuse secret key |
| `LANGFUSE_HOST` | ✅ | Langfuse host (default: cloud) |

---

## ✨ Architecture Overview

```
User Request
     │
     ▼
FastAPI  ──► LangGraph ReAct Loop
                  │
                  ▼
           Big Pickle LLM (OpenCode Zen)
                  │
         ┌────────┼────────────────────┐
         ▼        ▼                    ▼
    web_search  rag_search         calculator
    (Tavily)    (Qdrant + ST)      (numexpr)
                     │
               wikipedia_search   read_file
               (Wikipedia API)    (Redis)
                  │
         ┌────────┼────────────┐
         ▼        ▼            ▼
      Qdrant    Redis       mem0
     (vectors) (short-term) (long-term)
                  │
              Langfuse
             (tracing)
```

---

## 📁 Project Structure

```
agent/
├── main.py                  # FastAPI app entry point
├── agent/
│   ├── graph.py             # LangGraph ReAct loop
│   ├── tools.py             # 5 tools (search, RAG, calc, wiki, file)
│   ├── memory.py            # Short + long term memory managers
│   └── prompts.py           # System prompt + template builders
├── rag/
│   ├── ingest.py            # Parse → chunk → embed → upsert
│   └── retriever.py         # Qdrant similarity search
├── api/
│   ├── routes.py            # FastAPI route handlers
│   └── schemas.py           # Pydantic request/response models
├── utils/
│   ├── tracer.py            # Langfuse tracing wrapper
│   └── config.py            # Pydantic-settings config
├── .env.example             # Environment variable template
├── requirements.txt         # All Python dependencies
└── README.md
```

---

## 🆓 Free Tier Setup

Sign up for all services (all free):

| Service | Free Tier | Sign-up URL |
|---------|-----------|-------------|
| **OpenCode Zen** (Big Pickle LLM) | Completely free during feedback period | https://opencode.ai/zen |
| **Qdrant Cloud** | 1 GB cluster | https://cloud.qdrant.io |
| **Upstash Redis** | 10 000 commands / day | https://upstash.com |
| **Tavily** | 1 000 searches / month | https://tavily.com |
| **mem0** | Free tier | https://app.mem0.ai |
| **Langfuse** | Free cloud | https://cloud.langfuse.com |

---

## 🚀 Setup & Installation

### 1. Clone & create environment

```bash
git clone <repo-url>
cd ai-agent

conda create -n shrishtiai python=3.11 -y
conda activate shrishtiai
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
# Open .env and fill in all API keys
```

### 4. Start the server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: **http://localhost:8000/docs**

---

## 🔌 API Endpoints

### `POST /ingest` — Ingest a document or URL

**Option A — File upload:**
```bash
curl -X POST http://localhost:8000/ingest \
  -F "file=@/path/to/document.pdf"
```

**Option B — URL:**
```bash
curl -X POST http://localhost:8000/ingest \
  -F "url=https://example.com/article"
```

**Response:**
```json
{
  "file_id": "a1b2c3d4e5f6-ab12cd34",
  "chunk_count": 42,
  "source": "document.pdf",
  "status": "success"
}
```

---

### `POST /chat` — Run the ReAct agent

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session-001",
    "message": "What is the latest news about GPT-5?",
    "user_id": "user-42"
  }'
```

**Response:**
```json
{
  "session_id": "session-001",
  "response": "Based on my web search...",
  "tools_used": ["web_search"],
  "sources": [
    {
      "tool": "web_search",
      "reference": "https://openai.com/blog/gpt-5",
      "snippet": "OpenAI announced..."
    }
  ],
  "trace_url": "https://cloud.langfuse.com/trace/abc123"
}
```

---

### `GET /history/{session_id}` — Retrieve conversation history

```bash
curl http://localhost:8000/history/session-001
```

**Response:**
```json
{
  "session_id": "session-001",
  "messages": [
    {"role": "user", "content": "What is the latest news about GPT-5?"},
    {"role": "assistant", "content": "Based on my web search..."}
  ]
}
```

---

### `POST /reset/{session_id}` — Clear session history

```bash
curl -X POST http://localhost:8000/reset/session-001
```

**Response:**
```json
{"session_id": "session-001", "status": "cleared"}
```

---

### `GET /health` — Check all service statuses

```bash
curl http://localhost:8000/health
```

**Response:**
```json
{
  "overall": "ok",
  "services": [
    {"name": "qdrant",   "status": "ok", "detail": "1 collections"},
    {"name": "redis",    "status": "ok", "detail": "PONG"},
    {"name": "tavily",   "status": "ok", "detail": ""},
    {"name": "langfuse", "status": "ok", "detail": ""},
    {"name": "mem0",     "status": "ok", "detail": ""}
  ]
}
```

---

## 🎬 End-to-End Demo Flow (for Judges)

This demo shows all major features in sequence.

### Step 1 — Health check
```bash
curl http://localhost:8000/health
# Verify all 5 services show "ok"
```

### Step 2 — Ingest a document
```bash
curl -X POST http://localhost:8000/ingest \
  -F "file=@sample_report.pdf"
# Note the returned file_id
```

### Step 3 — Ask a question that triggers RAG
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "demo-001",
    "message": "Summarise the key findings from the uploaded report.",
    "user_id": "judge-user"
  }'
# tools_used: ["rag_search"]
# sources: [{tool: "rag_search", ...}]
```

### Step 4 — Ask a real-time web question (triggers web_search)
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "demo-001",
    "message": "What happened in AI news this week?",
    "user_id": "judge-user"
  }'
# tools_used: ["web_search"]
```

### Step 5 — Math (triggers calculator)
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "demo-001",
    "message": "What is 2 ** 32 + sqrt(144)?",
    "user_id": "judge-user"
  }'
# tools_used: ["calculator"]
```

### Step 6 — Wikipedia lookup
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "demo-001",
    "message": "Give me a brief history of the Transformer architecture.",
    "user_id": "judge-user"
  }'
# tools_used: ["wikipedia_search"]
```

### Step 7 — Check conversation history
```bash
curl http://localhost:8000/history/demo-001
# Returns all 4 turns from steps 3-6
```

### Step 8 — View trace in Langfuse
Open the `trace_url` returned in any /chat response.
You will see the full reasoning chain, every tool call + result, latency, and token usage.

### Step 9 — Reset session
```bash
curl -X POST http://localhost:8000/reset/demo-001
```

---

## 🧠 Memory System

| Layer | Backend | Scope | TTL |
|-------|---------|-------|-----|
| Short-term | Upstash Redis | Per session, last 20 messages | 2 hours |
| Long-term | mem0 | Cross-session, per user | Permanent |

On each `/chat` call:
1. History is loaded from Redis and prepended to the LLM context.
2. Top-5 relevant memories are retrieved from mem0 and injected into the system prompt.
3. New messages are written back to Redis after the agent responds.

---

## 🔍 Tools

| Tool | Backend | Purpose |
|------|---------|---------|
| `web_search` | Tavily | Real-time web search, top 5 results |
| `rag_search` | Qdrant + sentence-transformers | Semantic search over ingested docs |
| `calculator` | numexpr | Safe math evaluation |
| `wikipedia_search` | Wikipedia API | Encyclopedic facts + URL |
| `read_file` | Redis | Fetch full parsed text of an uploaded file |

---

## 📊 Observability

Every `/chat` request is wrapped in a Langfuse trace that records:
- User input
- Each tool call with input, output, and latency
- Final response
- Total latency and token count
- Errors (if any)

The `trace_url` field in every `/chat` response links directly to the trace.

---

## 🛡️ Error Handling

- Every tool catches all exceptions and returns a graceful error string — the agent never crashes on a single tool failure.
- The global FastAPI exception handler catches any unhandled errors.
- All errors are logged to Langfuse as events for post-hoc debugging.

---

## 📝 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENCODE_API_KEY` | ✅ | OpenCode Zen API key |
| `TAVILY_API_KEY` | ✅ | Tavily web search key |
| `QDRANT_URL` | ✅ | Qdrant Cloud cluster URL |
| `QDRANT_API_KEY` | ✅ | Qdrant Cloud API key |
| `UPSTASH_REDIS_URL` | ✅ | Upstash Redis REST URL |
| `UPSTASH_REDIS_TOKEN` | ✅ | Upstash Redis REST token |
| `MEM0_API_KEY` | ✅ | mem0 API key |
| `LANGFUSE_PUBLIC_KEY` | ✅ | Langfuse public key |
| `LANGFUSE_SECRET_KEY` | ✅ | Langfuse secret key |
| `LANGFUSE_HOST` | ✅ | Langfuse host (default: cloud) |
