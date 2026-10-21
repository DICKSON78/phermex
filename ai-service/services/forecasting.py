# ai-service/services/forecasting.py
import pandas as pd
import numpy as np
from prophet import Prophet
import joblib
import logging
from datetime import date, timedelta
from pathlib import Path
from typing import List, Dict, Optional
import httpx

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class BaseForecaster:
    def __init__(self, settings):
        self.settings = settings
        self.models_dir = Path(settings.MODEL_DIR)
        self.models_dir.mkdir(exist_ok=True)
        self.laravel_client = httpx.AsyncClient(
            base_url=settings.LARAVEL_API_URL,
            timeout=30.0,
            headers={"Authorization": f"Bearer {settings.LARAVEL_API_TOKEN}"} if settings.LARAVEL_API_TOKEN else {}
        )
    
    def _get_model_path(self, name: str) -> Path:
        return self.models_dir / f"{name}.pkl"
    
    def save_model(self, model, name: str):
        path = self._get_model_path(name)
        joblib.dump(model, path)
        logger.info(f"Saved model: {path}")
    
    def load_model(self, name: str) -> Optional[Prophet]:
        path = self._get_model_path(name)
        if path.exists():
            return joblib.load(path)
        return None


class DemandForecaster(BaseForecaster):
    """Forecast demand for individual drugs."""
    
    def __init__(self, settings):
        super().__init__(settings)
        self.models: Dict[str, Prophet] = {}
    
    def load_models(self):
        """Load any pre-trained models."""
        pass
    
    async def fetch_sales_history(
        self, 
        pharmacy_id: int, 
        drug_id: int, 
        days: int = 365
    ) -> pd.DataFrame:
        """Fetch sales history from Laravel API."""
        try:
            end_date = date.today()
            start_date = date.today() - timedelta(days=days)
            
            response = await self.laravel_client.get(
                f"/ai/sales-history",
                params={
                    "pharmacy_id": pharmacy_id,
                    "drug_id": drug_id,
                    "start_date": start_date.isoformat(),
                    "end_date": date.today().isoformat(),
                }
            )
            response.raise_for_status()
            data = response.json()
            
            df = pd.DataFrame(data)
            if df.empty:
                return pd.DataFrame(columns=['ds', 'y'])
            
            df['ds'] = pd.to_datetime(df['date'])
            df['y'] = df['quantity'].astype(float)
            return df[['ds', 'y']].sort_values('ds')
        except Exception as e:
            logger.error(f"Failed to fetch sales history: {e}")
            return pd.DataFrame(columns=['ds', 'y'])
    
    async def forecast(
        self,
        pharmacy_id: int,
        drug_id: int,
        horizon_days: int = 30,
        history_days: int = 365
    ) -> Dict:
        """Generate demand forecast for a drug."""
        
        df = await self.fetch_sales_history(pharmacy_id, drug_id, history_days)
        
        if len(df) < 7:
            return self._simple_forecast(df, horizon_days)
        
        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            seasonality_mode='multiplicative',
            changepoint_prior_scale=0.05,
            interval_width=0.8
        )
        
        model.fit(df)
        
        future = model.make_future_dataframe(periods=horizon_days)
        forecast = model.predict(future)
        
        future_forecast = forecast.tail(horizon_days)[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
        future_forecast = future_forecast.copy()
        future_forecast['ds'] = future_forecast['ds'].dt.strftime('%Y-%m-%d')
        future_forecast['yhat'] = future_forecast['yhat'].clip(lower=0).round(2)
        future_forecast['yhat_lower'] = future_forecast['yhat_lower'].clip(lower=0).round(2)
        future_forecast['yhat_upper'] = future_forecast['yhat_upper'].clip(lower=0).round(2)
        
        return {
            "pharmacy_id": pharmacy_id,
            "drug_id": drug_id,
            "predictions": future_forecast.to_dict('records'),
            "model_info": {
                "type": "prophet",
                "history_points": len(df),
                "horizon_days": horizon_days
            }
        }
    
    def _simple_forecast(self, df: pd.DataFrame, horizon_days: int) -> Dict:
        """Fallback: simple moving average when data is sparse."""
        if df.empty:
            avg = 0
        else:
            avg = df['y'].tail(7).mean()
        
        predictions = []
        for i in range(horizon_days):
            d = date.today() + timedelta(days=i+1)
            predictions.append({
                "ds": d.isoformat(),
                "yhat": round(max(0, avg), 2),
                "yhat_lower": round(max(0, avg * 0.7), 2),
                "yhat_upper": round(avg * 1.3, 2)
            })
        
        return {
            "predictions": predictions,
            "model_info": {"type": "moving_average", "avg_daily": round(avg, 2)}
        }
    
    async def train_all(self):
        logger.info("Starting full demand forecast training...")


class SalesForecaster(BaseForecaster):
    """Forecast total pharmacy sales."""
    
    async def forecast_total_sales(
        self,
        pharmacy_id: int,
        horizon_days: int = 30
    ) -> Dict:
        try:
            response = await self.laravel_client.get(
                f"/ai/sales-history/total",
                params={"pharmacy_id": pharmacy_id, "days": 365}
            )
            response.raise_for_status()
            data = response.json()
            
            df = pd.DataFrame(data)
            if df.empty or len(df) < 14:
                return {"predictions": [], "model_info": {"type": "insufficient_data"}}
            
            df['ds'] = pd.to_datetime(df['date'])
            df['y'] = df['total'].astype(float)
            
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                seasonality_mode='multiplicative'
            )
            model.fit(df[['ds', 'y']])
            
            future = model.make_future_dataframe(periods=30)
            forecast = model.predict(future)
            
            future_fc = forecast.tail(30)[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].copy()
            future_fc['ds'] = future_fc['ds'].dt.strftime('%Y-%m-%d')
            future_fc['yhat'] = future_fc['yhat'].clip(lower=0).round(2)
            
            return {
                "pharmacy_id": pharmacy_id,
                "predictions": future_fc.to_dict('records'),
                "model_info": {"type": "prophet", "history_days": len(df)}
            }
        except Exception as e:
            logger.error(f"Sales forecast error: {e}")
            return {"predictions": [], "model_info": {"error": str(e)}}