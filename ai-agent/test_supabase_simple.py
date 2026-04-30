"""
Simple test to verify Supabase tools work with your database.
"""

import os
from dotenv import load_dotenv

load_dotenv()

print("=" * 80)
print("SUPABASE TOOLS TEST")
print("=" * 80)
print()

# Check credentials
supabase_url = os.getenv("SUPABASE_URL", "")
supabase_key = os.getenv("SUPABASE_KEY", "")

if not supabase_url or not supabase_key:
    print("❌ Missing Supabase credentials in .env")
    exit(1)

print(f"✅ Using Supabase: {supabase_url}")
print()

# Test 1: Get table info
print("=" * 80)
print("TEST 1: Get Table Info")
print("=" * 80)
print()

table_name = input("Enter a table name to test (e.g., 'users', 'posts'): ").strip()

if not table_name:
    print("No table name provided. Skipping test.")
else:
    try:
        from tools.supabase_tools import supabase_get_table_info
        
        print(f"\nGetting info for table '{table_name}'...")
        result = supabase_get_table_info.invoke({"table_name": table_name})
        print(f"\nResult:\n{result}")
        print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print()

# Test 2: Count records
print("=" * 80)
print("TEST 2: Count Records")
print("=" * 80)
print()

if table_name:
    try:
        from tools.supabase_tools import supabase_count_records
        
        print(f"\nCounting records in '{table_name}'...")
        result = supabase_count_records.invoke({"table_name": table_name, "filters": ""})
        print(f"\nResult:\n{result}")
        print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print()

# Test 3: Query data
print("=" * 80)
print("TEST 3: Query Data")
print("=" * 80)
print()

if table_name:
    try:
        from tools.supabase_tools import supabase_query
        
        print(f"\nQuerying first 3 records from '{table_name}'...")
        result = supabase_query.invoke({"table_name": table_name, "filters": "", "limit": 3})
        print(f"\nResult:\n{result}")
        print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print()

# Summary
print("=" * 80)
print("TEST COMPLETE")
print("=" * 80)
print()
print("✅ Supabase tools are working!")
print()
print("Next steps:")
print("1. Restart your backend:")
print("   uvicorn main:app --reload --host 0.0.0.0 --port 8000")
print()
print("2. Ask your agent:")
print(f"   'How many records are in the {table_name} table?'")
print(f"   'Show me data from the {table_name} table'")
print(f"   'What columns does {table_name} have?'")
print()
