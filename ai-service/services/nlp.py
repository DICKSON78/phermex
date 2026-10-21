# ai-service/services/nlp.py
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline
import torch
import logging
from typing import List, Dict
from functools import lru_cache

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class MedicalNLP:
    def __init__(self, settings):
        self.settings = settings
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self._embedding_model = None
        self._ner_pipeline = None
    
    @property
    def embedding_model(self) -> SentenceTransformer:
        if self._embedding_model is None:
            logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
            self._embedding_model = SentenceTransformer(
                settings.EMBEDDING_MODEL,
                device=self.device
            )
        return self._embedding_model
    
    @property
    def ner_pipeline(self):
        """Lazy load medical NER pipeline."""
        if self._ner_pipeline is None:
            logger.info("Loading medical NER model...")
            try:
                model_name = "d4data/biomedical-ner-all"
                tokenizer = AutoTokenizer.from_pretrained(model_name)
                model = AutoModelForTokenClassification.from_pretrained(model_name)
                self._ner_pipeline = pipeline(
                    "ner",
                    model=model,
                    tokenizer=tokenizer,
                    aggregation_strategy="simple",
                    device=0 if self.device == "cuda" else -1
                )
            except Exception as e:
                logger.warning(f"Could not load NER model: {e}")
                self._ner_pipeline = None
        return self._ner_pipeline
    
    def get_embedding(self, text: str) -> List[float]:
        """Get embedding for text."""
        if not text.strip():
            return [0.0] * 384
        embedding = self.embedding_model.encode(text, normalize_embeddings=True)
        return embedding.tolist()
    
    async def get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        embeddings = self.embedding_model.encode(texts, normalize_embeddings=True)
        return embeddings.tolist()
    
    async def extract_entities(self, text: str) -> List[Dict]:
        """Extract medical entities from text using biomedical NER."""
        if not self.ner_pipeline:
            return []
        
        try:
            entities = self.ner_pipeline(text)
            relevant = []
            for ent in entities:
                if ent['entity_group'] in ['DRUG', 'CHEMICAL', 'DOSAGE', 'ROUTE', 'FREQUENCY', 'DURATION', 'STRENGTH']:
                    relevant.append({
                        "text": ent['word'],
                        "label": ent['entity_group'],
                        "confidence": round(ent['score'], 3),
                        "start": ent['start'],
                        "end": ent['end']
                    })
            return relevant
        except Exception as e:
            logger.error(f"NER extraction error: {e}")
            return []