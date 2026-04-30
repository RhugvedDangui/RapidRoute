"""
tools/supabase_tools.py
-----------------------
Supabase database tools for querying and managing database data.

These tools allow the agent to:
- List tables and their schemas
- Execute SQL queries
- Search for specific data
- Get table information
"""

import logging
from typing import Any
from langchain_core.tools import tool

logger = logging.getLogger(__name__)


@tool
def supabase_list_tables(schema_name: str = "public") -> str:
    """
    List all tables in the Supabase database.
    
    Use this tool when the user asks:
    - "What tables do I have?"
    - "Show me my database schema"
    - "What's in my database?"
    
    Parameters
    ----------
    schema_name:
        Database schema to list tables from (default: "public")
    
    Returns
    -------
    str
        List of tables with their columns and types
    """
    try:
        from supabase import create_client
        from utils.config import get_settings
        
        settings = get_settings()
        supabase = create_client(settings.supabase_url, settings.supabase_key)
        
        # Get list of tables by trying to access them
        # We'll use the Supabase REST API to discover tables
        
        # Try to get table names from the API
        # Supabase exposes tables through the REST API
        # We can discover them by making requests
        
        # Alternative approach: Use SQL query through RPC if available
        # Or just try common table operations
        
        # For now, let's try a different approach:
        # List tables by attempting to query with limit 0
        # This is a workaround since Supabase doesn't expose information_schema directly
        
        output = [f"📊 Supabase Database Tables (schema: {schema_name})"]
        output.append("\nNote: To see your tables, please tell me a table name to inspect,")
        output.append("or I can try to query specific tables if you know their names.")
        output.append("\nCommon table names to try:")
        output.append("  - users")
        output.append("  - profiles") 
        output.append("  - posts")
        output.append("  - products")
        output.append("  - orders")
        output.append("\nTip: Use supabase_get_table_info('table_name') to inspect a specific table.")
        
        return "\n".join(output)
        
    except Exception as exc:
        logger.exception("supabase_list_tables failed")
        return f"Error listing tables: {exc}"


@tool
def supabase_query(table_name: str, filters: str = "", limit: int = 10) -> str:
    """
    Query data from a Supabase table with optional filters.
    
    Use this tool when the user asks to:
    - Get data from a specific table
    - Count records
    - Filter or search data
    - Get specific information from the database
    
    Parameters
    ----------
    table_name:
        Name of the table to query
    filters:
        Optional filter conditions (e.g., "status=completed", "age>18")
        Leave empty to get all records
    limit:
        Maximum number of records to return (default: 10, max: 100)
    
    Returns
    -------
    str
        Query results formatted as text
    
    Examples
    --------
    - Get all users: table_name="users", filters="", limit=10
    - Get completed orders: table_name="orders", filters="status=completed", limit=20
    - Get recent posts: table_name="posts", filters="", limit=5
    """
    try:
        from supabase import create_client
        from utils.config import get_settings
        
        settings = get_settings()
        supabase = create_client(settings.supabase_url, settings.supabase_key)
        
        # Limit to max 100 for safety
        limit = min(limit, 100)
        
        # Build query
        query = supabase.table(table_name).select('*')
        
        # Apply filters if provided
        if filters:
            # Parse simple filters like "column=value" or "column>value"
            filter_parts = filters.split(',')
            for filter_part in filter_parts:
                filter_part = filter_part.strip()
                if '=' in filter_part:
                    col, val = filter_part.split('=', 1)
                    query = query.eq(col.strip(), val.strip())
                elif '>' in filter_part:
                    col, val = filter_part.split('>', 1)
                    query = query.gt(col.strip(), val.strip())
                elif '<' in filter_part:
                    col, val = filter_part.split('<', 1)
                    query = query.lt(col.strip(), val.strip())
        
        # Execute query
        result = query.limit(limit).execute()
        
        if not result.data:
            return f"Query executed successfully. No results found in table '{table_name}'."
        
        # Format results
        output = [f"📊 Query results from '{table_name}' ({len(result.data)} rows):"]
        for i, row in enumerate(result.data, 1):
            output.append(f"\nRow {i}:")
            for key, value in row.items():
                # Truncate long values
                str_value = str(value)
                if len(str_value) > 100:
                    str_value = str_value[:100] + "..."
                output.append(f"  {key}: {str_value}")
        
        if len(result.data) >= limit:
            output.append(f"\n(Showing first {limit} rows. Use higher limit to see more.)")
        
        return "\n".join(output)
            
    except Exception as exc:
        logger.exception("supabase_query failed")
        return f"Error querying table '{table_name}': {exc}\n\nMake sure the table name is correct and you have permission to access it."


