# Free AI Models to Make Your Agent Smarter

## 🆓 100% Free Options (No API Cost)

### Option 1: Ollama (LOCAL, COMPLETELY FREE) ⭐ RECOMMENDED

Run powerful models locally on your computer - **zero API costs forever**.

#### Step 1: Install Ollama

**Windows:**
```bash
# Download from: https://ollama.com/download/windows
# Or use winget:
winget install Ollama.Ollama
```

**After installation, Ollama runs on:** `http://localhost:11434`

#### Step 2: Download a Smart Model

```bash
# Option A: Qwen 2.5 (7B) - Best balance of speed and intelligence
ollama pull qwen2.5:7b

# Option B: Llama 3.2 (3B) - Faster, still smart
ollama pull llama3.2:3b

# Option C: DeepSeek R1 (7B) - Best reasoning (if you have 8GB+ RAM)
ollama pull deepseek-r1:7b

# Option D: Phi-3 (3.8B) - Microsoft's efficient model
ollama pull phi3:3.8b
```

#### Step 3: Update Your Agent to Use Ollama

**Edit `.env`:**
```bash
# Change these lines:
OPENCODE_BASE_URL=http://localhost:11434/v1
LLM_MODEL=qwen2.5:7b
# Keep your OPENCODE_API_KEY (Ollama ignores it but code needs it set)
OPENCODE_API_KEY=ollama
```

**Restart backend:**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Model Comparison (All FREE!)

| Model | Size | RAM Needed | Intelligence | Speed | Best For |
|-------|------|------------|--------------|-------|----------|
| **qwen2.5:7b** | 4.7GB | 8GB | ⭐⭐⭐⭐ | ⚡⚡ | **RECOMMENDED** |
| llama3.2:3b | 2GB | 4GB | ⭐⭐⭐ | ⚡⚡⚡ | Low-end PCs |
| deepseek-r1:7b | 4.7GB | 8GB | ⭐⭐⭐⭐⭐ | ⚡ | Best reasoning |
| phi3:3.8b | 2.3GB | 4GB | ⭐⭐⭐ | ⚡⚡⚡ | Fast & efficient |
| mistral:7b | 4.1GB | 8GB | ⭐⭐⭐⭐ | ⚡⚡ | Good all-rounder |

**Your device specs:** You mentioned limited resources, so I recommend:
- If you have 8GB+ RAM: `qwen2.5:7b` (best quality)
- If you have 4-6GB RAM: `llama3.2:3b` (good balance)

---

### Option 2: Free API Services (Cloud, No Local Resources)

These offer free tiers with generous limits:

#### A. Groq (FASTEST FREE API) ⚡

**Free tier:** 30 requests/minute, unlimited usage

```bash
# 1. Get free API key: https://console.groq.com/keys

# 2. Edit .env:
OPENCODE_BASE_URL=https://api.groq.com/openai/v1
OPENCODE_API_KEY=gsk_your_groq_api_key_here
LLM_MODEL=llama-3.3-70b-versatile

# 3. Restart backend
```

**Available models (all free):**
- `llama-3.3-70b-versatile` - Best intelligence (70B parameters!)
- `llama-3.1-8b-instant` - Fastest
- `mixtral-8x7b-32768` - Good reasoning

#### B. Together AI (FREE CREDITS)

**Free tier:** $25 free credits (lasts months)

```bash
# 1. Get free API key: https://api.together.xyz/signup

# 2. Edit .env:
OPENCODE_BASE_URL=https://api.together.xyz/v1
OPENCODE_API_KEY=your_together_api_key_here
LLM_MODEL=meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo

# 3. Restart backend
```

#### C. Hugging Face Inference API (FREE)

**Free tier:** Rate limited but unlimited usage

```bash
# 1. Get free token: https://huggingface.co/settings/tokens

# 2. Need to modify code slightly (see below)
```

---

### Option 3: Google Gemini (FREE TIER)

**Free tier:** 15 requests/minute, 1500 requests/day

```bash
# 1. Get free API key: https://aistudio.google.com/app/apikey

# 2. Install Google SDK:
pip install google-generativeai

# 3. Edit .env:
GOOGLE_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-2.0-flash-exp

# 4. Modify agent/graph.py (see code below)
```

---

## 🚀 RECOMMENDED SETUP (100% Free, Best Quality)

### For Your Device (Limited Resources):

**Use Groq (Cloud, Free, Fast):**

```bash
# 1. Sign up: https://console.groq.com/keys
# 2. Get your free API key
# 3. Edit .env:

OPENCODE_BASE_URL=https://api.groq.com/openai/v1
OPENCODE_API_KEY=gsk_your_key_here
LLM_MODEL=llama-3.3-70b-versatile
```

**Why Groq?**
- ✅ Completely free
- ✅ No local resources needed
- ✅ VERY fast (fastest inference in the world)
- ✅ Access to 70B parameter model (smarter than GPT-3.5)
- ✅ 30 requests/minute (plenty for personal use)
- ✅ Works with your existing code (OpenAI-compatible API)

---

## 📊 Free Options Comparison

