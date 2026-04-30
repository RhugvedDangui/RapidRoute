"""
ui.py
-----
Gradio interface for the AI Research Agent backend (http://localhost:8000).

Run with:
    python ui.py

Requires:
    pip install gradio requests
"""

from __future__ import annotations

import json
import uuid
from typing import Any, Generator

import gradio as gr
import requests

# ── Backend base URL ──────────────────────────────────────────────────────────
BASE_URL = "http://localhost:8000"
HEADERS = {"Content-Type": "application/json"}
GRADIO_USER_ID = "gradio-user"

# ── Backend helper functions ───────────────────────────────────────────────────


def _post_chat(session_id: str, message: str) -> dict[str, Any]:
    """
    Call POST /chat and return the parsed JSON response.

    Returns a dict with keys: response, tools_used, sources, trace_url.
    Raises ``ConnectionError`` if the backend is unreachable.
    """
    payload = {
        "session_id": session_id,
        "message": message,
        "user_id": GRADIO_USER_ID,
    }
    resp = requests.post(f"{BASE_URL}/chat", json=payload, timeout=120)
    resp.raise_for_status()
    return resp.json()


def _stream_chat(session_id: str, message: str) -> Generator[dict[str, Any], None, None]:
    """
    Call POST /chat/stream and yield parsed SSE events.

    Each yielded dict has keys: ``event`` (str) and ``data`` (dict).
    """
    payload = {
        "session_id": session_id,
        "message": message,
        "user_id": GRADIO_USER_ID,
    }
    with requests.post(
        f"{BASE_URL}/chat/stream",
        json=payload,
        stream=True,
        timeout=180,
    ) as resp:
        resp.raise_for_status()
        event_type = "message"
        for raw_line in resp.iter_lines(decode_unicode=True):
            if not raw_line:
                event_type = "message"  # reset after blank line
                continue
            if raw_line.startswith("event:"):
                event_type = raw_line[len("event:"):].strip()
            elif raw_line.startswith("data:"):
                raw_data = raw_line[len("data:"):].strip()
                try:
                    data = json.loads(raw_data)
                except json.JSONDecodeError:
                    data = {"raw": raw_data}
                yield {"event": event_type, "data": data}


def _get_history(session_id: str) -> list[dict[str, str]]:
    """
    Call GET /history/{session_id} and return the messages list.

    Each item: {"role": "user"|"assistant", "content": str}
    """
    resp = requests.get(f"{BASE_URL}/history/{session_id}", timeout=10)
    resp.raise_for_status()
    data = resp.json()
    return data.get("messages", [])


def _post_reset(session_id: str) -> None:
    """Call POST /reset/{session_id} to clear the session from Redis."""
    requests.post(f"{BASE_URL}/reset/{session_id}", timeout=10)


def _post_ingest(file_path: str, filename: str) -> dict[str, Any]:
    """
    Call POST /ingest with a multipart file upload.

    Parameters
    ----------
    file_path:
        Local temp path of the uploaded file (provided by gr.File).
    filename:
        Original filename (used as the source label in Qdrant).
    """
    with open(file_path, "rb") as fh:
        resp = requests.post(
            f"{BASE_URL}/ingest",
            files={"file": (filename, fh)},
            timeout=120,
        )
    resp.raise_for_status()
    return resp.json()


# ── Conversion helpers ────────────────────────────────────────────────────────


def _history_to_messages(
    raw: list[dict[str, str]],
) -> list[dict[str, str]]:
    """
    Convert backend history list → Gradio ``type='messages'`` format.

    Gradio expects: [{"role": "user"|"assistant", "content": str}, ...]
    """
    messages: list[dict[str, str]] = []
    for item in raw:
        role = item.get("role", "user")
        content = item.get("content", "")
        if role in ("user", "assistant"):
            messages.append({"role": role, "content": content})
    return messages