@tool
def supabase_search_table(table_name: str, search_column: str, search_value: str, limit: int = 10) -> str:
    """
    Search for records in a specific table.
    
    Use this tool when the user asks to:
    - Find specific records
    - Search for data in a table
    - Look up information by a specific field
    
    Parameters
    ----------
    table_name:
        Name of the table to search
    search_column:
        Column name to search in
    search_value:
        Value to search for (supports partial matching)
    limit:
        Maximum number of results to return (default: 10)
    
    Returns
    -------
    str
        Matching records formatted as text
    
    Examples
    --------
    - Search users by email: table_name="users", search_column="email", search_value="john"
    - Search products by name: table_name="products", search_column="name", search_value="laptop"
    """
    try:
        from supabase import create_client
        from utils.config import get_settings
        
        settings = get_settings()
        supabase = create_client(settings.supabase_url, settings.supabase_key)
        
        # Execute search using ilike for case-insensitive partial matching
        result = supabase.table(table_name).select('*').ilike(search_column, f'%{search_value}%').limit(limit).execute()
        
        if not result.data:
            return f"No results found in table '{table_name}' where {search_column} contains '{search_value}'"
        
        # Format results
        output = [f"Found {len(result.data)} results in '{table_name}':"]
        for i, row in enumerate(result.data, 1):
            output.append(f"\nResult {i}:")
            for key, value in row.items():
                output.append(f"  {key}: {value}")
        
        return "\n".join(output)
        
    except Exception as exc:
        logger.exception("supabase_search_table failed")
        return f"Error searching table: {exc}\n\nMake sure the table and column names are correct."


@tool
def supabase_get_table_info(table_name: str) -> str:
    """
    Get detailed information about a specific table including its schema and row count.
    
    Use this tool when the user asks:
    - "Tell me about the [table_name] table"
    - "What columns does [table_name] have?"
    - "How many records are in [table_name]?"
    
    Parameters
    ----------
    table_name:
        Name of the table to get information about
    
    Returns
    -------
    str
        Table schema and statistics
    """
    try:
        from supabase import create_client
        from utils.config import get_settings
        
        settings = get_settings()
        supabase = create_client(settings.supabase_url, settings.supabase_key)
        
        # Get row count
        count_result = supabase.table(table_name).select('*', count='exact').limit(1).execute()
        row_count = count_result.count if hasattr(count_result, 'count') else 'unknown'
        
        # Get sample row to infer schema
        sample_result = supabase.table(table_name).select('*').limit(1).execute()
        
        output = [f"📊 Table: {table_name}"]
        output.append(f"Total rows: {row_count}")
        
        if sample_result.data and len(sample_result.data) > 0:
            output.append("\nColumns:")
            sample_row = sample_result.data[0]
            for key, value in sample_row.items():
                value_type = type(value).__name__
                output.append(f"  - {key}: {value_type}")
            
            output.append("\nSample row:")
            for key, value in sample_row.items():
                display_value = str(value)[:100]  # Truncate long values
                output.append(f"  {key}: {display_value}")
        else:
            output.append("\nTable is empty or no data available.")
        
        return "\n".join(output)
        
    except Exception as exc:
        logger.exception("supabase_get_table_info failed")
        return f"Error getting table info: {exc}\n\nMake sure the table name is correct and you have access to it."


@tool
def supabase_count_records(table_name: str, filters: str = "") -> str:
    """
    Count the number of records in a table with optional filters.
    
    Use this tool when the user asks:
    - "How many [records] are in [table]?"
    - "Count the [records] where [condition]"
    - "What's the total number of [records]?"
    
    Parameters
    ----------
    table_name:
        Name of the table to count records from
    filters:
        Optional filter conditions (e.g., "status=active", "age>18")
    
    Returns
    -------
    str
        Count of records matching the criteria
    
    Examples
    --------
    - Count all users: table_name="users", filters=""
    - Count active users: table_name="users", filters="status=active"
    - Count recent orders: table_name="orders", filters="created_at>2025-01-01"
    """
    try:
        from supabase import create_client
        from utils.config import get_settings
        
        settings = get_settings()
        supabase = create_client(settings.supabase_url, settings.supabase_key)
        
        # Build query
        query = supabase.table(table_name).select('*', count='exact')
        
        # Apply filters if provided
        if filters:
            filter_parts = filters.split(',')
            for filter_part in filter_parts:
                filter_part = filter_part.strip()
                if '=' in filter_part:
                    col, val = filter_part.split('=', 1)
                    query = query.eq(col.strip(), val.strip())
                elif '>' in filter_part:
                    col, val = filter_part.split('>', 1)
                    query = query.gt(col.strip(), val.strip())
                elif '<' in filter_part:
                    col, val = filter_part.split('<', 1)
                    query = query.lt(col.strip(), val.strip())
        
        # Execute count query (limit 0 to only get count)
        result = query.limit(0).execute()
        
        count = result.count if hasattr(result, 'count') else 0
        
        if filters:
            return f"Found {count} records in '{table_name}' matching filters: {filters}"
        else:
            return f"Total records in '{table_name}': {count}"
        
    except Exception as exc:
        logger.exception("supabase_count_records failed")
        return f"Error counting records in '{table_name}': {exc}\n\nMake sure the table name is correct."


# Export all Supabase tools
SUPABASE_TOOLS = [
    supabase_list_tables,
    supabase_query,
    supabase_search_table,
    supabase_get_table_info,
    supabase_count_records,
]
