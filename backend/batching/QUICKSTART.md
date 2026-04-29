# RapidRoute - Quick Start Guide

Get up and running in 5 minutes!

---

## 🚀 Setup (One-Time)

### 1. Install Dependencies

```bash
# Activate conda environment
conda activate rapidroute

# Install Python packages
cd backend/batching
pip install -r requirements.txt
```

### 2. Configure Environment

Update `backend/batching/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Create Database Tables

Run in Supabase SQL Editor:
```sql
-- Orders table (if not exists)
CREATE TABLE orders (...);  -- See create_batches_table.sql

-- Batches table
CREATE TABLE batches (...);  -- See create_batches_table.sql

-- Routes table
CREATE TABLE routes (...);  -- See create_routes_table.sql
```

---

## 🧪 Test with Sample Data

### Step 1: Start Webhook Server

```bash
cd backend
npm run dev
```

### Step 2: Load Sample Orders

```bash
cd backend/test-data
load_goa_orders.bat
```

This loads 12 orders from Goa region.

### Step 3: Run Full Pipeline

```bash
cd backend/batching
python run_full_pipeline.py
```

Or use the batch file:
```cmd
run_full_pipeline.bat
```

---

## 📊 Expected Results

```
Phase 1: Intelligent Batching
✅ Found 12 pending orders
✅ Created 3 batches

Phase 2: Route Optimization
✅ Optimized 3 batches
📏 Total distance saved: 28.80 km
💰 Total cost saved: ₹230.40
```

---

## 🔍 Verify in Supabase

### Check Orders
```sql
SELECT id, customer, status, batch_id, time_window 
FROM orders 
WHERE status = 'batched';
```

### Check Batches
```sql
SELECT id, total_orders, estimated_distance, estimated_cost 
FROM batches;
```

### Check Routes
```sql
SELECT id, batch_id, total_distance, order_sequence 
FROM routes;
```

---

## 🎯 Production Use

### For Real Orders

1. **Configure WooCommerce webhook**:
   - URL: `https://your-domain.com/webhook/order`
   - Event: `order.created`

2. **Run batching periodically**:
   ```bash
   # Every hour via cron
   0 * * * * cd /path/to/backend/batching && python run_full_pipeline.py
   ```

3. **Or trigger manually**:
   ```bash
   python run_full_pipeline.py
   ```

---

## 🐛 Common Issues

### "No pending orders found"
- Load sample data first: `load_goa_orders.bat`
- Or send real orders via webhook

### "Invalid API key"
- Use **service_role** key (not anon key)
- Check `.env` file in `batching/` folder

### "Table does not exist"
- Run SQL scripts in Supabase SQL Editor
- Check `create_batches_table.sql` and `create_routes_table.sql`

---

## 📚 Next Steps

- Read [PHASE2_README.md](PHASE2_README.md) for detailed documentation
- Check main [README.md](../../README.md) for full project overview
- Explore Phase 3: Delay Prediction (coming soon)

---

**Happy Optimizing! 🚀**
