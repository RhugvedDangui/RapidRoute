# RapidRoute - AI Logistics Optimizer

**Intelligent order batching and route optimization for small e-commerce sellers**

A lightweight logistics optimization system that uses K-Means clustering and machine learning to batch delivery orders efficiently, reducing costs and delivery times for small sellers who lack enterprise-grade tools.

---

## 🎯 Project Overview

RapidRoute helps small e-commerce sellers optimize their delivery operations by:
- **Receiving orders** via WooCommerce webhook in real-time
- **Geocoding addresses** automatically using Nominatim API
- **Batching orders** intelligently using K-Means clustering
- **Grouping by time windows** (morning/afternoon/evening)
- **Calculating costs** and distances for each batch

### Current Status: Phase 2 Complete ✅

**Implemented:**
- ✅ WooCommerce webhook integration
- ✅ Address geocoding (Nominatim API)
- ✅ Time window assignment
- ✅ K-Means clustering for geographic batching
- ✅ Batch metrics calculation (distance, time, cost)
- ✅ Google OR-Tools TSP solver for route optimization
- ✅ Before/after savings calculation
- ✅ Polyline generation for map visualization
- ✅ Supabase database integration

**Coming Next:**
- 🔄 Phase 3: Delay Prediction (Risk scoring)
- 🔄 Phase 4: Claude AI Recommendations
- 🔄 Phase 5: Dashboard UI

---

## 🏗️ Architecture

```
┌─────────────────┐
│  WooCommerce    │
│  (Order Created)│
└────────┬────────┘
         │ Webhook POST
         ▼
┌─────────────────────────────────┐
│  Node.js Express Server         │
│  - Receives order               │
│  - Geocodes address (Nominatim)│
│  - Assigns time window          │
│  - Saves to Supabase            │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Supabase Database              │
│  - orders table                 │
│  - batches table                │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Python Batching System         │
│  - K-Means clustering           │
│  - Time window refinement       │
│  - Batch metrics calculation    │
│  - Updates database             │
└─────────────────────────────────┘
```

---

## 📁 Project Structure

```
RapidRoute/
├── backend/
│   ├── server.js                    # Express webhook server
│   ├── package.json                 # Node.js dependencies
│   ├── .env                         # Supabase configuration
│   │
│   ├── batching/                    # Python batching system
│   │   ├── batch_orders.py          # K-Means clustering script
│   │   ├── requirements.txt         # Python dependencies
│   │   ├── .env                     # Supabase config
│   │   ├── README.md                # Batching documentation
│   │   └── create_batches_table.sql # Database schema
│   │
│   └── test-data/                   # Test data
│       ├── goa_sample_orders.json   # Sample orders (Goa region)
│       └── load_goa_orders.bat      # Batch loader script
│
└── README.md                        # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **Python** (v3.10+) with conda
- **Supabase** account
- **WooCommerce** store (optional, for production)

### 1. Setup Backend (Node.js)

```bash
cd backend
npm install
```

**Configure `.env`:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
PORT=3000
```

**Start the webhook server:**
```bash
npm run dev
```

Server runs at: `http://localhost:3000`

### 2. Setup Database (Supabase)

**Create `orders` table:**
```sql
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  customer TEXT,
  address TEXT,
  lat NUMERIC,
  lng NUMERIC,
  total NUMERIC,
  status TEXT DEFAULT 'pending',
  time_window TEXT,
  created_at TIMESTAMPTZ,
  batch_id TEXT
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_time_window ON orders(time_window);

-- Disable RLS for development
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
```

**Create `batches` table:**
```sql
CREATE TABLE batches (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ,
  total_orders INTEGER,
  estimated_distance NUMERIC,
  estimated_time INTEGER,
  estimated_cost NUMERIC
);

CREATE INDEX idx_batches_created_at ON batches(created_at);

-- Disable RLS for development
ALTER TABLE batches DISABLE ROW LEVEL SECURITY;
```

### 3. Setup Batching System (Python)

**Create conda environment:**
```bash
conda create -n rapidroute python=3.10
conda activate rapidroute
```

**Install dependencies:**
```bash
cd backend/batching
pip install -r requirements.txt
```

**Configure `batching/.env`:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

> **Note:** Use the **service_role** key (not anon key) from Supabase Settings → API

---

## 🧪 Testing

### Load Sample Orders

```bash
cd backend/test-data
load_goa_orders.bat
```

This loads **12 realistic orders** from North Goa region:
- 5 morning orders
- 4 afternoon orders
- 3 evening orders

