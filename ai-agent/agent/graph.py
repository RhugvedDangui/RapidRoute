"""
agent/graph.py
--------------
LangGraph ReAct agent loop.

Architecture
------------
    user message
        │
        ▼
    agent_node  ──(has tool_calls)──► tool_node
        ▲                                 │
        └─────────────────────────────────┘
        │
    (no tool_calls)
        │
        ▼
      END

The LLM (Big Pickle via OpenCode Zen) is bound to all five tools and will
autonomously decide when to call them, chain them, and when to stop.
"""

import json
import logging
from typing import Any, AsyncGenerator

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from langgraph.graph.message import MessagesState
from langgraph.prebuilt import ToolNode

from agent.memory import LongTermMemory, ShortTermMemory
from agent.prompts import build_system_prompt
from tools import ALL_TOOLS
from utils.config import get_settings
from utils.tracer import AgentSpan

logger = logging.getLogger(__name__)

# ── LLM singleton ─────────────────────────────────────────────────────────────


def _build_llm() -> ChatOpenAI:
    """Construct the ChatOpenAI client pointed at OpenCode Zen (Big Pickle)."""
    settings = get_settings()
    return ChatOpenAI(
        model=settings.llm_model,
        api_key=settings.opencode_api_key,
        base_url=settings.opencode_base_url,
        temperature=0.0,  # Set to 0 for maximum determinism and instruction-following
        max_tokens=4096,
    )


# ── node implementations ───────────────────────────────────────────────────────


def _make_agent_node(llm_with_tools: ChatOpenAI):
    """
    Return a callable node that invokes the LLM.

    The node reads the current message list from state, prepends the system
    prompt, calls Big Pickle, and appends the response.
    """

    def agent_node(state: MessagesState) -> dict[str, Any]:
        messages = state["messages"]
        response: AIMessage = llm_with_tools.invoke(messages)
        return {"messages": [response]}

    return agent_node


def _should_continue(state: MessagesState) -> str:
    """
    Routing function: go to tools if the last message has tool calls,
    otherwise end the loop.
    """
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return END


# ── graph factory ─────────────────────────────────────────────────────────────


