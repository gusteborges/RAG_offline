from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID

class SearchQuery(BaseModel):
    query: str
    conversation_id: Optional[UUID] = None
    limit: Optional[int] = 5

class SearchResult(BaseModel):
    content: str
    document_id: UUID
    index: int
    score: float

class SearchResponse(BaseModel):
    results: List[SearchResult]

class ChatQuery(BaseModel):
    message: str
    conversation_id: Optional[UUID] = None
    limit: Optional[int] = 5

class ChatResponse(BaseModel):
    answer: str
    sources: List[SearchResult]
    model_used: str
