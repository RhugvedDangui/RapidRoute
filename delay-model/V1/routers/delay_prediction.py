# ═══════════════════════════════════════════════════════════════════════════════
# RapidRoute - Delay Prediction Router v2
# Integrates Open-Meteo Weather + TomTom Traffic + XGBoost/LightGBM Ensemble
# ═══════════════════════════════════════════════════════════════════════════════

import httpx
import xgboost as xgb
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# Open-Meteo API Configuration
OPENMETEO_URI = "https://api.open-meteo.com/v1/forecast"

# OpenRouteService API Configuration (for routing)
OPENROUTE_DIRECTIONS_URI = "https://api.openrouteservice.org/v2/directions/driving-car"
OPENROUTE_API_KEY = os.getenv("OPENROUTE_API_KEY")

# TomTom Traffic API Configuration (for real-time traffic in India!)
TOMTOM_TRAFFIC_URI = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json"
TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY")

# ─── FEATURE COLUMNS — must match train_model.py EXACTLY ─────────────────────
FEATURE_COLUMNS = [
    # Original 9
    'distance_km', 'courier_reliability_score', 'rain_mm', 'wind_speed_kmh',
    'weather_code', 'time_of_day', 'temperature_celsius', 'traffic_level',
    'is_weekend',
    # V2 engineered (5)
    'weather_severity', 'is_peak_hour', 'distance_bucket',
    'rain_x_traffic', 'courier_x_distance',
    # V3 new (8)
    'is_monsoon', 'day_of_week',
    'wind_x_rain', 'weather_x_peak', 'courier_x_weather', 'traffic_x_dist',
    'time_sin', 'time_cos',
]

# ─── LOAD MODELS ─────────────────────────────────────────────────────────────
MODEL_PATH     = Path(__file__).parent.parent / "models" / "rapidroute_delay_model.json"
LGB_MODEL_PATH = Path(__file__).parent.parent / "models" / "rapidroute_delay_lgb.txt"
CB_MODEL_PATH  = Path(__file__).parent.parent / "models" / "rapidroute_delay_cb.cbm"

delay_model     = None  # XGBoost
lgb_delay_model = None  # LightGBM
cb_delay_model  = None  # CatBoost

if MODEL_PATH.exists():
    delay_model = xgb.Booster()
    delay_model.load_model(str(MODEL_PATH))
    print(f"XGBoost model loaded from {MODEL_PATH}")
else:
    print(f"XGBoost model not found at {MODEL_PATH}. Run train_model.py first.")

try:
    import lightgbm as lgb
    if LGB_MODEL_PATH.exists():
        lgb_delay_model = lgb.Booster(model_file=str(LGB_MODEL_PATH))
        print(f"LightGBM model loaded from {LGB_MODEL_PATH}")
except ImportError:
    pass

try:
    from catboost import CatBoostClassifier
    if CB_MODEL_PATH.exists():
        cb_delay_model = CatBoostClassifier()
        cb_delay_model.load_model(str(CB_MODEL_PATH))
        print(f"CatBoost model loaded from {CB_MODEL_PATH}")
except ImportError:
    pass


# ───────────────────────────────────────────────────────────────────────────────
# REQUEST & RESPONSE MODELS
# ───────────────────────────────────────────────────────────────────────────────

class OrderDispatch(BaseModel):
    """Request model for delay prediction"""
    order_id: str = Field(..., description="Unique order identifier")
    origin_lat: float = Field(..., ge=-90, le=90, description="Warehouse/origin latitude")
    origin_lon: float = Field(..., ge=-180, le=180, description="Warehouse/origin longitude")
    dest_lat: float = Field(..., ge=-90, le=90, description="Destination latitude")
    dest_lon: float = Field(..., ge=-180, le=180, description="Destination longitude")
    courier_id: str = Field(
        ...,
        description="Courier/driver ID — reliability score is auto-fetched from Supabase courier_performance table"
    )
    courier_reliability_score: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Manual override for courier score (0-1). If omitted, auto-fetched using courier_id."
    )
    distance_km: Optional[float] = Field(None, gt=0, description="Delivery distance (calculated if not provided)")
    time_of_day: Optional[int] = Field(
        default=None,
        ge=0,
        le=23,
        description="Hour of day for delivery (0-23). Defaults to current server hour."
    )
    is_weekend: Optional[bool] = Field(
        default=None,
        description="Is delivery on weekend? Defaults to today's day."
    )


