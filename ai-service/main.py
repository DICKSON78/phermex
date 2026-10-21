# ai-service/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime
import logging

from config import get_settings
from services.forecasting import DemandForecaster, SalesForecaster
from services.nlp import MedicalNLP
from services.recommendations import RecommendationEngine
from vector_store.chromadb_client import ChromaDBClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global model instances (loaded once at startup)
forecaster: DemandForecaster = None
sales_forecaster: SalesForecaster = None
nlp: MedicalNLP = None
recommender: RecommendationEngine = None
vector_db: ChromaDBClient = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global forecaster, sales_forecaster, nlp, recommender, vector_db
    settings = get_settings()
    
    logger.info("🚀 Starting Phermex AI Service...")
    
    # Initialize services
    forecaster = DemandForecaster(settings)
    sales_forecaster = SalesForecaster(settings)
    nlp = MedicalNLP(settings)
    recommender = RecommendationEngine(settings)
    vector_db = ChromaDBClient()
    
    # Initialize ChromaDB connection
    await vector_db.connect()
    
    # Load pre-trained models if they exist
    forecaster.load_models()
    recommender.load_model()
    
    logger.info("✅ AI Service ready!")
    yield
    
    logger.info("🛑 Shutting down...")

app = FastAPI(
    title="Phermex AI Service",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== PYDANTIC MODELS =====

class DemandForecastRequest(BaseModel):
    pharmacy_id: int
    drug_id: int
    horizon_days: int = 30
    history_days: int = 365

class DemandForecastResponse(BaseModel):
    pharmacy_id: int
    drug_id: int
    predictions: List[dict]
    model_info: dict

class SalesForecastRequest(BaseModel):
    pharmacy_id: int
    horizon_days: int = 30

class POSRecommendationRequest(BaseModel):
    pharmacy_id: int
    customer_id: Optional[int] = None
    basket_drug_ids: List[int] = []
    n_recommendations: int = 5

class POSRecommendationResponse(BaseModel):
    recommendations: List[dict]

class DrugEmbeddingRequest(BaseModel):
    drug_id: int
    name: str
    description: str = ""
    category: str = ""

class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"
    models_loaded: dict

# ===== DEPENDENCIES =====

def get_forecaster() -> DemandForecaster:
    if forecaster is None:
        raise HTTPException(503, "Forecaster not initialized")
    return forecaster

def get_recommender() -> RecommendationEngine:
    if recommender is None:
        raise HTTPException(503, "Recommender not initialized")
    return recommender

# ===== ENDPOINTS =====

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        models_loaded={
            "forecaster": forecaster is not None,
            "sales_forecaster": sales_forecaster is not None,
            "nlp": nlp is not None,
            "recommender": recommender is not None,
            "vector_db": vector_db is not None,
        }
    )

@app.post("/forecast/demand", response_model=DemandForecastResponse)
async def forecast_demand(
    request: DemandForecastRequest,
    background_tasks: BackgroundTasks,
    f: DemandForecaster = Depends(get_forecaster)
):
    """Forecast demand for a specific drug at a pharmacy."""
    try:
        result = await f.forecast(
            pharmacy_id=request.pharmacy_id,
            drug_id=request.drug_id,
            horizon_days=request.horizon_days,
            history_days=request.history_days
        )
        return DemandForecastResponse(**result)
    except Exception as e:
        logger.error(f"Forecast error: {e}")
        raise HTTPException(500, str(e))

@app.post("/forecast/sales")
async def forecast_sales(
    request: SalesForecastRequest,
    f: SalesForecaster = Depends(get_forecaster)
):
    """Forecast total sales for a pharmacy."""
    try:
        result = await f.forecast_total_sales(
            pharmacy_id=request.pharmacy_id,
            horizon_days=request.horizon_days
        )
        return result
    except Exception as e:
        logger.error(f"Sales forecast error: {e}")
        raise HTTPException(500, str(e))

@app.post("/recommend/pos", response_model=POSRecommendationResponse)
async def pos_recommendations(
    request: POSRecommendationRequest,
    rec: RecommendationEngine = Depends(get_recommender)
):
    """Get POS recommendations for current basket."""
    try:
        recs = await rec.get_recommendations(
            pharmacy_id=request.pharmacy_id,
            customer_id=request.customer_id,
            basket_drug_ids=request.basket_drug_ids,
            n=request.n_recommendations
        )
        return POSRecommendationResponse(recommendations=recs)
    except Exception as e:
        logger.error(f"Recommendation error: {e}")
        raise HTTPException(500, str(e))

@app.post("/embeddings/drug")
async def create_drug_embedding(request: DrugEmbeddingRequest):
    """Create and store embedding for a drug."""
    embedding = await nlp.get_embedding(f"{request.name} {request.description} {request.category}")
    await vector_db.upsert_drug(request.drug_id, embedding, request.name, request.description, request.category)
    return {"drug_id": request.drug_id, "dimension": len(embedding)}

@app.post("/embeddings/search")
async def search_similar_drugs(query: str, top_k: int = 10):
    """Find similar drugs by semantic search."""
    embedding = await nlp.get_embedding(query)
    results = await vector_db.search(embedding, top_k)
    return {"results": results}

@app.post("/train/forecast")
async def train_forecast_models(background_tasks: BackgroundTasks):
    """Trigger model retraining (runs in background)."""
    background_tasks.add_task(forecaster.train_all)
    return {"message": "Training started in background"}

@app.post("/train/recommendations")
async def train_recommendation_model(background_tasks: BackgroundTasks):
    background_tasks.add_task(recommender.train)
    return {"message": "Recommendation training started"}

if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)