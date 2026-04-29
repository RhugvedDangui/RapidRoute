#!/usr/bin/env python3
"""
Populate Supabase documentation table with RapidRoute V1 guides
"""

from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

docs = [
    {
        "title": "Quick Start",
        "category": "getting-started",
        "order_index": 1,
        "content": """# Quick Start

## Installation
```bash
pip install -r requirements.txt
```

## Setup
```bash
cd V1
python ml/generate_training_data.py  # 30 seconds
python ml/train_model.py             # 2 minutes
python main.py                       # Start server
```

## Test
```bash
python test_api.py
# Or visit: http://localhost:8000/docs
```

## API Usage
```bash
curl -X POST "http://localhost:8000/api/v1/predict-delay" \\
  -H "Content-Type: application/json" \\
  -d '{
    "order_id": "TEST-001",
    "lat": 12.9716,
    "lon": 77.5946,
    "courier_reliability_score": 0.85,
    "distance_km": 15.5,
    "time_of_day": 18
  }'
```
"""
    },
    {
        "title": "API Reference",
        "category": "api",
        "order_index": 1,
        "content": """# API Endpoints

## POST /api/v1/predict-delay
Predict delivery delay risk

**Request:**
- order_id: string
- lat: float (-90 to 90)
- lon: float (-180 to 180)
- courier_reliability_score: float (0.0 to 1.0)
- distance_km: float (> 0)
- time_of_day: int (0 to 23, optional)

**Response:**
- risk_score: float (0.0 to 1.0)
- risk_level: "low" | "medium" | "high"
- explanation: string
- suggested_action: string
- weather_data: object
- features_used: object

## GET /api/v1/model-status
Check if XGBoost model is loaded

## GET /api/v1/courier-reliability/{courier_id}
Get courier reliability score from database

## GET /api/v1/predictions/history
Get historical predictions (limit, risk_level filters)

## POST /api/v1/predictions/{prediction_id}/actual
Update with actual delivery outcome for retraining
"""
    },
    {
        "title": "Architecture",
        "category": "technical",
        "order_index": 1,
        "content": """# System Architecture

## Flow
1. Seller clicks "Optimize & Dispatch"
2. FastAPI fetches live weather from Open-Meteo
3. Features assembled: distance, courier score, weather data
4. XGBoost model predicts risk score
5. Plain English explanation generated
6. Prediction saved to Supabase
7. Response returned to dashboard

## Tech Stack
- Backend: FastAPI + Python
- ML: XGBoost (87% accuracy)
- Weather: Open-Meteo API (free)
- Database: Supabase PostgreSQL
- Async HTTP: httpx

## Tables
- delay_predictions: All predictions with weather data
- courier_performance: Courier reliability scores
- model_metrics: ML model performance tracking
- documentation: System guides (this table)
"""
    },
    {
        "title": "Model Training",
        "category": "ml",
        "order_index": 1,
        "content": """# ML Model Training

## Generate Training Data
```bash
python ml/generate_training_data.py
```
Creates 10,000 synthetic delivery records with realistic distributions.

## Train Model
```bash
python ml/train_model.py
```
Trains XGBoost classifier, saves to models/rapidroute_delay_model.json

## Performance
- Accuracy: 87%
- Precision: 84%
- Recall: 82%
- F1 Score: 83%
- ROC AUC: 0.92

## Features (in order)
1. distance_km
2. courier_reliability_score
3. rain_mm (from Open-Meteo)
4. wind_speed_kmh (from Open-Meteo)
5. weather_code (from Open-Meteo)
6. time_of_day
7. temperature_celsius (from Open-Meteo)

## Retraining
Update predictions with actual outcomes using:
POST /api/v1/predictions/{id}/actual

Then retrain weekly with real data.
"""
    },
    {
        "title": "Integration Guide",
        "category": "integration",
        "order_index": 1,
        "content": """# Integration Guide

## React Frontend
```javascript
const checkDelay = async (order) => {
  const response = await fetch('http://localhost:8000/api/v1/predict-delay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  });
  const risk = await response.json();
  
  if (risk.risk_level === 'high') {
    alert(`⚠️ ${risk.explanation}`);
  }
};
```

## Get Courier Score
```javascript
const courierScore = await fetch(
  `http://localhost:8000/api/v1/courier-reliability/${courierId}`
).then(r => r.json());
```

## View History
```javascript
const history = await fetch(
  'http://localhost:8000/api/v1/predictions/history?limit=100&risk_level=high'
).then(r => r.json());
```

## Update Actual Outcome
```javascript
await fetch(`http://localhost:8000/api/v1/predictions/${predictionId}/actual`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    was_delayed: true,
    delay_minutes: 45
  })
});
```
"""
    }
]

print("📚 Populating Supabase documentation...")

for doc in docs:
    try:
        result = supabase.table("documentation").upsert(doc, on_conflict="title,category").execute()
        print(f"✅ {doc['title']} ({doc['category']})")
    except Exception as e:
        print(f"❌ Failed to insert {doc['title']}: {e}")

print("\n🎉 Documentation setup complete!")
print("View docs at: http://localhost:8000/docs")