class DelayPredictionResponse(BaseModel):
    """Response model for delay prediction"""
    order_id: str
    is_delayed: bool          # True = predicted delayed, False = on time
    risk_score: float         # 0.0 (safe) → 1.0 (certain delay)
    risk_level: str           # "low" | "medium" | "high"
    explanation: str
    suggested_action: str
    weather_data: dict
    features_used: dict


# ───────────────────────────────────────────────────────────────────────────────
# FEATURE ENGINEERING HELPERS
# ───────────────────────────────────────────────────────────────────────────────

def weather_code_to_severity(code: int) -> int:
    """Convert WMO weather code to ordinal severity (0–6)."""
    if code in [0, 1]:          return 0
    elif code in [2, 3]:        return 1
    elif code in [45, 48]:      return 2
    elif code in [51, 53, 55]:  return 3
    elif code in [61, 80]:      return 3
    elif code in [63, 81]:      return 4
    elif code in [65, 82]:      return 5
    elif code in [95, 96, 99]:  return 6
    else:                       return 2


def distance_bucket(d: float) -> int:
    """Ordinal distance risk bucket: 0=<5km, 1=5-10, 2=10-20, 3=20-30, 4=>30"""
    if d < 5:   return 0
    if d < 10:  return 1
    if d < 20:  return 2
    if d < 30:  return 3
    return 4


def build_feature_vector(
    distance_km: float,
    courier_score: float,
    rain_mm: float,
    wind_speed: float,
    weather_code: int,
    time_of_day: int,
    temperature: float,
    traffic_level: float,
    is_weekend: bool,
    is_monsoon: bool = False,
    day_of_week: int = 0,
) -> np.ndarray:
    """
    Build 22-element feature vector matching the v3 training schema.
    Must be kept in sync with FEATURE_COLUMNS and train_model.py.
    """
    # V2 derived
    w_severity = weather_code_to_severity(weather_code)
    peak_hour  = 1 if time_of_day in [8, 9, 10, 17, 18, 19, 20] else 0
    dist_bkt   = distance_bucket(distance_km)
    rain_x_traffic = (np.log1p(rain_mm) / np.log1p(25)) * (traffic_level / 100.0)
    courier_risk       = (1.0 - courier_score) ** 1.5
    courier_x_distance = courier_risk * (np.log1p(distance_km) / np.log1p(30))

    # V3 new interactions
    wind_x_rain       = (wind_speed / 80.0) * (np.log1p(rain_mm) / np.log1p(25))
    weather_x_peak    = float(w_severity) * float(peak_hour)
    courier_x_weather = courier_risk * float(w_severity) / 6.0
    traffic_x_dist    = (traffic_level / 100.0) * float(dist_bkt) / 4.0

    # V3 cyclical time
    time_sin = float(np.sin(2 * np.pi * time_of_day / 24))
    time_cos = float(np.cos(2 * np.pi * time_of_day / 24))

    return np.array([[
        distance_km,
        courier_score,
        rain_mm,
        wind_speed,
        float(weather_code),
        float(time_of_day),
        temperature,
        traffic_level,
        float(is_weekend),
        float(w_severity),
        float(peak_hour),
        float(dist_bkt),
        float(rain_x_traffic),
        float(courier_x_distance),
        float(is_monsoon),
        float(day_of_week),
        float(wind_x_rain),
        float(weather_x_peak),
        float(courier_x_weather),
        float(traffic_x_dist),
        time_sin,
        time_cos,
    ]])


def calculate_traffic_level(time_of_day: int, is_weekend: bool) -> float:
    """Estimate traffic level based on time and day (fallback if Mapbox fails)"""
    if is_weekend:
        base_traffic = 30.0
    else:
        if time_of_day in [8, 9, 10]:  # Morning rush
            base_traffic = 85.0
        elif time_of_day in [17, 18, 19, 20]:  # Evening rush
            base_traffic = 90.0
        elif time_of_day in [12, 13, 14]:  # Lunch time
            base_traffic = 60.0
        elif time_of_day in [7, 11, 16, 21]:  # Near peak
            base_traffic = 50.0
        else:  # Off-peak
            base_traffic = 30.0
    
    return base_traffic


