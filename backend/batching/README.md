# RapidRoute - Phase 1: Intelligent Batching

K-Means clustering for optimal delivery route batching using machine learning.

## Overview

This module implements intelligent order batching using:
- **K-Means Clustering** for geographic grouping
- **Time Window Refinement** to ensure same-time deliveries
- **Automatic Batch Size Control** (max 10 orders per batch)

## Setup

### 1. Activate Conda Environment

```bash
conda activate rapidroute
```

### 2. Install Dependencies

```bash
cd backend/batching
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Update `.env` with your Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**To get your service role key:**
1. Go to Supabase Dashboard → Settings → API
2. Copy the `service_role` key (NOT the anon key)
3. Paste it in `.env`

### 4. Create Batches Table

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ,
  total_orders INTEGER,
  estimated_distance NUMERIC,
  estimated_time INTEGER,
  estimated_cost NUMERIC
);

CREATE INDEX idx_batches_created_at ON batches(created_at);
```

## Usage

### Run Batching Pipeline

```bash
python batch_orders.py
```

### What It Does

1. **Fetches** all pending orders with valid coordinates
2. **Calculates** optimal number of clusters (k = ceil(orders / 10))
3. **Applies** K-Means clustering for geographic grouping
4. **Refines** clusters by splitting on time_window
5. **Saves** batches to Supabase and updates order statuses

## Algorithm Details

### K-Means Clustering

```python
k = ceil(total_orders / 10)  # Max 10 orders per batch
kmeans = KMeans(n_clusters=k, random_state=42)
clusters = kmeans.fit_predict(coordinates)
```

### Time Window Refinement

After geographic clustering, orders are split by time window:
- **Morning** (6:00 - 12:00)
- **Afternoon** (12:00 - 17:00)
- **Evening** (17:00 - 21:00)

This ensures a delivery van doesn't mix morning and evening orders.

### Batch Metrics

For each batch, the system calculates:

- **Estimated Distance**: Sum of Haversine distances between consecutive stops
- **Estimated Time**: `(distance / 30 km/h) * 60 + (stops * 5 min)`
- **Estimated Cost**: `distance * ₹8/km`

## Example Output

```
============================================================
🚀 RapidRoute - Intelligent Batching Pipeline
============================================================

📦 Fetching pending orders from Supabase...
✅ Found 23 pending orders with valid coordinates
📊 Calculated k = 3 clusters for 23 orders
🔄 Running K-Means clustering with k=3...
✅ Clustering complete. Created 3 geographic clusters
🔧 Refining batches by time window...
  📦 Batch: Cluster 0, morning, 8 orders
  📦 Batch: Cluster 0, afternoon, 2 orders
  📦 Batch: Cluster 1, morning, 7 orders
  📦 Batch: Cluster 2, evening, 6 orders
✅ Finalized 4 batches

💾 Saving batches to Supabase...
  ✅ Batch 1/4: B-A3F2E1 - 8 orders, 12.5 km, ₹100.0
  ✅ Batch 2/4: B-B7C4D2 - 2 orders, 3.2 km, ₹25.6
  ✅ Batch 3/4: B-C9E1F3 - 7 orders, 15.8 km, ₹126.4
  ✅ Batch 4/4: B-D2A5B8 - 6 orders, 11.3 km, ₹90.4

🎉 Successfully created 4 batches!

============================================================
✅ Batching pipeline completed successfully!
============================================================
```

## Verify Results

### Check Batches Table

```sql
SELECT * FROM batches ORDER BY created_at DESC;
```

### Check Updated Orders

```sql
SELECT id, customer, status, batch_id, time_window 
FROM orders 
WHERE status = 'batched';
```

## Integration with Webhook

To automatically run batching after each new order:

1. Update `backend/server.js` webhook endpoint
2. Add this after successful order insertion:

```javascript
// Trigger batching pipeline
const { exec } = require('child_process');
exec('cd batching && python batch_orders.py', (error, stdout, stderr) => {
  if (error) {
    console.error('Batching error:', error);
    return;
  }
  console.log('Batching output:', stdout);
});
```

## Troubleshooting

### "No pending orders found"
- Check that orders exist with `status = 'pending'`
- Verify orders have valid `lat` and `lng` values

### "Could not find the 'batches' table"
- Run the CREATE TABLE SQL in Supabase SQL Editor

### "Row-level security policy violation"
- Disable RLS: `ALTER TABLE batches DISABLE ROW LEVEL SECURITY;`
- Or use service_role key in `.env`

### Import errors
- Ensure conda environment is activated
- Run `pip install -r requirements.txt`

## Next Steps

- **Phase 2**: Route Optimization (Nearest Neighbour + 2-opt)
- **Phase 3**: Delay Prediction (Risk scoring)
- **Phase 4**: Claude AI Recommendations

## File Structure

```
backend/batching/
├── batch_orders.py      # Main batching script
├── requirements.txt     # Python dependencies
├── .env                 # Supabase credentials
└── README.md           # This file
```
