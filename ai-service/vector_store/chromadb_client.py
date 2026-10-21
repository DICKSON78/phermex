# ai-service/vector_store/chromadb_client.py
import logging
from typing import List, Dict, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class ChromaDBClient:
    def __init__(self):
        self.settings = settings
        self.client: chromadb.ClientAPI = None
        self.collection = None
    
    async def connect(self):
        try:
            self.client = chromadb.HttpClient(
                host=settings.CHROMA_HOST,
                port=settings.CHROMA_PORT,
                settings=ChromaSettings(
                    anonymized_telemetry=False
                )
            )
            
            self.collection = self.client.get_or_create_collection(
                name=settings.CHROMA_COLLECTION,
                metadata={"hnsw:space": "cosine"}
            )
            
            logger.info(f"✅ Connected to ChromaDB at {settings.CHROMA_HOST}:{settings.CHROMA_PORT}")
            logger.info(f"Collection: {settings.CHROMA_COLLECTION} ({self.collection.count()} items)")
            
        except Exception as e:
            logger.error(f"Failed to connect to ChromaDB: {e}")
            raise
    
    async def upsert_drug(self, drug_id: int, embedding: List[float], name: str, 
                          description: str = "", category: str = ""):
        if not self.collection:
            await self.connect()
        
        self.collection.upsert(
            ids=[str(drug_id)],
            embeddings=[embedding],
            metadatas=[{
                "name": name,
                "description": description,
                "category": category,
            }],
            documents=[f"{name} {description} {category}"]
        )
        logger.debug(f"Upserted drug embedding: {drug_id}")
    
    async def upsert_batch(self, drugs: List[Dict]):
        if not self.collection:
            await self.connect()
        
        ids = [str(d['drug_id']) for d in drugs]
        embeddings = [d['embedding'] for d in drugs]
        metadatas = [{
            "name": d.get('name', ''),
            "description": d.get('description', ''),
            "category": d.get('category', ''),
        } for d in drugs]
        documents = [f"{d.get('name', '')} {d.get('description', '')} {d.get('category', '')}" for d in drugs]
        
        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents
        )
        logger.info(f"Batch upserted {len(drugs)} drug embeddings")
    
    async def search(self, query_embedding: List[float], top_k: int = 10, 
                     min_similarity: float = 0.3) -> List[Dict]:
        if not self.collection:
            await self.connect()
        
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=['metadatas', 'distances', 'documents']
        )
        
        results_list = []
        if results['ids'] and results['ids'][0]:
            for i, drug_id in enumerate(results['ids'][0]):
                distance = results['distances'][0][i]
                similarity = 1 - distance
                
                if similarity >= (1 - min_similarity):
                    meta = results['metadatas'][0][i]
                    results_list.append({
                        "drug_id": int(drug_id),
                        "name": meta.get('name', ''),
                        "description": meta.get('description', ''),
                        "category": meta.get('category', ''),
                        "similarity": round(similarity, 4)
                    })
        
        return results_list
    
    async def get_embedding(self, drug_id: int) -> Optional[List[float]]:
        if not self.collection:
            await self.connect()
        
        results = self.collection.get(ids=[str(drug_id)], include=['embeddings'])
        if results['embeddings'] and results['embeddings'][0]:
            return results['embeddings'][0]
        return None
    
    async def delete_drug(self, drug_id: int):
        if not self.collection:
            await self.connect()
        self.collection.delete(ids=[str(drug_id)])
    
    async def get_count(self) -> int:
        if not self.collection:
            await self.connect()
        return self.collection.count()