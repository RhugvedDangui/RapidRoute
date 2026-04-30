# RapidRoute - Complete Tech Stack (Corrected)

## Core Stack

| Layer | Tool | Why |
|-------|------|-----|
| **Backend (Webhooks)** | Node.js + Express | WooCommerce webhook handler, geocoding |
| **Backend (ML/API)** | Python + FastAPI | Async, perfect for ML inference & optimization |
| **Route Optimizer** | Google OR-Tools | Industry-grade VRP solver, completely free |
| **Routing API** | OpenRouteService (ORS) | Real road routing, free, no credit card |
| **ML / Batching** | Scikit-learn + XGBoost + LightGBM + CatBoost | K-Means clustering + ensemble delay prediction |
| **Database** | Supabase PostgreSQL | Free, handles auth, realtime, storage together |
| **Realtime Updates** | Supabase Realtime | Live order status on dashboard |
| **Cache** | Upstash Redis | Route caching, 10,000 req/day free |
| **Frontend (Web)** | React + Tailwind CSS + Vite | Fast, professional UI |
| **Frontend (Mobile)** | React Native + Expo | Cross-platform iOS/Android app |
| **Maps** | Leaflet.js | Free forever, no credit card ever |
| **Map Tiles** | OpenStreetMap (OSM) | Free, with custom grayscale dark mode filter |
| **Geocoding** | Nominatim (OSM) | Address to coordinates, free |
| **Weather** | Open-Meteo API | Free, no signup, India coverage |
| **Traffic** | TomTom Traffic API | Real-time traffic flow data, free tier |
| **Auth** | Supabase Auth | Email, Google login, free |
| **File Storage** | Supabase Storage | Proof of delivery photos, 1GB free |
| **Backend Hosting** | Railway.app | Always on, no sleep, free tier |
| **Frontend Hosting** | Vercel | Auto deploy, fast CDN, free |
| **CI/CD** | GitHub Actions | Push to deploy, 2000 min/month free |
| **Email** | Resend | 3000 emails/month free |
| **WhatsApp** | WhatsApp Business API | Delay alerts, free for low volume |
| **Charts** | Recharts | Free React charting library |
| **PDF Export** | ReportLab / WeasyPrint | Server-side PDF generation |

---

## Traffic Intelligence Stack (India-Specific, All Free)

| Layer | Tool | Purpose |
|-------|------|---------|
| **Real-time traffic** | TomTom Traffic API | Live road speed data (current vs free-flow) |
| **Weather delays** | Open-Meteo API | Rain, storm, visibility |
| **Peak hour patterns** | Built-in multipliers | Indian city-specific patterns |
| **Festival calendar** | Built-in data | Diwali, IPL, bandh detection |
| **Final time estimate** | Combined calculation | Realistic Indian delivery time |

---

## AI Agent Stack (Separate Module)

| Layer | Tool | Why |
|-------|------|-----|
| **LLM** | OpenCode Zen (Big Pickle) | Free, powerful reasoning model |
| **Framework** | LangGraph + LangChain | Agent orchestration & memory |
| **Vector DB** | Qdrant Cloud | RAG document search |
| **Web Search** | Tavily API | Real-time web information |
| **Short-term Memory** | Upstash Redis | Session context |
| **Long-term Memory** | mem0.ai | Persistent user memory |
| **Tracing** | Langfuse | Observability & debugging |
| **Embeddings** | Sentence Transformers | Local, no API cost |
| **OCR** | Tesseract + pytesseract | Image text extraction |
| **Audio** | Faster Whisper | Local transcription |
| **UI** | Gradio | Quick agent interface |

---

## Key Corrections from Original Document

### ❌ Wrong in Original
- **Traffic**: Listed as "HERE Maps API" 
- **Map Tiles**: Listed as "CartoDB Dark Matter"
- **Backend**: Only mentioned FastAPI, missed Node.js/Express

### ✅ Actual Implementation
- **Traffic**: **TomTom Traffic API** (flowSegmentData endpoint)
- **Map Tiles**: **OpenStreetMap with CSS grayscale filter** for dark mode
- **Backend**: **Dual backend** - Node.js for webhooks, FastAPI for ML/optimization

---

## Environment Variables Required