def build_graph() -> StateGraph:
    """
    Build and compile the LangGraph ReAct StateGraph.

    Returns
    -------
    CompiledStateGraph
        The compiled graph ready for ``.invoke()`` calls.
    """
    settings = get_settings()  # noqa: F841 — kept for potential future use
    llm = _build_llm()
    llm_with_tools = llm.bind_tools(ALL_TOOLS)

    agent_node = _make_agent_node(llm_with_tools)
    tool_node = ToolNode(ALL_TOOLS)

    graph = StateGraph(MessagesState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)

    graph.set_entry_point("agent")
    graph.add_conditional_edges("agent", _should_continue, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")

    return graph.compile()


# ── high-level run function ────────────────────────────────────────────────────


async def run_agent(
    *,
    session_id: str,
    user_id: str,
    user_message: str,
    span: AgentSpan,
) -> dict[str, Any]:
    """
    Run the full ReAct agent for a single user turn.

    Steps
    -----
    1. Load short-term history from Redis.
    2. Retrieve long-term memories from mem0.
    3. Build system prompt with injected memories.
    4. Invoke the compiled LangGraph.
    5. Persist new messages back to Redis.
    6. Log tools used and final answer to Langfuse.
    7. Return structured response dict.

    Parameters
    ----------
    session_id:
        Unique identifier for the current chat session.
    user_id:
        Stable user identifier used for long-term memory lookup.
    user_message:
        The latest message from the user.
    span:
        Active Langfuse AgentSpan for tracing this request.

    Returns
    -------
    dict
        ``{"response": str, "tools_used": list, "sources": list, "session_id": str}``
    """
    stm = ShortTermMemory()
    ltm = LongTermMemory()

    # ── 1. history ────────────────────────────────────────────────────────────
    history = stm.get_history(session_id)

    # ── 2. long-term memories ─────────────────────────────────────────────────
    memories = ltm.retrieve_memories(user_id=user_id, query=user_message)
    span.log_event("memories_retrieved", {"count": len(memories), "user_id": user_id})

    # ── 3. system prompt ──────────────────────────────────────────────────────
    # Check if there are documents in the knowledge base
    try:
        from qdrant_client import QdrantClient
        settings_check = get_settings()
        qc = QdrantClient(url=settings_check.qdrant_url, api_key=settings_check.qdrant_api_key)
        collection_info = qc.get_collection(settings_check.qdrant_collection)
        doc_count = collection_info.points_count
        
        if doc_count > 0:
            # Add a hint about uploaded documents
            kb_hint = f"\n\n**IMPORTANT**: The knowledge base contains {doc_count} document chunks. When users ask about documents, reports, or specific information, ALWAYS try rag_search FIRST before web_search."
            memories_with_hint = (memories or []) + [kb_hint]
            system_prompt = build_system_prompt(memories_with_hint)
        else:
            system_prompt = build_system_prompt(memories)
    except Exception:
        # If we can't check, just build the normal prompt
        system_prompt = build_system_prompt(memories)

    # ── 4. assemble messages ──────────────────────────────────────────────────
    messages: list[Any] = [SystemMessage(content=system_prompt)]
    for msg in history:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role == "assistant":
            messages.append(AIMessage(content=content))

    # Add current user message
    messages.append(HumanMessage(content=user_message))

    # ── 5. invoke graph ───────────────────────────────────────────────────────
    graph = build_graph()
    result = graph.invoke({"messages": messages})

    final_messages = result["messages"]
    final_ai_message: AIMessage = final_messages[-1]
    raw_content: str = final_ai_message.content or ""

    # ── 6. parse structured output ────────────────────────────────────────────
    tools_used: list[str] = []
    sources: list[dict[str, str]] = []
    answer: str = raw_content

    try:
        # Strip markdown code fences if present
        cleaned = raw_content.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```", 2)[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        parsed = json.loads(cleaned.strip())
        answer = parsed.get("answer", raw_content)
        tools_used = parsed.get("tools_used", [])
        sources = parsed.get("sources", [])
    except (json.JSONDecodeError, IndexError):
        # Model did not respond with JSON — use raw text as answer
        logger.warning("Agent response was not valid JSON; using raw content.")

    # Collect tool names from actual tool calls in the message chain
    for msg in final_messages:
        if isinstance(msg, AIMessage) and msg.tool_calls:
            for tc in msg.tool_calls:
                name = tc.get("name", "")
                if name and name not in tools_used:
                    tools_used.append(name)

    # Collect tool results for source attribution
    for msg in final_messages:
        if isinstance(msg, ToolMessage):
            tool_name = msg.name or "unknown"
            content_snippet = (msg.content or "")[:200]
            sources.append({"tool": tool_name, "reference": tool_name, "snippet": content_snippet})

    # ── 7. persist to short-term memory ──────────────────────────────────────
    stm.append_message(session_id, "user", user_message)
    stm.append_message(session_id, "assistant", answer)

    # ── 8. log to Langfuse ────────────────────────────────────────────────────
    span.log_event(
        "agent_turn_complete",
        {"tools_used": tools_used, "sources_count": len(sources)},
    )

    return {
        "response": answer,
        "tools_used": tools_used,
        "sources": sources,
        "session_id": session_id,
    }


# ── streaming run function ────────────────────────────────────────────────────


async def stream_agent(
    *,
    session_id: str,
    user_id: str,
    user_message: str,
) -> AsyncGenerator[dict[str, Any], None]:
    """
    Stream the ReAct agent execution as a sequence of typed events.

    Each yielded dict has the shape::

        {"event": "<type>", "data": { ... }}

    Event types
    -----------
    ``thinking``
        The LLM produced a response (may contain tool calls).
        ``data`` keys: ``content`` (str), ``tool_calls`` (list).

    ``tool_call``
        The agent is about to invoke a tool.
        ``data`` keys: ``tool`` (str), ``args`` (dict).

    ``tool_result``
        A tool returned its result.
        ``data`` keys: ``tool`` (str), ``result`` (str snippet).

    ``answer``
        The final answer after the loop ends.
        ``data`` keys: ``response`` (str), ``tools_used`` (list),
        ``sources`` (list), ``session_id`` (str).

    ``error``
        An unhandled exception occurred.
        ``data`` keys: ``message`` (str).

    Parameters
    ----------
    session_id:
        Unique identifier for the current chat session.
    user_id:
        Stable user identifier used for long-term memory lookup.
    user_message:
        The latest message from the user.

    Yields
    ------
    dict
        Typed event dicts as described above.
    """
    stm = ShortTermMemory()
    ltm = LongTermMemory()

    # ── 1. history + memories ─────────────────────────────────────────────────
    history = stm.get_history(session_id)
    memories = ltm.retrieve_memories(user_id=user_id, query=user_message)
    
    # Check if there are documents in the knowledge base
    try:
        from qdrant_client import QdrantClient
        settings_check = get_settings()
        qc = QdrantClient(url=settings_check.qdrant_url, api_key=settings_check.qdrant_api_key)
        collection_info = qc.get_collection(settings_check.qdrant_collection)
        doc_count = collection_info.points_count
        
        if doc_count > 0:
            kb_hint = f"\n\n**IMPORTANT**: The knowledge base contains {doc_count} document chunks. When users ask about documents, reports, or specific information, ALWAYS try rag_search FIRST before web_search."
            memories_with_hint = (memories or []) + [kb_hint]
            system_prompt = build_system_prompt(memories_with_hint)
        else:
            system_prompt = build_system_prompt(memories)
    except Exception:
        system_prompt = build_system_prompt(memories)

    # ── 2. assemble messages ──────────────────────────────────────────────────
    messages: list[Any] = [SystemMessage(content=system_prompt)]
    for msg in history:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role == "assistant":
            messages.append(AIMessage(content=content))
    messages.append(HumanMessage(content=user_message))

    # ── 3. stream graph ───────────────────────────────────────────────────────
    graph = build_graph()
    tools_used: list[str] = []
    sources: list[dict[str, str]] = []
    final_answer: str = ""

    try:
        async for chunk in graph.astream(
            {"messages": messages},
            stream_mode="updates",
        ):
            # chunk is a dict like {"agent": state} or {"tools": state}
            for node_name, node_state in chunk.items():
                node_messages: list[Any] = node_state.get("messages", [])

                if node_name == "agent":
                    # LLM produced output
                    for msg in node_messages:
                        if not isinstance(msg, AIMessage):
                            continue

                        # Collect tool calls being requested
                        tc_list: list[dict[str, Any]] = []
                        if msg.tool_calls:
                            for tc in msg.tool_calls:
                                name = tc.get("name", "")
                                args = tc.get("args", {})
                                tc_list.append({"tool": name, "args": args})
                                if name and name not in tools_used:
                                    tools_used.append(name)
                                # Emit individual tool_call events
                                yield {"event": "tool_call", "data": {"tool": name, "args": args}}

                        # Emit thinking event
                        yield {
                            "event": "thinking",
                            "data": {
                                "content": msg.content or "",
                                "tool_calls": tc_list,
                            },
                        }

                elif node_name == "tools":
                    # Tool results came back
                    for msg in node_messages:
                        if not isinstance(msg, ToolMessage):
                            continue
                        tool_name = msg.name or "unknown"
                        snippet = (msg.content or "")[:300]
                        sources.append({
                            "tool": tool_name,
                            "reference": tool_name,
                            "snippet": snippet,
                        })
                        yield {
                            "event": "tool_result",
                            "data": {"tool": tool_name, "result": snippet},
                        }

    except Exception as exc:
        logger.exception("stream_agent error")
        yield {"event": "error", "data": {"message": str(exc)}}
        return

    # ── 4. extract final answer from last agent message ───────────────────────
    # Re-invoke to get the final state (astream gives us updates, not final state)
    # We already have all messages from streaming; find the last AIMessage content
    # that has no tool_calls (the final answer turn).
    # We need to do a final invoke to get the complete result reliably.
    try:
        result = graph.invoke({"messages": messages})
        final_messages = result["messages"]
        final_ai: AIMessage = final_messages[-1]
        raw_content: str = final_ai.content or ""

        answer = raw_content
        try:
            cleaned = raw_content.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("```", 2)[1]
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:]
            parsed = json.loads(cleaned.strip())
            answer = parsed.get("answer", raw_content)
            for t in parsed.get("tools_used", []):
                if t not in tools_used:
                    tools_used.append(t)
            for s in parsed.get("sources", []):
                sources.append(s)
        except (json.JSONDecodeError, IndexError):
            pass

        final_answer = answer

    except Exception as exc:
        logger.exception("stream_agent final invoke error")
        final_answer = "An error occurred while generating the final answer."

    # ── 5. persist to short-term memory ──────────────────────────────────────
    stm.append_message(session_id, "user", user_message)
    stm.append_message(session_id, "assistant", final_answer)

    # ── 6. emit final answer event ────────────────────────────────────────────
    yield {
        "event": "answer",
        "data": {
            "response": final_answer,
            "tools_used": tools_used,
            "sources": sources,
            "session_id": session_id,
        },
    }