### Run Batching

```bash
cd backend/batching
conda activate rapidroute
python batch_orders.py
```

**Expected Output:**
```
============================================================
🚀 RapidRoute - Intelligent Batching Pipeline
============================================================

📦 Fetching pending orders from Supabase...
✅ Found 12 pending orders with valid coordinates
📊 Calculated k = 2 clusters for 12 orders
🔄 Running K-Means clustering with k=2...
✅ Clustering complete. Created 2 geographic clusters
🔧 Refining batches by time window...
  📦 Batch: Cluster 0, morning, 5 orders
  📦 Batch: Cluster 1, afternoon, 4 orders
  📦 Batch: Cluster 1, evening, 3 orders
✅ Finalized 3 batches

💾 Saving batches to Supabase...
  ✅ Batch 1/3: B-A3F2E1 - 5 orders, 12.5 km, ₹100.0
  ✅ Batch 2/3: B-B7C4D2 - 4 orders, 9.7 km, ₹77.6
  ✅ Batch 3/3: B-C9E1F3 - 3 orders, 7.8 km, ₹62.4

🎉 Successfully created 3 batches!
============================================================
```

---

## 📊 How It Works

### 1. Order Intake (Webhook)

**Endpoint:** `POST /webhook/order`

**Process:**
1. Receives WooCommerce order JSON
2. Extracts: `id`, `total`, `shipping address`, `date_created`
3. Geocodes address → `lat`, `lng` (Nominatim API)
4. Assigns time window based on hour:
   - 6:00-12:00 → `morning`
   - 12:00-17:00 → `afternoon`
   - 17:00-21:00 → `evening`
5. Saves to `orders` table with `status = 'pending'`

**Example Request:**
```json
{
  "id": 10001,
  "total": "499.00",
  "date_created": "2026-04-29T08:30:00",
  "shipping": {
    "first_name": "Rahul",
    "last_name": "Sharma",
    "address_1": "Agnel Institute of Technology",
    "city": "Bardez",
    "state": "Goa",
    "postcode": "403507",
    "country": "India"
  }
}
```

### 2. Intelligent Batching (K-Means)

**Algorithm:**

```python
# Step 1: Calculate optimal clusters
k = ceil(total_orders / 10)  # Max 10 orders per batch

# Step 2: K-Means clustering on coordinates
kmeans = KMeans(n_clusters=k)
clusters = kmeans.fit_predict(lat_lng_coordinates)

# Step 3: Refine by time window
for each cluster:
    split by time_window (morning/afternoon/evening)
    if batch > 10 orders:
        split into multiple batches

# Step 4: Calculate metrics
for each batch:
    distance = sum(haversine(stop[i], stop[i+1]))
    time = (distance / 30 km/h) * 60 + (stops * 5 min)
    cost = distance * ₹8/km
```

**Haversine Distance Formula:**
```python
def haversine(lat1, lng1, lat2, lng2):
    R = 6371  # Earth radius in km
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat/2)² + cos(lat1) * cos(lat2) * sin(dlng/2)²
    c = 2 * atan2(√a, √(1-a))
    return R * c
```

### 3. Database Updates

**Batches Table:**
```sql
INSERT INTO batches (id, total_orders, estimated_distance, estimated_time, estimated_cost)
VALUES ('B-A3F2E1', 5, 12.5, 45, 100.0);
```

**Orders Table:**
```sql
UPDATE orders 
SET batch_id = 'B-A3F2E1', status = 'batched'
WHERE id IN ('10001', '10002', '10003', '10004', '10005');
```

---

## 🔧 Configuration

### Time Windows

Edit in `server.js`:
```javascript
const getTimeWindow = (dateString) => {
  const hour = new Date(dateString).getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'other';
};
```

### Batch Size

Edit in `batch_orders.py`:
```python
MAX_ORDERS_PER_BATCH = 10  # Change to your preference
```

### Cost Calculation

Edit in `batch_orders.py`:
```python
# Fuel rate (₹/km)
estimated_cost = distance * 8  # Change 8 to your rate
```

---

## 📈 Metrics & Results

### Before Batching
- **Individual trips**: Each order = separate trip from hub
- **Total distance**: Sum of (hub → order → hub) for all orders
- **Example**: 12 orders × 10 km average = **240 km**

### After Batching
- **Batched routes**: Multiple orders per trip
- **Total distance**: Optimized routes with multiple stops
- **Example**: 3 batches × 10 km average = **30 km**

