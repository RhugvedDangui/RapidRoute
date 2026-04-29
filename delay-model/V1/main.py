# ═══════════════════════════════════════════════════════════════════════════════
# RapidRoute V1 - FastAPI Main Application
# ═══════════════════════════════════════════════════════════════════════════════

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Import routers
from routers import delay_prediction

# Initialize FastAPI app
app = FastAPI(
    title="RapidRoute API",
    description="Logistics Route Optimization & Delay Prediction Platform",
    version="1.0.0"
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(delay_prediction.router, prefix="/api/v1", tags=["Delay Prediction"])

@app.get("/")
async def root():
    return {
        "message": "RapidRoute API V1",
        "status": "operational",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )
