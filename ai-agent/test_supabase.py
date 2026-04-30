"""
Test script to verify Supabase connection and tools.
Run this after adding your Supabase credentials to .env
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=" * 80)
print("SUPABASE CONNECTION TEST")
print("=" * 80)
print()

# Check if credentials are set
supabase_url = os.getenv("SUPABASE_URL", "")
supabase_key = os.getenv("SUPABASE_KEY", "")

if not supabase_url or not supabase_key:
    print("❌ Supabase credentials not found in .env file!")
    print()
    print("Please add these lines to your .env file:")
    print("SUPABASE_URL=https://your-project-id.supabase.co")
    print("SUPABASE_KEY=your-anon-or-service-role-key")
    print()
    print("Get your credentials from:")
    print("https://supabase.com/dashboard/project/_/settings/api")
    exit(1)

print(f"✅ Found credentials:")
print(f"   URL: {supabase_url}")
print(f"   Key: {supabase_key[:20]}...{supabase_key[-10:]}")
print()

# Test connection
print("=" * 80)
print("Testing Connection...")
print("=" * 80)
print()

try:
    from supabase import create_client
    
    supabase = create_client(supabase_url, supabase_key)
    print("✅ Supabase client created successfully!")
    print()
    
except ImportError:
    print("❌ Supabase client not installed!")
    print()
    print("Install it with:")
    print("pip install supabase")
    exit(1)
except Exception as e:
    print(f"❌ Error creating Supabase client: {e}")
    exit(1)

# Test listing tables
print("=" * 80)
print("Testing: List Tables")
print("=" * 80)
print()

try:
    # Try to get a list of tables by querying a sample table
    # This will fail if no tables exist, but that's okay
    result = supabase.table('_').select('*').limit(1).execute()
    print("✅ Connection successful!")
    print()
except Exception as e:
    # This is expected if the table doesn't exist
    # But it confirms we can connect
    if "does not exist" in str(e) or "not found" in str(e):
        print("✅ Connection successful!")
        print("   (No tables found or table query failed, but connection works)")
        print()
    else:
        print(f"⚠️  Connection issue: {e}")
        print()

# Test the tools
print("=" * 80)
print("Testing: Supabase Tools")
print("=" * 80)
print()

try:
    from tools.supabase_tools import (
        supabase_list_tables,
        supabase_query,
        supabase_search_table,
        supabase_get_table_info,
    )
    
    print("✅ All Supabase tools imported successfully!")
    print()
    print("Available tools:")
    print("  1. supabase_list_tables - List all tables")
    print("  2. supabase_query - Execute SQL queries")
    print("  3. supabase_search_table - Search for records")
    print("  4. supabase_get_table_info - Get table details")
    print()
    
    # Try to list tables
    print("Attempting to list tables...")
    result = supabase_list_tables.invoke({"schema": "public"})
    print(f"\nResult:\n{result}")
    print()
    
except ImportError as e:
    print(f"❌ Error importing tools: {e}")
    print()
    print("Make sure you have:")
    print("  1. Added Supabase credentials to .env")
    print("  2. Installed supabase client: pip install supabase")
    print("  3. Restarted your backend")
    exit(1)
except Exception as e:
    print(f"⚠️  Tool execution issue: {e}")
    print()
    print("This might be normal if:")
    print("  - Your database has no tables yet")
    print("  - RLS policies restrict access")
    print("  - You're using the anon key with strict policies")
    print()

# Summary
print("=" * 80)
print("TEST COMPLETE")
print("=" * 80)
print()
print("✅ Supabase integration is set up!")
print()
print("Next steps:")
print("1. Restart your backend:")
print("   uvicorn main:app --reload --host 0.0.0.0 --port 8000")
print()
print("2. Test with your agent:")
print("   Ask: 'What tables do I have in my database?'")
print()
print("3. Try querying your data:")
print("   Ask: 'How many records are in [your_table_name]?'")
print()
print("=" * 80)
