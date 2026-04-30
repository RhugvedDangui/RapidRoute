import logging
import wikipediaapi
from langchain_core.tools import tool

logger = logging.getLogger(__name__)

_wiki_client: wikipediaapi.Wikipedia | None = None

def _get_wiki() -> wikipediaapi.Wikipedia:
    global _wiki_client
    if _wiki_client is None:
        _wiki_client = wikipediaapi.Wikipedia(
            language="en",
            user_agent="ai-agent/1.0 (https://github.com/user/ai-agent)",
        )
    return _wiki_client

@tool
def wikipedia_search(query: str) -> str:
    """
    Fetch an encyclopedic summary from Wikipedia.

    Parameters
    ----------
    query:
        The topic or article title to look up.

    Returns
    -------
    str
        The Wikipedia summary (first ~1000 chars) and URL.
        Returns an error string if the page is not found.
    """
    try:
        wiki = _get_wiki()
        page = wiki.page(query)
        if not page.exists():
            return f"wikipedia_search: No Wikipedia page found for '{query}'."

        summary = page.summary[:1000]
        url = page.fullurl
        return (
            f"wikipedia_search result for '{query}':\n"
            f"URL: {url}\n\n"
            f"Summary:\n{summary}"
        )
    except Exception as exc:
        logger.exception("wikipedia_search failed")
        return f"wikipedia_search error: {exc}"
