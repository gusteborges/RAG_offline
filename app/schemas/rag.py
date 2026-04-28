from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID

class SearchQuery(BaseModel):
    query: str
    limit: Optional[int] = 5 # Quantos trechos retornar

class SearchResult(BaseModel):
    content: str
    document_id: UUID
    index: int
    score: float # Quão parecida é a resposta (0 a 1)

class SearchResponse(BaseModel):
    results: List[SearchResult]
