import logging
from typing import Any
from langchain_core.tools import tool
from tavily import TavilyClient
from utils.config import get_settings

logger = logging.getLogger(__name__)

_tavily_client: TavilyClient | None = None

def _get_tavily() -> TavilyClient:
    global _tavily_client
    if _tavily_client is None:
        _tavily_client = TavilyClient(api_key=get_settings().tavily_api_key)
    return _tavily_client

@tool
def web_search(query: str) -> str:
    """
    Search the web using Tavily and return the top 5 results.

    Parameters
    ----------
    query:
        The search query string.

    Returns
    -------
    str
        Formatted list of results with title, URL, and snippet.
        On failure returns a graceful error string.
    """
    try:
        client = _get_tavily()
        response = client.search(
            query=query,
            search_depth="basic",
            max_results=5,
            include_answer=False,
        )
        results: list[dict[str, Any]] = response.get("results", [])
        if not results:
            return "web_search: No results found."

        lines: list[str] = [f"web_search results for '{query}':"]
        for i, r in enumerate(results, start=1):
            title = r.get("title", "No title")
            url = r.get("url", "")
            snippet = r.get("content", "")[:300]
            lines.append(f"\n[{i}] {title}\n    URL: {url}\n    Snippet: {snippet}")
        return "\n".join(lines)
    except Exception as exc:
        logger.exception("web_search failed")
        return f"web_search error: {exc}"