### Backend (Node.js)
```env
SUPABASE_URL=https://sujbxntyrfqgvxgxbbyk.supabase.co
SUPABASE_ANON_KEY=sb_publishable_...
PORT=3000
```

### Delay Model (FastAPI)
```env
SUPABASE_URL=https://sujbxntyrfqgvxgxbbyk.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENMETEO_URI=https://api.open-meteo.com/v1
OPENROUTE_API_KEY=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImFkYTk2MzU1NGNiNTQxODg5YmIzMTNiMzk0ZDJlNmU3IiwiaCI6Im11cm11cjY0In0=
TOMTOM_API_KEY=FUjE3QskZFEEKUqFDye3yYY8cHThknuv
WOOCOMMERCE_CONSUMER_KEY=ck_...
WOOCOMMERCE_CONSUMER_SECRET=cs_...
```

### Batching Scripts
```env
SUPABASE_URL=https://sujbxntyrfqgvxgxbbyk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### AI Agent
```env
OPENCODE_API_KEY=sk-...
OPENCODE_BASE_URL=https://opencode.ai/zen/v1
LLM_MODEL=big-pickle
TAVILY_API_KEY=tvly-dev-...
QDRANT_URL=https://...
QDRANT_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
UPSTASH_REDIS_URL=https://tough-snake-85163.upstash.io
UPSTASH_REDIS_TOKEN=gQAAAAAAAUyrAAIg...
MEM0_API_KEY=m0-...
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com
SUPABASE_URL=https://sujbxntyrfqgvxgxbbyk.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     WooCommerce Store                        │
└────────────────────────┬────────────────────────────────────┘
                         │ Webhook (New Order)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Node.js Backend (Webhook Handler)               │
│  • Receives order webhook                                    │
│  • Geocodes address (Nominatim)                             │
│  • Saves to Supabase orders table                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase PostgreSQL                        │
│  Tables: orders, batches, routes, courier_performance       │
└────┬────────────────────────────────────────────────────┬───┘
     │                                                     │
     ▼                                                     ▼
┌─────────────────────────┐              ┌─────────────────────────┐
│  Batching Script (Py)   │              │  FastAPI Delay Model    │
│  • K-Means clustering   │              │  • Weather (Open-Meteo) │
│  • Time window split    │              │  • Traffic (TomTom)     │
│  • Creates batches      │              │  • Route (ORS)          │
└────────┬────────────────┘              │  • ML Prediction        │
         │                                └─────────────────────────┘
         ▼
┌─────────────────────────┐
│ Route Optimizer (Py)    │
│  • Google OR-Tools TSP  │
│  • Haversine distances  │
│  • Optimal sequence     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              React Frontend + Mobile App                     │
│  • Dashboard (orders, batches, routes)                      │
│  • Leaflet maps with OSM tiles                              │
│  • Real-time updates (Supabase Realtime)                    │
│  • Driver tracking (mobile app)                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Free Tier Limits

| Service | Free Tier Limit |
|---------|----------------|
| Supabase | 500MB database, 1GB storage, 2GB bandwidth |
| OpenRouteService | 2,000 requests/day |
| TomTom Traffic | 2,500 requests/day |
| Open-Meteo | Unlimited (no API key) |
| Nominatim | 1 request/second |
| Upstash Redis | 10,000 requests/day |
| Railway.app | $5 credit/month |
| Vercel | 100GB bandwidth/month |
| Resend | 3,000 emails/month |
| Tavily | 1,000 searches/month |
| Qdrant Cloud | 1GB cluster |

---

## Notes

1. **Dual Backend Architecture**: Node.js handles WooCommerce webhooks (simpler for webhook validation), while FastAPI handles ML inference and optimization (better for Python ML libraries).

2. **Map Styling**: Using CSS filter `grayscale(100%) invert(100%) contrast(120%)` on OSM tiles instead of CartoDB Dark Matter for true zero-cost dark mode.

3. **Traffic Data**: TomTom provides `currentSpeed` vs `freeFlowSpeed` which is more accurate than HERE Maps for Indian roads.

4. **ML Ensemble**: Using XGBoost + LightGBM + CatBoost with stacking meta-learner for better delay predictions (F1 score: 0.85+).

5. **Mobile App**: React Native with Expo for cross-platform delivery driver app with real-time location tracking.
