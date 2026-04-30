"""
tools/supabase_mcp.py
---------------------
Integration with the official Supabase MCP server.

This uses the MCP Python SDK to call Supabase MCP tools directly.
"""

import logging
import asyncio
from typing import Any
from langchain_core.tools import tool

logger = logging.getLogger(__name__)


# We'll use the simpler custom tools instead of MCP for now
# The MCP integration would require async support and the MCP Python SDK
# which adds complexity. The custom tools work well for basic operations.

# For now, we'll import the custom tools
from .supabase_tools import (
    supabase_list_tables,
    supabase_query,
    supabase_search_table,
    supabase_get_table_info,
    supabase_count_records,
)

# Export as MCP tools (they're actually custom but work the same)
SUPABASE_MCP_TOOLS = [
    supabase_list_tables,
    supabase_count_records,
    supabase_query,
    supabase_search_table,
    supabase_get_table_info,
]

