# ═══════════════════════════════════════════════════════════════════════════════
# RapidRoute - API Test Script
# Quick test to verify the delay prediction endpoint works
# ═══════════════════════════════════════════════════════════════════════════════

import requests
import json

# API Configuration
BASE_URL = "http://localhost:8000"
PREDICT_ENDPOINT = f"{BASE_URL}/api/v1/predict-delay"

# Test cases
test_cases = [
    {
        "name": "Normal Delivery - Bangalore (Low Risk)",
        "payload": {
            "order_id": "TEST-001",
            "origin_lat": 12.9716,  # Bangalore - MG Road
            "origin_lon": 77.5946,
            "dest_lat": 12.9352,    # Bangalore - Koramangala
            "dest_lon": 77.6245,
            "courier_reliability_score": 0.85,
            "time_of_day": 14  # 2 PM
        }
    },
    {
        "name": "Peak Hour Delivery - Mumbai (High Risk)",
        "payload": {
            "order_id": "TEST-002",
            "origin_lat": 19.0760,  # Mumbai - CST
            "origin_lon": 72.8777,
            "dest_lat": 19.1136,    # Mumbai - Bandra
            "dest_lon": 72.8697,
            "courier_reliability_score": 0.65,
            "time_of_day": 18,  # 6 PM - peak hour
            "is_weekend": False
        }
    },
    {
        "name": "Long Distance - Delhi (Medium Risk)",
        "payload": {
            "order_id": "TEST-003",
            "origin_lat": 28.7041,  # Delhi - Connaught Place
            "origin_lon": 77.1025,
            "dest_lat": 28.5355,    # Delhi - Gurgaon
            "dest_lon": 77.0910,
            "courier_reliability_score": 0.75,
            "time_of_day": 9  # 9 AM - morning rush
        }
    },
    {
        "name": "Weekend Delivery - Goa (Low Risk)",
        "payload": {
            "order_id": "TEST-004",
            "origin_lat": 15.4909,  # Goa - Panaji
            "origin_lon": 73.8278,
            "dest_lat": 15.5200,    # Goa - Mapusa
            "dest_lon": 73.8567,
            "courier_reliability_score": 0.80,
            "time_of_day": 16,
            "is_weekend": True
        }
    }
]


def test_predict_delay():
    """Test the delay prediction endpoint"""
    print("="*70)
    print("RapidRoute - Delay Prediction API Test")
    print("="*70)
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"\n✅ Server is running at {BASE_URL}")
    except requests.exceptions.RequestException:
        print(f"\n❌ Server is not running at {BASE_URL}")
        print("Start the server with: python main.py")
        return
    
    # Check model status
    try:
        response = requests.get(f"{BASE_URL}/api/v1/model-status")
        status = response.json()
        if status["model_loaded"]:
            print(f"✅ XGBoost model is loaded")
        else:
            print(f"⚠️  Model not loaded - using fallback mode")
            print(f"   Train the model with: python ml/train_model.py")
    except Exception as e:
        print(f"⚠️  Could not check model status: {e}")
    
    print("\n" + "="*70)
    print("Running Test Cases")
    print("="*70)
    
    # Run test cases
    for i, test in enumerate(test_cases, 1):
        print(f"\n{'─'*70}")
        print(f"Test {i}: {test['name']}")
        print(f"{'─'*70}")
        
        try:
            response = requests.post(
                PREDICT_ENDPOINT,
                json=test["payload"],
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                
                print(f"\n📦 Order ID: {result['order_id']}")
                print(f"🎯 Risk Score: {result['risk_score']:.3f}")
                print(f"⚠️  Risk Level: {result['risk_level'].upper()}")
                print(f"\n💬 Explanation:")
                print(f"   {result['explanation']}")
                print(f"\n✅ Suggested Action:")
                print(f"   {result['suggested_action']}")
                print(f"\n🌤️  Weather Data:")
                weather = result['weather_data']
                print(f"   Condition: {weather['weather_description']}")
                print(f"   Rain: {weather['precipitation_mm']} mm")
                print(f"   Wind: {weather['wind_speed_kmh']} km/h")
                print(f"   Temperature: {weather['temperature_celsius']}°C")
                
            else:
                print(f"❌ Request failed with status {response.status_code}")
                print(f"   Response: {response.text}")
                
        except requests.exceptions.Timeout:
            print("❌ Request timed out")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print("\n" + "="*70)
    print("Test Complete!")
    print("="*70)
    print(f"\n📚 View full API docs at: {BASE_URL}/docs")


if __name__ == "__main__":
    test_predict_delay()