def _build_thought_dropdown(
    thinking_content: list[str],
    tools_used: list[str],
    sources: list[dict[str, str]],
    tool_events: list[str],
) -> str:
    """Build a collapsible 'Thought' dropdown with all thinking steps."""
    if not thinking_content and not tools_used:
        return ""
    
    # Build the thought content
    thought_lines = []
    
    if thinking_content:
        thought_lines.append("**🧠 Agent Reasoning:**")
        for line in thinking_content:
            thought_lines.append(f"- {line}")
    
    if tools_used:
        thought_lines.append(f"\n**🛠️ Tools Used:** {', '.join(f'`{t}`' for t in tools_used)}")
    
    if sources:
        thought_lines.append("\n**📚 Sources:**")
        for i, src in enumerate(sources[:5], 1):
            tool = src.get("tool", "unknown")
            snippet = src.get("snippet", "")[:150]
            thought_lines.append(f"{i}. `{tool}`: _{snippet}_")
    
    thought_content = "\n".join(thought_lines)
    
    # Return as collapsible HTML details with "Thought" label
    return f"""
<details>
<summary><strong>💭 Thought</strong></summary>

{thought_content}

</details>
"""


def _build_trace_details(
    tools_used: list[str],
    sources: list[dict[str, str]],
    live_events: list[str],
) -> str:
    """Build a collapsible HTML details section with the tool trace."""
    if not tools_used and not live_events:
        return ""
    
    # Build the trace content
    trace_lines = []
    
    if live_events:
        trace_lines.append("**🔄 Agent Trace:**")
        for event in live_events:
            trace_lines.append(f"- {event}")
    
    if tools_used:
        trace_lines.append(f"\n**🛠️ Tools Used:** {', '.join(f'`{t}`' for t in tools_used)}")
    
    if sources:
        trace_lines.append("\n**📚 Sources:**")
        for i, src in enumerate(sources[:5], 1):  # Limit to 5 sources
            tool = src.get("tool", "unknown")
            snippet = src.get("snippet", "")[:150]
            trace_lines.append(f"{i}. `{tool}`: _{snippet}_")
    
    trace_content = "\n".join(trace_lines)
    
    # Return as collapsible HTML details
    return f"""
<details>
<summary><strong>🔍 View Tool Trace & Sources</strong></summary>

{trace_content}

</details>
"""


def _build_stream_trace(
    tools_used: list[str],
    sources: list[dict[str, str]],
    live_events: list[str],
) -> str:
    """Build the final tool trace markdown after streaming completes."""
    parts: list[str] = []

    if live_events:
        parts.append("### 🔄 Agent Trace\n" + "\n\n".join(live_events))

    if tools_used:
        parts.append("### 🛠️ Tools Used\n" + ", ".join(f"`{t}`" for t in tools_used))
    else:
        parts.append("### 🛠️ Tools Used\n_No tools called._")

    if sources:
        lines = ["### 📚 Sources"]
        for i, src in enumerate(sources, 1):
            tool = src.get("tool", "unknown")
            snippet = src.get("snippet", "")[:200]
            lines.append(f"**{i}. [{tool}]**\n> {snippet}")
        parts.append("\n".join(lines))

    return "\n\n---\n\n".join(parts)


