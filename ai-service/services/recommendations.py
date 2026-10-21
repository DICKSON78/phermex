# ai-service/services/recommendations.py
import implicit
import numpy as np
import pandas as pd
import joblib
import logging
from pathlib import Path
from typing import List, Dict, Optional
import httpx

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class RecommendationEngine:
    def __init__(self, settings):
        self.settings = settings
        self.models_dir = Path(settings.MODEL_DIR)
        self.models_dir.mkdir(exist_ok=True)
        self.laravel_client = httpx.AsyncClient(timeout=30.0)
        self.model = None
        self.drug_ids = []
        self.user_ids = []
    
    def _get_model_path(self) -> Path:
        return self.models_dir / "recommendation_model.pkl"
    
    def load_model(self):
        path = self._get_model_path()
        if path.exists():
            data = joblib.load(path)
            self.model = data['model']
            self.drug_ids = data['drug_ids']
            self.user_ids = data['user_ids']
            logger.info(f"Loaded recommendation model: {len(self.drug_ids)} drugs, {len(self.user_ids)} users")
    
    def save_model(self):
        path = self._get_model_path()
        joblib.dump({
            'model': self.model,
            'drug_ids': self.drug_ids,
            'user_ids': self.user_ids
        }, path)
        logger.info(f"Saved recommendation model to {path}")
    
    async def fetch_interactions(self, pharmacy_id: int) -> pd.DataFrame:
        try:
            response = await self.laravel_client.get(
                f"/ai/interactions",
                params={"pharmacy_id": pharmacy_id, "days": 180}
            )
            response.raise_for_status()
            return pd.DataFrame(response.json())
        except Exception as e:
            logger.error(f"Failed to fetch interactions: {e}")
            return pd.DataFrame()
    
    async def train(self, pharmacy_id: int = None):
        logger.info("Training recommendation model...")
        
        df = await self.fetch_interactions(pharmacy_id)
        
        if df.empty or len(df) < 50:
            logger.warning("Insufficient interaction data for training")
            return
        
        user_ids = df['user_id'].unique()
        drug_ids = df['drug_id'].unique()
        
        self.user_ids = user_ids.tolist()
        self.drug_ids = drug_ids.tolist()
        
        user_to_idx = {uid: i for i, uid in enumerate(self.user_ids)}
        drug_to_idx = {did: i for i, did in enumerate(self.drug_ids)}
        
        n_users = len(self.user_ids)
        n_items = len(self.drug_ids)
        
        from scipy.sparse import csr_matrix
        
        rows = df['user_id'].map(user_to_idx).values
        cols = df['drug_id'].map(drug_to_idx).values
        data = np.minimum(df['quantity'].values, 10).astype(np.float32)
        
        user_item_matrix = csr_matrix((data, (rows, cols)), shape=(n_users, n_items))
        
        self.model = implicit.als.AlternatingLeastSquares(
            factors=64,
            regularization=0.01,
            iterations=20,
            alpha=1.0
        )
        
        self.model.fit(user_item_matrix.T)
        
        self.save_model()
        logger.info("Recommendation model trained and saved")
    
    async def get_recommendations(
        self,
        pharmacy_id: int,
        customer_id: Optional[int] = None,
        basket_drug_ids: List[int] = [],
        n_recommendations: int = 5
    ) -> List[Dict]:
        
        if self.model is None:
            await self.train()
        
        if self.model is None:
            return await self._get_popular_fallback(n_recommendations)
        
        recommendations = []
        
        if customer_id and customer_id in self.user_ids:
            user_idx = self.user_ids.index(customer_id)
            user_items = self.model.user_factors[user_idx]
            
            scores = user_items @ self.model.item_factors.T
            
            basket_indices = [self.drug_ids.index(d) for d in basket_drug_ids if d in self.drug_ids]
            scores[basket_indices] = -np.inf
            
            top_indices = np.argpartition(scores, -n_recommendations)[-n_recommendations:]
            top_indices = top_indices[np.argsort(scores[top_indices])[::-1]]
            
            for idx in top_indices:
                if idx < len(self.drug_ids):
                    drug_id = self.drug_ids[idx]
                    recommendations.append({
                        "drug_id": drug_id,
                        "score": float(scores[idx]),
                        "reason": "collaborative_filtering"
                    })
        
        seen = set()
        final = []
        for r in recommendations:
            if r['drug_id'] not in seen:
                seen.add(r['drug_id'])
                final.append(r)
                if len(final) >= n_recommendations:
                    break
        
        return await self._enrich_recommendations(final)
    
    async def _get_popular_fallback(self, n: int) -> List[Dict]:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.settings.LARAVEL_API_URL}/ai/top-selling",
                    params={"limit": n}
                )
                response.raise_for_status()
                return response.json()
        except:
            return []
    
    async def _enrich_recommendations(self, recs: List[Dict]) -> List[Dict]:
        if not recs:
            return []
        
        drug_ids = [r['drug_id'] for r in recs]
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.settings.LARAVEL_API_URL}/ai/drugs/batch",
                    json={"drug_ids": drug_ids}
                )
                response.raise_for_status()
                drug_details = {d['id']: d for d in response.json()}
                
                for r in recs:
                    if r['drug_id'] in drug_details:
                        d = drug_details[r['drug_id']]
                        r['name'] = d.get('name', 'Unknown')
                        r['price'] = d.get('price', 0)
                        r['category'] = d.get('category', '')
                return recs
        except:
            return recs