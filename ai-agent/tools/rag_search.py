import logging
from langchain_core.tools import tool

logger = logging.getLogger(__name__)

@tool
def rag_search(query: str, top_k: int = 5) -> str:
    """
    Perform a semantic similarity search over documents stored in Qdrant.
    
    Use this tool to search through uploaded documents, PDFs, reports, and files
    that the user has added to the knowledge base. This should be your FIRST choice
    when the user asks about documents, reports, company data, or any information
    that could be in uploaded files.

    Parameters
    ----------
    query:
        The natural-language query to embed and search. Be specific and include
        key terms from the user's question (e.g., "Tesla Q3 2025 revenue profit").
    top_k:
        Number of chunks to return (default 5, increased from 3 for better recall).

    Returns
    -------
    str
        Formatted list of matching chunks with source metadata and relevance scores.
        Returns "No relevant documents found" if the knowledge base is empty or
        no matches are found above the relevance threshold.
    """
    try:
        from rag.retriever import retrieve_chunks

        chunks = retrieve_chunks(query=query, top_k=top_k)
        if not chunks:
            return "rag_search: No relevant documents found in the knowledge base."

        lines: list[str] = [f"rag_search results for '{query}':"]
        for i, chunk in enumerate(chunks, start=1):
            source = chunk.get("source", "unknown")
            score = chunk.get("score", 0.0)
            text = chunk.get("text", "")[:500]  # Increased from 400 for more context
            lines.append(
                f"\n[{i}] Source: {source} | Relevance: {score:.4f}\n    {text}"
            )
        
        # Add a note about the number of results
        lines.append(f"\n\n✅ Found {len(chunks)} relevant chunks from uploaded documents.")
        return "\n".join(lines)
    except Exception as exc:
        logger.exception("rag_search failed")
        return f"rag_search error: {exc}"
