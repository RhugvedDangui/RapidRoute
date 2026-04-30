# Supabase Integration Setup Guide

## Overview

Your AI agent can now query your Supabase database! This allows the agent to:
- ✅ List all tables and their schemas
- ✅ Execute SQL SELECT queries
- ✅ Search for specific records
- ✅ Get table information and statistics
- ✅ Answer questions about your database data

## 🚀 Quick Setup (5 Minutes)

### Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

### Step 2: Add to .env File

Open your `.env` file and add these lines:

```bash
# ── Supabase Database ─────────────────────────────────────────────────────────
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-key-here
```

**Replace with your actual values!**

### Step 3: Install Supabase Client

```bash
pip install supabase
```

### Step 4: Restart Backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 5: Test It!

Ask your agent:
```
What tables do I have in my database?
```

Or:
```
How many users are in my database?
```

---

## 🛠️ Available Tools

Your agent now has 4 new Supabase tools:

### 1. supabase_list_tables
Lists all tables in your database with their columns and types.

**Example questions:**
- "What tables do I have?"
- "Show me my database schema"
- "List all my tables"

### 2. supabase_query
Executes SQL SELECT queries on your database.

**Example questions:**
- "How many users do I have?"
- "Show me the last 10 orders"
- "What's the total revenue from completed orders?"

**Example queries the agent will generate:**
```sql
SELECT COUNT(*) FROM users
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10
SELECT SUM(amount) FROM orders WHERE status = 'completed'
```

### 3. supabase_search_table
Searches for specific records in a table.

**Example questions:**
- "Find all users with email containing 'gmail'"
- "Search for products named 'laptop'"
- "Find orders from customer John"

### 4. supabase_get_table_info
Gets detailed information about a specific table.

**Example questions:**
- "Tell me about the users table"
- "What columns does the orders table have?"
- "How many records are in the products table?"

---

## 🔒 Security & Safety

### Read-Only Access
The agent can **only execute SELECT queries**. It cannot:
- ❌ INSERT new records
- ❌ UPDATE existing records
- ❌ DELETE records
- ❌ DROP tables
- ❌ ALTER schema

This is enforced in the code for safety.

### Row Level Security (RLS)
The agent respects your Supabase RLS policies. It can only access data that the `anon` key has permission to read.

**Recommendation:** Use the `anon` (public) key, not the `service_role` key, for better security.

### API Key Types

| Key Type | Access Level | Recommended? |
|----------|--------------|--------------|
| **anon** | Public, respects RLS | ✅ YES |
| **service_role** | Full admin access | ❌ NO (too powerful) |

---

## 📊 Example Use Cases

### Use Case 1: Customer Support
**User:** "How many support tickets are open?"
**Agent:** Uses `supabase_query("SELECT COUNT(*) FROM tickets WHERE status = 'open'")`

### Use Case 2: Analytics
**User:** "What's our total revenue this month?"
**Agent:** Uses `supabase_query("SELECT SUM(amount) FROM orders WHERE created_at >= '2025-04-01' AND status = 'completed'")`

### Use Case 3: Data Lookup
**User:** "Find the user with email john@example.com"
**Agent:** Uses `supabase_search_table(table_name="users", search_column="email", search_value="john@example.com")`

### Use Case 4: Schema Discovery
**User:** "What data do I have in my database?"
**Agent:** Uses `supabase_list_tables()` to show all tables and their structure

---

## 🎯 Tool Priority

The agent will use tools in this order:

1. **rag_search** - Uploaded documents (PDFs, etc.)
2. **supabase_*** - Your database
3. **web_search** - Internet search
4. **calculator** - Math
5. **wikipedia** - General knowledge

This means:
- Questions about uploaded documents → RAG search
- Questions about your database → Supabase
- Questions about current events → Web search

---

## 🧪 Testing Your Setup

### Test 1: List Tables
```
Ask: "What tables do I have in my database?"
Expected: List of all your tables with columns
```

### Test 2: Count Records
```
Ask: "How many records are in the [your_table_name] table?"
Expected: Exact count from your database
```

### Test 3: Search Data
```
Ask: "Find all [records] where [column] contains [value]"
Expected: Matching records from your database
```