def _format_tool_trace(api_response: dict[str, Any]) -> str:
    """
    Build the markdown string shown inside the Tool Trace accordion.

    Extracts: thinking, tools_used, sources from the raw API response.
    Also tries to parse the ``response`` field as JSON in case the model
    returned structured output inside it.
    """
    # The model is instructed to return JSON with thinking / answer / sources
    # Try to parse it from the ``response`` field first
    thinking: str = ""
    tools_used: list[str] = api_response.get("tools_used", [])
    sources: list[dict[str, str]] = api_response.get("sources", [])
    trace_url: str = api_response.get("trace_url", "")

    raw_response: str = api_response.get("response", "")
    try:
        cleaned = raw_response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```", 2)[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        parsed = json.loads(cleaned.strip())
        thinking = parsed.get("thinking", "")
        if not tools_used:
            tools_used = parsed.get("tools_used", [])
        if not sources:
            sources = parsed.get("sources", [])
    except (json.JSONDecodeError, IndexError):
        pass

    parts: list[str] = []

    # Thinking section
    if thinking:
        parts.append(f"### 🧠 Thinking\n{thinking}")
    else:
        parts.append("### 🧠 Thinking\n_No thinking field returned._")

    # Tools used
    if tools_used:
        tools_str = ", ".join(f"`{t}`" for t in tools_used)
        parts.append(f"### 🛠️ Tools Used\n{tools_str}")
    else:
        parts.append("### 🛠️ Tools Used\n_No tools called._")

    # Sources
    if sources:
        source_lines = ["### 📚 Sources"]
        for i, src in enumerate(sources, start=1):
            tool = src.get("tool", "unknown")
            ref = src.get("reference", "")
            snippet = src.get("snippet", "")[:200]
            source_lines.append(f"**{i}. [{tool}]** → {ref}\n> {snippet}")
        parts.append("\n".join(source_lines))
    else:
        parts.append("### 📚 Sources\n_No sources cited._")

    # Langfuse trace link
    if trace_url:
        parts.append(f"### 🔗 Langfuse Trace\n[View full trace]({trace_url})")

    return "\n\n---\n\n".join(parts)


# ── Event handlers ────────────────────────────────────────────────────────────


def handle_send(
    user_message: str,
    chat_history: list[dict[str, str]],
    session_id: str,
) -> Generator[tuple[list[dict[str, str]], str, str], None, None]:
    """
    Handle the Send button click — streams the agent response via SSE.

    Shows thinking in real-time, then collapses it into a dropdown when done.
    """
    if not user_message.strip():
        yield chat_history, "", "_(No message sent.)_"
        return

    # Optimistically append user message
    chat_history = chat_history + [{"role": "user", "content": user_message}]
    # Placeholder for the assistant turn (will be updated incrementally)
    chat_history = chat_history + [{"role": "assistant", "content": "⏳ _Thinking…_"}]
    yield chat_history, "", "_(Streaming…)_"

    tool_events: list[str] = []
    tools_used: list[str] = []
    sources: list[dict[str, str]] = []
    answer = ""
    thinking_content: list[str] = []

    try:
        for sse in _stream_chat(session_id=session_id, message=user_message):
            event = sse["event"]
            data = sse["data"]

            if event == "thinking":
                content = data.get("content", "")
                tcs = data.get("tool_calls", [])
                
                if content:
                    thinking_content.append(f"💭 {content[:300]}")
                
                if tcs:
                    for tc in tcs:
                        thinking_line = f"🔧 **Calling** `{tc['tool']}` with: `{str(tc.get('args', {}))[:100]}`"
                        thinking_content.append(thinking_line)
                        tool_events.append(thinking_line)
                
                # Show live thinking (last 5 lines)
                live_thinking = "\n\n".join(thinking_content[-5:])
                chat_history[-1] = {
                    "role": "assistant",
                    "content": f"**🧠 Thinking...**\n\n{live_thinking}"
                }
                yield chat_history, "", "_(Agent is thinking...)_"

            elif event == "tool_call":
                tool = data.get("tool", "")
                args = data.get("args", {})
                if tool not in tools_used:
                    tools_used.append(tool)
                
                thinking_line = f"🛠️ **Executing** `{tool}`"
                thinking_content.append(thinking_line)
                tool_events.append(f"🛠️ **Tool**: `{tool}` → args: `{args}`")
                
                live_thinking = "\n\n".join(thinking_content[-5:])
                chat_history[-1] = {
                    "role": "assistant",
                    "content": f"**🧠 Thinking...**\n\n{live_thinking}"
                }
                yield chat_history, "", "_(Executing tools...)_"

            elif event == "tool_result":
                tool = data.get("tool", "")
                result = data.get("result", "")
                sources.append({"tool": tool, "reference": tool, "snippet": result})
                
                thinking_line = f"✅ **Got result from** `{tool}`"
                thinking_content.append(thinking_line)
                tool_events.append(f"✅ **Result from** `{tool}`: _{result[:100]}…_")
                
                live_thinking = "\n\n".join(thinking_content[-5:])
                chat_history[-1] = {
                    "role": "assistant",
                    "content": f"**🧠 Thinking...**\n\n{live_thinking}"
                }
                yield chat_history, "", "_(Processing results...)_"

            elif event == "answer":
                answer = data.get("response", "")
                tools_used = data.get("tools_used", tools_used)
                raw_sources = data.get("sources", sources)
                
                # Build the collapsible "Thought" section with all thinking
                thought_details = _build_thought_dropdown(thinking_content, tools_used, raw_sources, tool_events)
                
                # Combine answer with collapsible thought
                full_response = f"{answer}\n\n{thought_details}"
                
                # Update the last assistant message
                chat_history[-1] = {"role": "assistant", "content": full_response}
                
                # Build final trace for the side panel
                final_trace = _build_stream_trace(tools_used, raw_sources, tool_events)
                yield chat_history, "", final_trace
                return

            elif event == "error":
                error_msg = data.get("message", "Unknown error")
                chat_history[-1] = {
                    "role": "assistant",
                    "content": f"⚠️ **Agent error:** {error_msg}",
                }
                yield chat_history, "", f"_(Error: {error_msg})_"
                return

    except requests.ConnectionError:
        chat_history[-1] = {
            "role": "assistant",
            "content": (
                "⚠️ **Backend not reachable.** Start it with:\n"
                "```\nuvicorn main:app --reload\n```"
            ),
        }
        yield chat_history, "", "_(Backend unreachable.)_"
    except Exception as exc:
        chat_history[-1] = {"role": "assistant", "content": f"⚠️ **Error:** `{exc}`"}
        yield chat_history, "", f"_(Error: {exc})_"


def handle_clear(
    session_id: str,
) -> tuple[list[dict[str, str]], str]:
    """
    Handle the Clear Chat button.

    Calls POST /reset/{session_id} on the backend and clears the UI.
    """
    try:
        _post_reset(session_id)
    except Exception:
        pass  # Clear locally even if backend call fails
    return [], "_(Chat cleared.)_"


def handle_session_change(
    session_id: str,
) -> tuple[list[dict[str, str]], str]:
    """
    When the session ID textbox changes, reload history from the backend.
    """
    if not session_id.strip():
        return [], "_(Enter a valid session ID.)_"
    try:
        raw_history = _get_history(session_id)
        messages = _history_to_messages(raw_history)
        trace_info = f"_(Loaded {len(messages)} messages for session `{session_id}`.)_"
        return messages, trace_info
    except requests.ConnectionError:
        return [], "_(Backend not reachable.)_"
    except Exception as exc:
        return [], f"_(Error loading history: {exc})_"


def handle_upload(
    file_objs: list[Any] | Any,
) -> str:
    """
    Handle the Upload & Ingest button for single or multiple files.

    Parameters
    ----------
    file_objs:
        Single file object or list of file objects from Gradio.

    Returns
    -------
    str
        Status message to show in the status textbox.
    """
    if file_objs is None:
        return "⚠️ No files selected."
    
    # Normalize to list
    if not isinstance(file_objs, list):
        file_objs = [file_objs]
    
    if len(file_objs) == 0:
        return "⚠️ No files selected."
    
    results = []
    success_count = 0
    fail_count = 0
    
    for file_obj in file_objs:
        # Gradio provides the temp file path as a string or NamedString
        file_path: str = file_obj if isinstance(file_obj, str) else file_obj.name
        # Try to get the original filename
        orig_name: str = getattr(file_obj, "orig_name", None) or file_path.split("\\")[-1].split("/")[-1]

        try:
            result = _post_ingest(file_path=file_path, filename=orig_name)
            file_id = result.get("file_id", "unknown")
            chunk_count = result.get("chunk_count", 0)
            status = result.get("status", "unknown")
            source = result.get("source", orig_name)
            
            results.append(
                f"✅ **{source}**\n"
                f"   - File ID: `{file_id}`\n"
                f"   - Chunks: {chunk_count}\n"
                f"   - Status: {status}"
            )
            success_count += 1
            
        except requests.ConnectionError:
            results.append(f"⚠️ **{orig_name}**: Backend not reachable")
            fail_count += 1
        except Exception as exc:
            results.append(f"⚠️ **{orig_name}**: {str(exc)[:100]}")
            fail_count += 1
    
    # Build summary
    summary = f"### 📊 Upload Summary\n\n"
    summary += f"**Total files:** {len(file_objs)} | "
    summary += f"**Success:** {success_count} | "
    summary += f"**Failed:** {fail_count}\n\n"
    summary += "---\n\n"
    summary += "\n\n".join(results)
    summary += "\n\n_You can now ask the agent questions about these files._"
    
    return summary


# ── Gradio UI ─────────────────────────────────────────────────────────────────


def build_ui() -> gr.Blocks:
    """Construct and return the Gradio Blocks interface."""

    with gr.Blocks(
        title="🤖 AI Research Agent",
    ) as demo:

        # ── Header ────────────────────────────────────────────────────────────
        gr.Markdown(
            """
# 🤖 AI Research Agent
**Powered by Big Pickle (OpenCode Zen) · RAG + Web Search + Memory**

> Connect your documents, ask anything, and watch the agent reason step-by-step.
"""
        )

        with gr.Tabs():

            # ══════════════════════════════════════════════════════════════════
            # TAB 1 — Chat
            # ══════════════════════════════════════════════════════════════════
            with gr.TabItem("💬 Chat"):

                with gr.Row():
                    session_id_box = gr.Textbox(
                        label="Session ID",
                        value=lambda: str(uuid.uuid4()),
                        placeholder="Auto-generated UUID (change to switch sessions)",
                        scale=3,
                        interactive=True,
                    )

                chatbot = gr.Chatbot(
                    height=500,
                    label="Agent",
                    avatar_images=(
                        None,
                        "https://api.dicebear.com/9.x/bottts/svg?seed=agent",
                    ),
                )

                with gr.Row():
                    msg_box = gr.Textbox(
                        placeholder="Ask me anything…",
                        label="Your message",
                        scale=8,
                        autofocus=True,
                        lines=1,
                    )
                    send_btn = gr.Button("Send ➤", variant="primary", scale=1)

                with gr.Row():
                    clear_btn = gr.Button("🗑️ Clear Chat", variant="secondary")

                # Tool trace accordion
                with gr.Accordion("🔍 Tool Trace", open=False):
                    tool_trace_md = gr.Markdown(
                        value="_(Send a message to see the agent's reasoning here.)_"
                    )

                # ── Wire up events ─────────────────────────────────────────────

                # Send on button click (streaming)
                send_btn.click(
                    fn=handle_send,
                    inputs=[msg_box, chatbot, session_id_box],
                    outputs=[chatbot, msg_box, tool_trace_md],
                    show_progress="minimal",
                )

                # Send on Enter key (streaming)
                msg_box.submit(
                    fn=handle_send,
                    inputs=[msg_box, chatbot, session_id_box],
                    outputs=[chatbot, msg_box, tool_trace_md],
                    show_progress="minimal",
                )

                # Clear chat
                clear_btn.click(
                    fn=handle_clear,
                    inputs=[session_id_box],
                    outputs=[chatbot, tool_trace_md],
                )

                # Reload history when session ID changes
                session_id_box.change(
                    fn=handle_session_change,
                    inputs=[session_id_box],
                    outputs=[chatbot, tool_trace_md],
                )

            # ══════════════════════════════════════════════════════════════════
            # TAB 2 — Upload Document
            # ══════════════════════════════════════════════════════════════════
            with gr.TabItem("📄 Upload Document"):

                gr.Markdown(
                    """
### Add documents to the agent's knowledge base

Upload any supported file — the agent will chunk, embed, and index it in Qdrant
so you can query it via `rag_search` in the Chat tab.

| Type | Formats |
|------|---------|
| 📄 Documents | PDF, DOCX, TXT, CSV, PPTX, XLSX, HTML |
| 🖼️ Images (OCR) | PNG, JPG, JPEG, BMP, TIFF, WEBP, GIF |
| 🎙️ Audio (Transcription) | MP3, WAV, M4A, OGG, FLAC, AAC, OPUS |
"""
                )

                file_input = gr.File(
                    label="Select files (multiple supported)",
                    file_types=[
                        # Documents
                        ".pdf", ".docx", ".txt", ".csv", ".pptx", ".xlsx", ".html",
                        # Images
                        ".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp", ".gif",
                        # Audio
                        ".mp3", ".wav", ".m4a", ".ogg", ".flac", ".aac", ".opus",
                    ],
                    type="filepath",
                    file_count="multiple",
                )

                upload_btn = gr.Button("⬆️ Upload & Ingest", variant="primary")

                ingest_status = gr.Markdown(
                    value="_No file uploaded yet._",
                    label="Ingest Status",
                )

                upload_btn.click(
                    fn=handle_upload,
                    inputs=[file_input],
                    outputs=[ingest_status],
                    show_progress="full",
                )

        # ── Footer ────────────────────────────────────────────────────────────
        gr.Markdown(
            """
---
<p style="text-align:center; color:#888; font-size:0.85em;">
Built for hackathon &nbsp;·&nbsp;
Stack: <strong>FastAPI + LangGraph + Qdrant + Upstash + mem0 + Langfuse</strong>
&nbsp;·&nbsp; OCR: Tesseract &nbsp;·&nbsp; Audio: faster-whisper
&nbsp;·&nbsp; Backend: <code>uvicorn main:app --reload</code>
</p>
"""
        )

    return demo


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    demo = build_ui()
    demo.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=True,
        show_error=True,
        theme=gr.themes.Soft(),
    )
