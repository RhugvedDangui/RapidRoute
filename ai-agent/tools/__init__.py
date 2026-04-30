from .rag_search import rag_search
from .web_search import web_search
from .calculator import calculator
from .wikipedia import wikipedia_search
from .file_reader import read_file

# Import Supabase tools (uses custom implementation, compatible with MCP)
try:
    from .supabase_mcp import SUPABASE_MCP_TOOLS
    supabase_available = True
except ImportError:
    SUPABASE_MCP_TOOLS = []
    supabase_available = False

# IMPORTANT: rag_search is listed FIRST to prioritize searching uploaded documents
# Supabase tools are added after RAG but before web search
ALL_TOOLS = [rag_search] + SUPABASE_MCP_TOOLS + [web_search, calculator, wikipedia_search, read_file]