async def fetch_tomtom_traffic(lat: float, lon: float) -> dict:
    """
    Fetch real-time traffic data from TomTom Traffic API
    Returns current speed vs free flow speed for the location
    """
    try:
        params = {
            "key": TOMTOM_API_KEY,
            "point": f"{lat},{lon}",
            "unit": "KMPH"
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(TOMTOM_TRAFFIC_URI, params=params)
            response.raise_for_status()
            data = response.json()
        
        if data.get("flowSegmentData"):
            flow = data["flowSegmentData"]
            
            current_speed = flow.get("currentSpeed", 40)  # km/h
            free_flow_speed = flow.get("freeFlowSpeed", 50)  # km/h
            current_travel_time = flow.get("currentTravelTime", 0)  # seconds
            free_flow_travel_time = flow.get("freeFlowTravelTime", 0)  # seconds
            confidence = flow.get("confidence", 0.5)  # 0-1
            
            # Calculate traffic level based on speed ratio
            speed_ratio = current_speed / free_flow_speed if free_flow_speed > 0 else 1.0
            
            # Traffic level calculation:
            # 90-100% of free flow → 10-20% traffic (light)
            # 70-90% of free flow → 20-40% traffic (moderate)
            # 50-70% of free flow → 40-60% traffic (heavy)
            # 30-50% of free flow → 60-80% traffic (very heavy)
            # <30% of free flow → 80-100% traffic (crawling)
            
            if speed_ratio > 0.9:
                traffic_level = 10 + (1.0 - speed_ratio) * 100
            elif speed_ratio > 0.7:
                traffic_level = 20 + (0.9 - speed_ratio) * 100
            elif speed_ratio > 0.5:
                traffic_level = 40 + (0.7 - speed_ratio) * 100
            elif speed_ratio > 0.3:
                traffic_level = 60 + (0.5 - speed_ratio) * 100
            else:
                traffic_level = 80 + (0.3 - speed_ratio) * 66.7
            
            traffic_level = max(0, min(100, traffic_level))
            
            # Calculate delay factor
            delay_factor = (current_travel_time / free_flow_travel_time) if free_flow_travel_time > 0 else 1.0
            
            return {
                "current_speed_kmh": round(current_speed, 1),
                "free_flow_speed_kmh": round(free_flow_speed, 1),
                "speed_ratio": round(speed_ratio, 2),
                "traffic_level": round(traffic_level, 1),
                "delay_factor": round(delay_factor, 2),
                "confidence": round(confidence, 2),
                "source": "tomtom_live"
            }
        else:
            raise Exception("No traffic data available")
            
    except Exception as e:
        print(f"TomTom Traffic API error: {e}")
        return None


async def fetch_openroute_traffic(origin_lon: float, origin_lat: float, dest_lon: float, dest_lat: float) -> dict:
    """
    Fetch real-time routing data from OpenRouteService API (FREE - no credit card!)
    Returns: {distance_km, duration_minutes, traffic_level}
    """
    try:
        # OpenRouteService uses [lon, lat] format
        coordinates = [[origin_lon, origin_lat], [dest_lon, dest_lat]]
        
        headers = {
            "Authorization": OPENROUTE_API_KEY,
            "Content-Type": "application/json"
        }
        
        payload = {
            "coordinates": coordinates
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(OPENROUTE_DIRECTIONS_URI, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
        
        if data.get("routes"):
            route = data["routes"][0]
            summary = route["summary"]
            
            distance_m = summary["distance"]
            duration_s = summary["duration"]
            
            distance_km = distance_m / 1000
            duration_minutes = duration_s / 60
            
            # Calculate traffic level based on speed
            # Average speed = distance / time
            avg_speed_kmh = (distance_km / duration_minutes) * 60 if duration_minutes > 0 else 40
            
            # Traffic level estimation:
            # Free flow: 40-60 km/h → traffic_level = 20-40
            # Moderate: 20-40 km/h → traffic_level = 40-70
            # Heavy: 10-20 km/h → traffic_level = 70-90
            # Crawling: <10 km/h → traffic_level = 90-100
            
            if avg_speed_kmh > 40:
                traffic_level = 20 + (60 - avg_speed_kmh) * 0.5
            elif avg_speed_kmh > 20:
                traffic_level = 40 + (40 - avg_speed_kmh) * 1.5
            elif avg_speed_kmh > 10:
                traffic_level = 70 + (20 - avg_speed_kmh) * 2
            else:
                traffic_level = 90 + (10 - avg_speed_kmh)
            
            traffic_level = max(0, min(100, traffic_level))
            
            return {
                "distance_km": round(distance_km, 2),
                "duration_minutes": round(duration_minutes, 1),
                "avg_speed_kmh": round(avg_speed_kmh, 1),
                "traffic_level": round(traffic_level, 1),
                "source": "openrouteservice"
            }
        else:
            raise Exception("No routes found")
            
    except Exception as e:
        print(f"OpenRouteService API error: {e}")
        return None


def interpret_weather_code(code: int) -> str:
    """Convert Open-Meteo weather code to human-readable description"""
    weather_codes = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        71: "Slight snow",
        73: "Moderate snow",
        75: "Heavy snow",
        77: "Snow grains",
        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        85: "Slight snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail"
    }
    return weather_codes.get(code, "Unknown weather condition")


def calculate_risk_level(risk_score: float) -> str:
    """Convert risk score to categorical level"""
    if risk_score < 0.3:
        return "low"
    elif risk_score < 0.7:
        return "medium"
    else:
        return "high"


def generate_explanation_and_action(
    risk_score: float,
    rain_mm: float,
    wind_speed: float,
    weather_code: int,
    courier_score: float,
    distance_km: float,
    time_of_day: int
) -> tuple[str, str]:
    """Generate human-readable explanation and suggested action"""
    
    explanations = []
    actions = []
    
    # Weather-based factors
    if rain_mm > 10:
        explanations.append(f"heavy rain ({rain_mm:.1f}mm)")
        actions.append("Consider assigning a 4-wheeler or alerting customer of potential delay")
    elif rain_mm > 5:
        explanations.append(f"moderate rain ({rain_mm:.1f}mm)")
        actions.append("Monitor weather conditions closely")
    
    if wind_speed > 40:
        explanations.append(f"strong winds ({wind_speed:.1f} km/h)")
        actions.append("Avoid assigning to 2-wheelers")
    
    if weather_code in [95, 96, 99]:
        explanations.append("thunderstorm conditions")
        actions.append("Delay dispatch until weather improves")
    
    # Courier reliability
    if courier_score < 0.5:
        explanations.append(f"low courier reliability ({courier_score:.0%})")
        actions.append("Reassign to a higher-rated courier partner")
    elif courier_score < 0.7:
        explanations.append(f"moderate courier reliability ({courier_score:.0%})")
        actions.append("Monitor delivery progress closely")
    
    # Distance factor
    if distance_km > 30:
        explanations.append(f"long distance delivery ({distance_km:.1f} km)")
        actions.append("Allocate extra buffer time for SLA")
    
    # Peak hour factor
    if time_of_day in [8, 9, 10, 17, 18, 19, 20]:
        explanations.append("peak traffic hours")
        actions.append("Add 30-45 minutes buffer for traffic")
    
    # Generate final explanation
    if risk_score < 0.3:
        explanation = "Normal conditions. Low risk of delay."
        action = "Dispatch as planned."
    elif not explanations:
        explanation = "Moderate risk based on combined factors."
        action = "Monitor delivery progress."
    else:
        explanation = f"High risk of delay due to {', '.join(explanations)}."
        action = " | ".join(actions) if actions else "Monitor delivery closely."
    
    return explanation, action


# ───────────────────────────────────────────────────────────────────────────────
# COURIER SCORE LOOKUP
# ───────────────────────────────────────────────────────────────────────────────

DEFAULT_COURIER_SCORE = 0.75  # Neutral score for couriers with no history

async def fetch_courier_score(courier_id: str) -> tuple[float, str]:
    """
    Fetch courier reliability score from Supabase courier_performance table.
    Returns (score, source) where source is 'supabase' or 'default'.

    The courier_performance table tracks:
      - reliability_score: successful_deliveries / total_deliveries
      - total_deliveries, average_delay_minutes, etc.
    """
    try:
        result = (
            supabase
            .table("courier_performance")
            .select("reliability_score, total_deliveries, average_delay_minutes")
            .eq("courier_id", courier_id)
            .order("last_updated", desc=True)
            .limit(1)
            .execute()
        )
        if result.data and len(result.data) > 0:
            row = result.data[0]
            score = float(row.get("reliability_score", DEFAULT_COURIER_SCORE))
            total = row.get("total_deliveries", 0)
            avg_delay = row.get("average_delay_minutes", 0)
            # If courier has very few deliveries, blend with default (shrinkage)
            if total < 10:
                # Blend: fewer deliveries = more weight on neutral default
                weight = total / 10.0
                score = weight * score + (1 - weight) * DEFAULT_COURIER_SCORE
            return round(score, 4), "supabase"
        else:
            # Courier not found in performance table — new courier, use default
            return DEFAULT_COURIER_SCORE, "default_new_courier"
    except Exception as e:
        # Supabase error — fall back gracefully, don't crash the prediction
        print(f"Warning: Could not fetch courier score for {courier_id}: {e}")
        return DEFAULT_COURIER_SCORE, "default_fallback"


# ───────────────────────────────────────────────────────────────────────────────
# API ENDPOINT
# ───────────────────────────────────────────────────────────────────────────────

@router.post("/predict-delay", response_model=DelayPredictionResponse)
async def predict_delivery_risk(order: OrderDispatch):
    """
    Predict delivery delay risk.

    Flow:
    0. Auto-fetch courier reliability score from Supabase using courier_id
    1. Fetch live weather from Open-Meteo
    2. Fetch route distance from OpenRouteService
    3. Fetch live traffic from TomTom
    4. Assemble 22-feature vector
    5. Ensemble predict (XGBoost + LightGBM + CatBoost)
    6. Return risk score + explanation
    """

    # ─────────────────────────────────────────────────────────────────────────
    # STEP 0: Resolve time/weekend from server clock if not provided
    # ─────────────────────────────────────────────────────────────────────────
    from datetime import datetime
    _now = datetime.now()
    time_of_day = order.time_of_day if order.time_of_day is not None else _now.hour
    is_weekend  = order.is_weekend  if order.is_weekend  is not None else (_now.weekday() >= 5)

    # ─────────────────────────────────────────────────────────────────────────
    # STEP 0.5: Auto-fetch courier reliability score from Supabase
    # ─────────────────────────────────────────────────────────────────────────
    if order.courier_reliability_score is not None:
        # Manual override provided (useful for testing / backfill scenarios)
        courier_score  = order.courier_reliability_score
        courier_source = "manual_override"
    else:
        courier_score, courier_source = await fetch_courier_score(order.courier_id)

    # ─────────────────────────────────────────────────────────────────────────
    # STEP 1: Fetch Live Weather Data from Open-Meteo
    # ─────────────────────────────────────────────────────────────────────────
    params = {
        "latitude": order.dest_lat,
        "longitude": order.dest_lon,
        "current": "precipitation,weather_code,wind_speed_10m,temperature_2m",
        "timezone": "auto"
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(OPENMETEO_URI, params=params)
            response.raise_for_status()
            weather_data = response.json()
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Weather API request failed: {str(e)}"
        )
    
    # Extract weather variables
    current_weather = weather_data.get("current", {})
    rain_mm = current_weather.get("precipitation", 0.0)
    wind_speed = current_weather.get("wind_speed_10m", 0.0)
    weather_code = current_weather.get("weather_code", 0)
    temperature = current_weather.get("temperature_2m", 25.0)
    
    # ─────────────────────────────────────────────────────────────────────────
    # STEP 1.5: Fetch Real-Time Traffic from TomTom (India-optimized!)
    # ─────────────────────────────────────────────────────────────────────────
    
    # First, get route distance from OpenRouteService
    route_data = await fetch_openroute_traffic(
        order.origin_lon, order.origin_lat,
        order.dest_lon, order.dest_lat
    )
    
    if route_data:
        distance_km = route_data["distance_km"]
        base_duration_minutes = route_data["duration_minutes"]
    else:
        distance_km = order.distance_km if order.distance_km else 10.0
        base_duration_minutes = (distance_km / 30) * 60  # Assume 30 km/h average
    
    # Then, get real-time traffic at destination from TomTom
    traffic_data = await fetch_tomtom_traffic(order.dest_lat, order.dest_lon)
    
    if traffic_data:
        # Use real traffic data from TomTom
        traffic_level = traffic_data["traffic_level"]
        current_speed = traffic_data["current_speed_kmh"]
        free_flow_speed = traffic_data["free_flow_speed_kmh"]
        delay_factor = traffic_data["delay_factor"]
        
        # Adjust duration based on traffic
        duration_minutes = base_duration_minutes * delay_factor
        avg_speed_kmh = current_speed
        traffic_source = "tomtom_live"
    else:
        # Fallback to time-based estimation
        traffic_level = calculate_traffic_level(time_of_day, is_weekend)
        duration_minutes = base_duration_minutes
        avg_speed_kmh = None
        traffic_source = "estimated"
    
    # ─────────────────────────────────────────────────────────────────────────
    # STEP 2: Assemble Features (22-feature v3 model)
    # ─────────────────────────────────────────────────────────────────────────
    is_monsoon  = _now.month in [6, 7, 8, 9]  # Indian monsoon: June-September
    day_of_week = _now.weekday()               # 0=Monday ... 6=Sunday

    features = build_feature_vector(
        distance_km=distance_km,
        courier_score=courier_score,
        rain_mm=rain_mm,
        wind_speed=wind_speed,
        weather_code=int(weather_code),
        time_of_day=time_of_day,
        temperature=temperature,
        traffic_level=traffic_level,
        is_weekend=is_weekend,
        is_monsoon=is_monsoon,
        day_of_week=day_of_week,
    )
    
    # ─────────────────────────────────────────────────────────────────────────
    # STEP 3: Predict Risk Score (ensemble across available models)
    # ─────────────────────────────────────────────────────────────────────────
    scores = []
    if delay_model is not None:
        dmatrix = xgb.DMatrix(features, feature_names=FEATURE_COLUMNS)
        scores.append(float(delay_model.predict(dmatrix)[0]))
    if lgb_delay_model is not None:
        scores.append(float(lgb_delay_model.predict(features)[0]))
    if cb_delay_model is not None:
        scores.append(float(cb_delay_model.predict_proba(features)[0][1]))

    if scores:
        risk_score = float(np.mean(scores))
    else:
        # Fallback: Rule-based risk calculation if model not loaded
        risk_score = 0.0
        
        # Weather impact
        if rain_mm > 10:
            risk_score += 0.4
        elif rain_mm > 5:
            risk_score += 0.2
        
        if wind_speed > 40:
            risk_score += 0.2
        elif wind_speed > 25:
            risk_score += 0.1
        
        if weather_code in [95, 96, 99]:  # Thunderstorm
            risk_score += 0.3
        elif weather_code in [61, 63, 65]:  # Rain
            risk_score += 0.15
        
        # Courier reliability impact
        if order.courier_reliability_score < 0.5:
            risk_score += 0.3
        elif order.courier_reliability_score < 0.7:
            risk_score += 0.15
        
        # Distance impact
        if order.distance_km > 30:
            risk_score += 0.1
        
        # Peak hour impact
        if order.time_of_day in [8, 9, 10, 17, 18, 19, 20]:
            risk_score += 0.1
        
        # Traffic impact
        if traffic_level > 80:
            risk_score += 0.25
        elif traffic_level > 60:
            risk_score += 0.15
        
        # Weekend reduces risk slightly
        if order.is_weekend:
            risk_score -= 0.05
        
        # Cap at 1.0
        risk_score = min(risk_score, 1.0)
    
    # ─────────────────────────────────────────────────────────────────────────
    # STEP 4: Generate Explanation and Action
    # ─────────────────────────────────────────────────────────────────────────
    explanation, suggested_action = generate_explanation_and_action(
        risk_score=risk_score,
        rain_mm=rain_mm,
        wind_speed=wind_speed,
        weather_code=weather_code,
        courier_score=courier_score,
        distance_km=distance_km,
        time_of_day=time_of_day
    )
    
    risk_level = calculate_risk_level(risk_score)
    
    # ─────────────────────────────────────────────────────────────────────────
    # STEP 5: Save to Supabase
    # ─────────────────────────────────────────────────────────────────────────
    try:
        supabase.table("delay_predictions").insert({
            "order_id": order.order_id,
            "risk_score": round(risk_score, 3),
            "risk_level": risk_level,
            "explanation": explanation,
            "suggested_action": suggested_action,
            "precipitation_mm": rain_mm,
            "wind_speed_kmh": wind_speed,
            "weather_code": weather_code,
            "weather_description": interpret_weather_code(weather_code),
            "temperature_celsius": temperature,
            "distance_km": distance_km,
            "courier_reliability_score": courier_score,
            "time_of_day": time_of_day
        }).execute()
    except Exception as e:
        # Log error but don't fail the request
        print(f"Warning: Failed to save to Supabase: {e}")
    
    # ─────────────────────────────────────────────────────────────────────────
    # STEP 6: Return Response
    # ─────────────────────────────────────────────────────────────────────────
    return DelayPredictionResponse(
        order_id=order.order_id,
        is_delayed=risk_score >= 0.5,
        risk_score=round(risk_score, 3),
        risk_level=risk_level,
        explanation=explanation,
        suggested_action=suggested_action,
        weather_data={
            "precipitation_mm": rain_mm,
            "wind_speed_kmh": wind_speed,
            "weather_code": weather_code,
            "weather_description": interpret_weather_code(weather_code),
            "temperature_celsius": temperature
        },
        features_used={
            "distance_km": distance_km,
            "courier_reliability_score": courier_score,
            "courier_score_source": courier_source,
            "time_of_day": time_of_day,
            "traffic_level": traffic_level,
            "traffic_source": traffic_source,
            "avg_speed_kmh": avg_speed_kmh,
            "estimated_duration_minutes": round(duration_minutes, 1)
        }
    )


@router.get("/model-status")
async def get_model_status():
    """Check if XGBoost model is loaded"""
    return {
        "model_loaded": delay_model is not None,
        "model_path": str(MODEL_PATH),
        "fallback_mode": delay_model is None
    }


@router.get("/courier-reliability/{courier_id}")
async def get_courier_reliability(courier_id: str, zone_id: Optional[str] = None):
    """Get courier reliability score from Supabase"""
    try:
        query = supabase.table("courier_performance").select("*").eq("courier_id", courier_id)
        
        if zone_id:
            query = query.eq("zone_id", zone_id)
        
        result = query.execute()
        
        if result.data:
            return {
                "courier_id": courier_id,
                "reliability_score": result.data[0]["reliability_score"],
                "total_deliveries": result.data[0]["total_deliveries"],
                "successful_deliveries": result.data[0]["successful_deliveries"],
                "average_delay_minutes": result.data[0]["average_delay_minutes"]
            }
        else:
            # Return default score if no data
            return {
                "courier_id": courier_id,
                "reliability_score": 0.75,
                "total_deliveries": 0,
                "message": "No historical data, using default score"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch courier data: {str(e)}")


@router.get("/predictions/history")
async def get_prediction_history(limit: int = 50, risk_level: Optional[str] = None):
    """Get historical predictions from Supabase"""
    try:
        query = supabase.table("delay_predictions").select("*").order("created_at", desc=True).limit(limit)
        
        if risk_level:
            query = query.eq("risk_level", risk_level)
        
        result = query.execute()
        
        return {
            "total": len(result.data),
            "predictions": result.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch predictions: {str(e)}")


@router.post("/predictions/{prediction_id}/actual")
async def update_actual_outcome(prediction_id: str, was_delayed: bool, delay_minutes: int = 0):
    """Update prediction with actual delivery outcome for model retraining"""
    try:
        supabase.table("delay_predictions").update({
            "actual_delayed": was_delayed,
            "actual_delay_minutes": delay_minutes
        }).eq("id", prediction_id).execute()
        
        return {
            "success": True,
            "message": "Actual outcome recorded for model retraining"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update outcome: {str(e)}")


@router.get("/documentation")
async def get_documentation(category: Optional[str] = None):
    """Get documentation from Supabase"""
    try:
        query = supabase.table("documentation").select("*").order("category").order("order_index")
        
        if category:
            query = query.eq("category", category)
        
        result = query.execute()
        
        return {
            "total": len(result.data),
            "docs": result.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch documentation: {str(e)}")
