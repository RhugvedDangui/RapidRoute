# How to Make Your AI Agent Smarter

Your agent is currently using **Big Pickle** which is a smaller, faster model. Here are multiple ways to significantly improve its intelligence:

---

## 🚀 Option 1: Upgrade to a Smarter Model (EASIEST & MOST EFFECTIVE)

### Available Models on OpenCode Zen

Check available models at: https://opencode.ai/zen/models

**Recommended upgrades (in order of intelligence):**

1. **DeepSeek R1** (Best reasoning, best for complex tasks)
   ```bash
   LLM_MODEL=deepseek-r1
   ```
   - ✅ Excellent reasoning and planning
   - ✅ Better tool selection
   - ✅ More accurate answers
   - ⚠️ Slower and more expensive

2. **Claude 3.5 Sonnet** (Best balance)
   ```bash
   LLM_MODEL=claude-3-5-sonnet-20241022
   ```
   - ✅ Excellent at following instructions
   - ✅ Great tool calling
   - ✅ Fast and accurate
   - ⚠️ More expensive than Big Pickle

3. **GPT-4o** (OpenAI's best)
   ```bash
   LLM_MODEL=gpt-4o
   ```
   - ✅ Very good reasoning
   - ✅ Reliable tool calling
   - ⚠️ More expensive

4. **Gemini 2.0 Flash** (Fast and smart)
   ```bash
   LLM_MODEL=gemini-2.0-flash-exp
   ```
   - ✅ Fast
   - ✅ Good reasoning
   - ✅ Cheaper than GPT-4

### How to Upgrade

1. **Edit `.env` file:**
   ```bash
   # Change this line:
   LLM_MODEL=big-pickle
   
   # To one of these:
   LLM_MODEL=deepseek-r1           # Best reasoning
   LLM_MODEL=claude-3-5-sonnet-20241022  # Best balance
   LLM_MODEL=gpt-4o                # OpenAI's best
   LLM_MODEL=gemini-2.0-flash-exp  # Fast & smart
   ```

2. **Restart backend:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Test immediately** - you'll notice the difference!

---

## 🧠 Option 2: Add Chain-of-Thought Reasoning

Make the agent think step-by-step before acting.

### Update the System Prompt

Edit `agent/prompts.py` and add this to the system prompt:

```python
REASONING PROCESS (THINK STEP-BY-STEP):
Before taking any action, you MUST think through:
1. What is the user really asking for?
2. What information do I need to answer this?
3. Which tool(s) would give me that information?
4. What's my search strategy?
5. How will I synthesize the results?

Example thinking:
"User asks about Tesla Q3 revenue. This is financial data from a report.
Step 1: Check if we have uploaded documents → use rag_search
Step 2: Search for 'Tesla Q3 2025 revenue profit financial results'
Step 3: If found, extract the numbers and summarize
Step 4: If not found, explain what's missing"
```

---

## 📊 Option 3: Add Few-Shot Examples

Teach the agent by showing examples of good behavior.

### Add to System Prompt

```python
EXAMPLES OF CORRECT TOOL USAGE:

Example 1: Document Question
User: "What were Tesla's Q3 earnings?"
Correct: Use rag_search("Tesla Q3 earnings revenue profit")
Wrong: Use web_search (documents are uploaded!)

Example 2: Current Events
User: "What's the latest news about Tesla stock?"
Correct: Use web_search("Tesla stock news today")
Wrong: Use rag_search (this is real-time data)

Example 3: Calculation
User: "If Tesla made $28.1B in Q3 and $25.2B in Q2, what's the growth?"
Correct: Use calculator("(28.1 - 25.2) / 25.2 * 100")
Wrong: Try to calculate in your head (use the tool!)
```

---

## 🎯 Option 4: Improve Tool Descriptions

Make tool descriptions more explicit about when to use them.

### Update `tools/rag_search.py`

Already done! But you can make it even more explicit:

```python
@tool
def rag_search(query: str, top_k: int = 5) -> str:
    """
    🔍 PRIMARY TOOL: Search uploaded documents FIRST before trying anything else.
    
    USE THIS WHEN:
    - User mentions a company name (Tesla, Apple, Google, etc.)
    - User asks about reports, documents, PDFs
    - User asks "what does the document say"
    - User asks about financial data (revenue, profit, earnings)
    - User asks to summarize or analyze uploaded content
    - You're not sure if it's in documents (TRY THIS FIRST!)
    
    DO NOT USE web_search until you've tried this and got "No relevant documents found"
    """
```

---

## 🔧 Option 5: Increase Temperature for Creativity (or Decrease for Precision)

Currently set to `0.0` (maximum precision, minimum creativity).

### Edit `agent/graph.py`

```python
def _build_llm() -> ChatOpenAI:
    settings = get_settings()
    return ChatOpenAI(
        model=settings.llm_model,
        api_key=settings.opencode_api_key,
        base_url=settings.opencode_base_url,
        temperature=0.1,  # Increase from 0.0 for slightly more creative responses
        max_tokens=4096,
    )
```

**Temperature guide:**
- `0.0` = Deterministic, follows instructions exactly (current)
- `0.1-0.3` = Slightly creative, still reliable
- `0.5-0.7` = More creative, less predictable
- `0.8-1.0` = Very creative, might ignore instructions

---

## 🎓 Option 6: Add Self-Reflection

Make the agent check its own work.

### Add a Reflection Step

Edit `agent/prompts.py`:

```python
SELF-REFLECTION CHECKLIST:
Before giving your final answer, ask yourself:
✓ Did I use the right tool for this question?
✓ Did I search with good keywords?
✓ Did I find relevant information?
✓ Does my answer actually address what the user asked?
✓ Did I cite my sources correctly?
✓ Is there anything I should double-check?

If any answer is "no", revise your approach!
```

---

## 🔄 Option 7: Add Multi-Step Reasoning

Allow the agent to chain multiple tool calls intelligently.

### Update System Prompt

```python
MULTI-STEP REASONING:
You can call multiple tools in sequence. For complex questions:

1. Break down the question into sub-questions
2. Answer each sub-question with the appropriate tool
3. Synthesize the results into a complete answer

Example:
User: "Compare Tesla's Q3 and Q4 2025 revenue"
Step 1: rag_search("Tesla Q3 2025 revenue") → Get Q3 number
Step 2: rag_search("Tesla Q4 2025 revenue") → Get Q4 number  
Step 3: calculator("(Q4 - Q3) / Q3 * 100") → Calculate growth
Step 4: Synthesize: "Q3 was $X, Q4 was $Y, growth was Z%"
```

---

## 🏆 Option 8: Use a Smarter Embedding Model

Improve semantic search quality.

### Current Model
`sentence-transformers/all-MiniLM-L6-v2` (384 dimensions, fast but basic)

### Upgrade Options

Edit `utils/config.py`:

```python
# Option 1: Better general-purpose model
embedding_model: str = "sentence-transformers/all-mpnet-base-v2"
embedding_dim: int = 768

# Option 2: Best for semantic search (slower but more accurate)
embedding_model: str = "BAAI/bge-large-en-v1.5"
embedding_dim: int = 1024

# Option 3: OpenAI embeddings (requires API, very good)
# Would need code changes to use OpenAI API
```

**⚠️ Warning:** Changing embedding model requires re-ingesting all documents!

---

## 📈 Option 9: Add Query Expansion

Make searches smarter by expanding the query.

### Create `rag/query_expansion.py`

```python
def expand_query(original_query: str) -> list[str]:
    """
    Expand a query into multiple variations for better recall.
    
    Example:
    "Tesla Q3 revenue" → [
        "Tesla Q3 revenue",
        "Tesla third quarter revenue",
        "Tesla Q3 2025 financial results",
        "Tesla quarterly earnings Q3"
    ]
    """
    # Add synonyms, variations, etc.
    pass
```

Then search with all variations and combine results.

---

## 🎯 RECOMMENDED QUICK WINS

### For Immediate Improvement (5 minutes):

1. **Change model to Claude 3.5 Sonnet:**
   ```bash
   # In .env
   LLM_MODEL=claude-3-5-sonnet-20241022
   ```

2. **Increase temperature slightly:**
   ```python
   # In agent/graph.py
   temperature=0.1  # From 0.0
   ```

3. **Restart backend:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Expected Improvements:
- ✅ Better understanding of context
- ✅ More accurate tool selection
- ✅ Better reasoning in the "thinking" section
- ✅ More natural language responses
- ✅ Fewer mistakes

---

## 💰 Cost Considerations

**Big Pickle (current):**
- Very cheap
- Fast
- Basic reasoning

**Claude 3.5 Sonnet:**
- ~10x more expensive
- Still fast
- Excellent reasoning
- **BEST BANG FOR BUCK**

**DeepSeek R1:**
- ~5x more expensive than Big Pickle
- Slower (more thinking)
- Best reasoning
- **BEST FOR COMPLEX TASKS**

**GPT-4o:**
- ~15x more expensive
- Fast
- Very good reasoning

---

## 🧪 Testing After Upgrade

After making changes, test with these questions:

1. **Simple retrieval:**
   ```
   What were Tesla's Q3 2025 revenue numbers?
   ```
   Expected: Should find exact numbers from PDF

2. **Complex reasoning:**
   ```
   Compare Tesla's Q3 and Q4 2025 performance and tell me which quarter was better
   ```
   Expected: Should retrieve both, compare, and give analysis

3. **Multi-step:**
   ```
   What was Tesla's revenue growth from Q3 to Q4 2025 in percentage?
   ```
   Expected: Should retrieve both numbers, use calculator, give answer

4. **Ambiguous:**
   ```
   Tell me about Tesla's recent performance
   ```
   Expected: Should search documents first, then provide summary

---

## 📊 Comparison Table

| Model | Intelligence | Speed | Cost | Best For |
|-------|-------------|-------|------|----------|
| Big Pickle | ⭐⭐ | ⚡⚡⚡ | 💰 | Simple tasks, testing |
| Gemini 2.0 Flash | ⭐⭐⭐ | ⚡⚡⚡ | 💰💰 | Fast & smart balance |
| Claude 3.5 Sonnet | ⭐⭐⭐⭐ | ⚡⚡ | 💰💰💰 | **RECOMMENDED** |
| GPT-4o | ⭐⭐⭐⭐ | ⚡⚡ | 💰💰💰💰 | OpenAI ecosystem |
| DeepSeek R1 | ⭐⭐⭐⭐⭐ | ⚡ | 💰💰 | Complex reasoning |

---

## 🎬 Quick Start: Make It 10x Smarter in 2 Minutes

```bash
# 1. Edit .env
nano .env
# Change: LLM_MODEL=claude-3-5-sonnet-20241022

# 2. Restart
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 3. Test
# Ask: "Summarize the key highlights from Tesla's Q3 2025 report"
```

You'll immediately notice:
- ✅ Better understanding
- ✅ More detailed thinking
- ✅ More accurate answers
- ✅ Better tool selection
