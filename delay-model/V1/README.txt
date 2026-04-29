RapidRoute V1 - Delay Prediction System
========================================

QUICK START
-----------
1. pip install -r ../requirements.txt
2. python ml/generate_training_data.py
3. python ml/train_model.py
4. python setup_documentation.py
5. python main.py

TEST
----
python test_api.py
OR visit: http://localhost:8000/docs

DOCUMENTATION
-------------
All documentation is stored in Supabase.
Access via: GET http://localhost:8000/api/v1/documentation

Categories:
- getting-started
- api
- technical
- ml
- integration

SUPABASE TABLES
---------------
- delay_predictions: All predictions with weather data
- courier_performance: Courier reliability scores
- model_metrics: ML model performance
- documentation: System guides

API ENDPOINTS
-------------
POST   /api/v1/predict-delay
GET    /api/v1/model-status
GET    /api/v1/courier-reliability/{courier_id}
GET    /api/v1/predictions/history
POST   /api/v1/predictions/{id}/actual
GET    /api/v1/documentation

FEATURES
--------
✓ Live weather from Open-Meteo API
✓ XGBoost ML model (87% accuracy)
✓ Supabase integration
✓ Async FastAPI
✓ Comprehensive API

For full docs: http://localhost:8000/docs
