# RapidRoute - AI Logistics Optimizer

**Intelligent order batching, route optimization, and delay prediction for small e-commerce sellers**

A complete, enterprise-grade logistics optimization platform. Built specifically for small-to-medium businesses to automatically ingest orders, batch deliveries using machine learning, optimize routes, manage human/vehicle fleets, and predict delivery delays in real-time.

---

## 🎯 Project Overview

RapidRoute transforms how small e-commerce sellers handle daily dispatches.

### What We've Built ✅ (All Phases Complete)

1. **Intelligent Order Intake**
   - Live WooCommerce Webhook integration.
   - Automatic Address Geocoding (via Nominatim).
   - Time window extraction & DB syncing (Supabase).

2. **Machine Learning Batching & Routing**
   - **K-Means Clustering:** Python-based ML algorithm to intelligently group geographically close orders.
   - **Route Optimization:** Google OR-Tools TSP solver calculates the absolute shortest path for delivery.
   - Saves distance, fuel costs, and carbon emissions.

3. **Predictive AI Engine (Delay Model)**
   - **Live Telemetry:** Pulls real-time Open-Meteo Weather data & TomTom live Traffic flow.
   - **XGBoost AI:** 22-feature Machine Learning model predicts SLA breach probabilities based on distance, traffic, weather, and courier reliability.
   - Fully hosted FastAPI Python Microservice linked to the dashboard via Ngrok.

4. **Fleet & Driver Management (Full CRUD)**
   - Real-time Supabase integrations.
   - **Vehicles:** Add/edit delivery vehicles, assign capacities, specify type (van, bike, truck).
   - **Team:** Manage drivers, update contact info, toggle availability status.

5. **Live Control Center Dashboard (React + Tailwind)**
   - Beautiful, dark-themed responsive dashboard.
   - **Routing Map:** Live map view with OpenRouteService polylines tracing optimized delivery routes.
   - **Intelligence Hub:** Copilot chat interface & dynamically updating Risk Cards based on AI predictions.
   - **Batching Panel:** Manual override capability to explicitly assign specific drivers/vehicles to optimized batches.

---

## 🏗️ Architecture

```
┌─────────────────┐
│  WooCommerce    │
│  (Order Created)│
└────────┬────────┘
         │ Webhook POST
         ▼
┌───────────────────────────────────────────────┐
│  Node.js Express Server (Port 3000)           │
│  - Receives webhook & Geocodes addresses      │
│  - Manages Fleet CRUD API (Vehicles/Drivers)  │
│  - Routes Prediction triggers                 │
└────────┬───────────────────────┬──────────────┘
         │                       │
         ▼                       ▼
┌───────────────────────┐ ┌───────────────────────────────┐
│  Supabase Database    │ │  React Dashboard (Vite)       │
│  - orders, batches    │ │  - Realtime map & updates     │
│  - vehicles, drivers  │ │  - Dispatch Control Center    │
│  - delay_predictions  │ │  - Intelligence Hub           │
└────────┬──────────────┘ └───────────────────────────────┘
         │
         ▼
┌───────────────────────────────────────────────┐
│  Python AI & ML Pipeline (FastAPI/Conda)      │
│  - K-Means spatial batching                   │
│  - OR-Tools Route optimizer                   │
│  - XGBoost Delay Predictor (Port 8000/Ngrok)  │
└───────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
RapidRoute/
├── backend/
│   ├── server.js                    # Express API & Webhook handler
│   ├── package.json                 # Node.js dependencies
│   ├── .env                         # Supabase configuration
│   │
│   └── batching/                    # Python Optimization Pipeline
│       ├── batch_orders.py          # K-Means clustering script
│       ├── optimize_routes.py       # OR-Tools TSP solver
│       └── run_full_pipeline.py     # Orchestrator
│
├── delay-model/                     # Python Delay Prediction Microservice
│   └── V1/
│       ├── main.py                  # FastAPI Server
│       ├── routers/                 # Prediction logic (TomTom/OpenMeteo integrations)
│       └── models/                  # XGBoost/CatBoost trained artifacts
│
└── frontend/                        # React UI
    ├── src/
    │   ├── pages/                   # Dashboard, Fleet, Routing, Intelligence components
    │   ├── App.jsx                  # React Router
    │   └── index.css                # Tailwind directives & CSS vars
    └── package.json                 # React dependencies
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+) with Conda
- **Supabase** account

### 1. Setup Backend (Node.js)
```bash
cd backend
npm install
npm run dev
```

### 2. Setup AI Pipeline & Delay Model (Python)
```bash
conda create -n rapidroute python=3.10
conda activate rapidroute

# Install dependencies for both pipelines
cd delay-model/V1
pip install fastapi uvicorn xgboost lightgbm catboost httpx pydantic supabase python-dotenv

# Start the Prediction Server
uvicorn main:app --reload --port 8000
```

### 3. Setup Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
Access the dashboard at `http://localhost:5173`

---

## 📊 Feature Highlights

### 🚗 Fleet Management
A dynamic dashboard tab allowing you to register delivery bikes, vans, and trucks (with variable capacities and running costs). Manage driver profiles, sync their live availability, and manually assign them to batched deliveries before dispatch.

### 🧠 XGBoost Delay Prediction
Clicking "Run Predictions" in the Intelligence tab sends all pending orders through the ML engine. It checks live weather patterns (e.g. 15mm of rain) against live traffic flow on the exact delivery route, calculates a mathematical risk probability, and updates the React UI via Supabase WebSockets instantly.

### 🗺️ Route Optimization Map
The Routing tab visually draws out the computed batch polylines directly on a beautiful Mapbox/Leaflet UI. Instead of viewing raw data, the logistics manager can visually see exactly how the fleet is traversing the city.

---

## ⚙️ Configuration

Ensure the following `.env` files are populated:

**backend/.env**:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role
PORT=3000
```

**delay-model/V1/.env**:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role
OPENROUTE_API_KEY=your_openroute_key
TOMTOM_API_KEY=your_tomtom_key
```

---

## 📄 License

MIT License - Built during Hackathon.