### Test 4: Complex Query
```
Ask: "What's the average [column] for [table] where [condition]?"
Expected: Agent generates and executes appropriate SQL query
```

---

## 🔧 Troubleshooting

### Error: "supabase_list_tables failed"

**Possible causes:**
1. Missing or incorrect `SUPABASE_URL` in `.env`
2. Missing or incorrect `SUPABASE_KEY` in `.env`
3. Supabase client not installed

**Fix:**
```bash
# 1. Check .env has correct values
cat .env | grep SUPABASE

# 2. Install supabase client
pip install supabase

# 3. Restart backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Error: "Only SELECT queries are allowed"

**Cause:** Agent tried to execute INSERT, UPDATE, or DELETE query.

**Fix:** This is intentional for safety. The agent can only read data, not modify it.

### Error: "Table not found"

**Possible causes:**
1. Table name is misspelled
2. Table is in a different schema (not `public`)
3. RLS policy blocks access

**Fix:**
1. Check table name spelling
2. Specify schema: `supabase_list_tables(schema="your_schema")`
3. Check RLS policies in Supabase dashboard

### Error: "Permission denied"

**Cause:** The `anon` key doesn't have permission to access the table.

**Fix:**
1. Check RLS policies in Supabase dashboard
2. Make sure the table has appropriate policies for `anon` role
3. Or use `service_role` key (not recommended for production)

---

## 🎨 Advanced Configuration

### Using Service Role Key (Admin Access)

**⚠️ Warning:** Only use this for development/testing!

```bash
# In .env, use service_role key instead of anon key
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-service-role-key
```

This gives the agent full admin access to your database (bypasses RLS).

### Custom Schema

If your tables are in a different schema (not `public`):

```python
# Agent will use:
supabase_list_tables(schema="custom_schema")
```

### Query Limits

By default, queries are limited to 50 rows for safety. To change this, edit `tools/supabase_tools.py`:

```python
# In supabase_query function, change:
for i, row in enumerate(result.data[:50], 1):  # Change 50 to your limit
```

---

## 📚 Example Conversations

### Example 1: Database Overview
```
User: What's in my database?
Agent: Let me check your database structure...
      [Calls supabase_list_tables()]
      You have 5 tables:
      1. users (id, email, name, created_at)
      2. orders (id, user_id, amount, status, created_at)
      3. products (id, name, price, stock)
      4. categories (id, name, description)
      5. reviews (id, product_id, user_id, rating, comment)
```

### Example 2: Data Analysis
```
User: How many orders were completed this month?
Agent: Let me query your orders table...
      [Calls supabase_query("SELECT COUNT(*) FROM orders WHERE status = 'completed' AND created_at >= '2025-04-01'")]
      You have 127 completed orders this month.
```

### Example 3: Data Lookup
```
User: Find the user with email john@example.com
Agent: Searching for that user...
      [Calls supabase_search_table(table_name="users", search_column="email", search_value="john@example.com")]
      Found 1 user:
      - ID: 42
      - Name: John Doe
      - Email: john@example.com
      - Created: 2025-01-15
```

### Example 4: Combined Query
```
User: Show me the top 5 products by revenue
Agent: Let me calculate that from your database...
      [Calls supabase_query("SELECT p.name, SUM(o.amount) as revenue FROM products p JOIN orders o ON p.id = o.product_id WHERE o.status = 'completed' GROUP BY p.name ORDER BY revenue DESC LIMIT 5")]
      Top 5 products by revenue:
      1. Laptop Pro - $45,230
      2. Wireless Mouse - $12,450
      3. USB-C Cable - $8,920
      4. Monitor 27" - $7,650
      5. Keyboard RGB - $6,340
```

---

## 🎉 You're All Set!

Your agent can now:
- ✅ Query your Supabase database
- ✅ Search through uploaded documents (RAG)
- ✅ Search the web for current information
- ✅ Perform calculations
- ✅ Look up Wikipedia facts

**Next steps:**
1. Add your Supabase credentials to `.env`
2. Install supabase client: `pip install supabase`
3. Restart backend
4. Ask: "What tables do I have in my database?"

Enjoy your database-aware AI agent! 🚀
