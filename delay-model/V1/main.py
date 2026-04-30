from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import delay_prediction

app = FastAPI(title="RapidRoute Delay Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(delay_prediction.router, prefix="/api/v1")

@app.get("/")
def health_check():
    return {"status": "ok", "message": "RapidRoute AI Engine Online"}
