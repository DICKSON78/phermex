# ai-service/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Phermex AI Service"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database - MySQL (uses existing Laravel .env)
    DATABASE_URL: str = "mysql+pymysql://user:password@localhost:3306/phermex"

    # Vector Store - ChromaDB (FREE, runs in Docker)
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8001
    CHROMA_COLLECTION: str = "drug_embeddings"

    # Laravel Backend
    LARAVEL_API_URL: str = "http://localhost:8000/api"
    LARAVEL_API_TOKEN: str = ""

    # Redis (for Celery queue)
    REDIS_URL: str = "redis://localhost:6379/0"

    # Models
    MODEL_DIR: str = "./models"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"

    # Forecasting
    FORECAST_HORIZON_DAYS: int = 30
    MIN_HISTORY_DAYS: int = 90

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()