### Savings
- **Distance saved**: 240 - 30 = **210 km (87.5%)**
- **Cost saved**: 210 km × ₹8/km = **₹1,680**
- **Time saved**: ~4 hours

---

## 🔐 Security

### Production Checklist

- [ ] Use **service_role** key only in backend (never expose to frontend)
- [ ] Enable **Row Level Security (RLS)** on Supabase tables
- [ ] Add **webhook signature verification** for WooCommerce
- [ ] Use **environment variables** for all secrets
- [ ] Add **rate limiting** on webhook endpoint
- [ ] Enable **HTTPS** for production deployment

### Environment Variables

**Never commit these files:**
- `backend/.env`
- `backend/batching/.env`

Add to `.gitignore`:
```
.env
.env.*
*.env
```

---

## 🐛 Troubleshooting

### Webhook Issues

**Problem:** "Row-level security policy violation"
```sql
-- Solution: Disable RLS for development
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE batches DISABLE ROW LEVEL SECURITY;
```

**Problem:** Geocoding returns null coordinates
- Check address format is valid
- Nominatim has rate limits (1 req/sec)
- Add delays between requests

### Batching Issues

**Problem:** "Invalid API key"
- Ensure you're using **service_role** key (not anon key)
- Check `.env` file in `batching/` folder
- Verify key is copied correctly (no extra spaces)

**Problem:** Unrealistic distances (thousands of km)
- Orders are from different continents
- Use test data from same city/region
- Load sample Goa orders: `load_goa_orders.bat`

---

## 🚀 Deployment

### Backend (Node.js)

**Recommended platforms:**
- Railway
- Render
- Heroku
- DigitalOcean App Platform

**Environment variables to set:**
```
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
PORT=3000
```

### Batching (Python)

**Options:**
1. **Cron job** on same server (run every hour)
2. **Supabase Edge Function** (trigger on new order)
3. **AWS Lambda** (scheduled execution)
4. **Manual trigger** from dashboard

---

## 📚 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Node.js + Express | Webhook receiver, API |
| **Database** | Supabase (PostgreSQL) | Orders, batches storage |
| **Batching** | Python + scikit-learn | K-Means clustering |
| **Geocoding** | Nominatim (OSM) | Address → coordinates |
| **Webhook** | WooCommerce | Live order intake |

---

## 📖 API Reference

### POST /webhook/order

Receives WooCommerce order webhook.

**Request:**
```json
{
  "id": 10001,
  "total": "499.00",
  "date_created": "2026-04-29T08:30:00",
  "shipping": {
    "first_name": "John",
    "last_name": "Doe",
    "address_1": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postcode": "400001",
    "country": "India"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order processed successfully",
  "order_id": "10001",
  "customer": "John Doe",
  "time_window": "morning",
  "coordinates": {
    "lat": 19.0760,
    "lng": 72.8777
  },
  "status": "pending"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-29T14:30:00.000Z"
}
```

---

## 🎯 Roadmap

### Phase 1: Intelligent Batching ✅ (Complete)
- [x] WooCommerce webhook integration
- [x] Address geocoding
- [x] K-Means clustering
- [x] Time window grouping
- [x] Batch metrics calculation

### Phase 2: Route Optimization 🔄 (Next)
- [ ] Nearest Neighbour algorithm
- [ ] 2-opt route improvement
- [ ] Polyline generation for maps
- [ ] Route visualization

### Phase 3: Delay Prediction 🔄
- [ ] Risk scoring model
- [ ] Distance-based risk factors
- [ ] Volume-based risk factors
- [ ] Suggested actions

### Phase 4: AI Recommendations 🔄
- [ ] Claude API integration
- [ ] Plain-English recommendations
- [ ] Cost/time savings insights
- [ ] Actionable suggestions

### Phase 5: Dashboard 🔄
- [ ] React + Tailwind UI
- [ ] Leaflet.js map visualization
- [ ] Before/after metrics
- [ ] Batch management

---

## 👥 Contributing

This is a hackathon project. Contributions welcome!

---

## 📄 License

MIT License - feel free to use for your own projects.

---

## 🙏 Acknowledgments

- **Nominatim** for free geocoding API
- **Supabase** for database and backend services
- **scikit-learn** for K-Means clustering
- **WooCommerce** for webhook integration

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the documentation in `backend/batching/README.md`
3. Check Supabase logs for database errors

---

**Built with ❤️ for small e-commerce sellers**

*Empowering small businesses with enterprise-grade logistics optimization*