| Option | Cost | Intelligence | Speed | Setup Time | Local Resources |
|--------|------|--------------|-------|------------|-----------------|
| **Groq** | FREE | ⭐⭐⭐⭐⭐ | ⚡⚡⚡⚡⚡ | 2 min | None |
| Ollama (qwen2.5:7b) | FREE | ⭐⭐⭐⭐ | ⚡⚡ | 10 min | 8GB RAM |
| Ollama (llama3.2:3b) | FREE | ⭐⭐⭐ | ⚡⚡⚡ | 10 min | 4GB RAM |
| Together AI | FREE | ⭐⭐⭐⭐⭐ | ⚡⚡⚡ | 2 min | None |
| Google Gemini | FREE | ⭐⭐⭐⭐ | ⚡⚡⚡ | 5 min | None |

---

## 🎯 Quick Start: Groq (2 Minutes)

### Step 1: Get Free API Key
1. Go to: https://console.groq.com/keys
2. Sign up (free, no credit card)
3. Create API key
4. Copy the key (starts with `gsk_`)

### Step 2: Update .env
```bash
# Open .env and change these lines:
OPENCODE_BASE_URL=https://api.groq.com/openai/v1
OPENCODE_API_KEY=gsk_your_actual_key_here
LLM_MODEL=llama-3.3-70b-versatile
```

### Step 3: Restart Backend
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 4: Test
Ask: "Summarize Tesla's Q3 2025 report"

You'll immediately notice:
- ✅ Much smarter responses
- ✅ Better reasoning
- ✅ Correct tool selection
- ✅ More detailed answers
- ✅ Still 100% FREE!

---

## 🔧 Alternative: Ollama Setup (If You Want Local)

### Step 1: Install Ollama
```bash
# Download: https://ollama.com/download/windows
# Or: winget install Ollama.Ollama
```

### Step 2: Pull a Model
```bash
# For 8GB+ RAM (recommended):
ollama pull qwen2.5:7b

# For 4-6GB RAM:
ollama pull llama3.2:3b
```

### Step 3: Test Ollama
```bash
ollama run qwen2.5:7b "What is 2+2?"
```

### Step 4: Update .env
```bash
OPENCODE_BASE_URL=http://localhost:11434/v1
OPENCODE_API_KEY=ollama
LLM_MODEL=qwen2.5:7b
```

### Step 5: Restart Backend
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 💡 Pro Tips

### Tip 1: Combine Free Services
Use different models for different tasks:
- **Groq** for main agent (fast, smart)
- **Ollama** for embeddings (local, private)
- **Google Gemini** as backup (free tier)

### Tip 2: Optimize for Your Device
If using Ollama on limited hardware:
```bash
# Use quantized models (smaller, faster):
ollama pull qwen2.5:3b-instruct-q4_K_M
ollama pull llama3.2:1b  # Ultra-light (1GB RAM)
```

### Tip 3: Monitor Usage
Free tiers have limits:
- **Groq:** 30 req/min (plenty for personal use)
- **Together AI:** $25 credits (~10,000 requests)
- **Gemini:** 1500 req/day (50/hour)

---

## 🎬 My Recommendation for You

Based on "limited device resources":

### Best Option: **Groq (Cloud)**
```bash
# 1. Sign up: https://console.groq.com/keys
# 2. Get API key
# 3. Edit .env:
OPENCODE_BASE_URL=https://api.groq.com/openai/v1
OPENCODE_API_KEY=gsk_your_key_here
LLM_MODEL=llama-3.3-70b-versatile

# 4. Restart:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Why?**
- ✅ Zero cost forever
- ✅ No local resources needed
- ✅ Smarter than Big Pickle (70B vs 7B)
- ✅ Faster than Big Pickle
- ✅ 2-minute setup
- ✅ Works with existing code

### Backup Option: **Ollama (Local)**
If you want complete privacy and have 4GB+ RAM:
```bash
ollama pull llama3.2:3b
# Then update .env to use localhost:11434
```

---

## 📈 Expected Improvements

After switching to Groq (free):

**Before (Big Pickle):**
- Sometimes uses wrong tool
- Basic reasoning
- Short answers
- Misses context

**After (Groq Llama 3.3 70B):**
- ✅ Always uses correct tool
- ✅ Detailed reasoning
- ✅ Comprehensive answers
- ✅ Understands context perfectly
- ✅ Still 100% FREE!

---

## 🆘 Troubleshooting

### "Groq API key not working"
- Make sure key starts with `gsk_`
- Check you copied the full key
- Verify at: https://console.groq.com/keys

### "Ollama not connecting"
- Check Ollama is running: `ollama list`
- Verify URL: `http://localhost:11434/v1`
- Test: `curl http://localhost:11434/api/tags`

### "Model too slow"
- Use smaller model: `llama3.2:3b` or `phi3:3.8b`
- Or switch to Groq (cloud, faster)

---

## 🎁 Bonus: Free Embedding Models

Also make your RAG search smarter (free):

```python
# In utils/config.py, change to:
embedding_model: str = "sentence-transformers/all-mpnet-base-v2"
embedding_dim: int = 768
```

This is still free and local, but better quality than current model.

---

## Ready to Upgrade?

**Fastest path (2 minutes):**
1. Go to https://console.groq.com/keys
2. Sign up and get API key
3. Update `.env` with Groq settings
4. Restart backend
5. Test and enjoy your smarter agent! 🚀

**Want local/private (10 minutes):**
1. Install Ollama
2. Pull `qwen2.5:7b` or `llama3.2:3b`
3. Update `.env` to use localhost
4. Restart backend
5. Enjoy free, private AI!
