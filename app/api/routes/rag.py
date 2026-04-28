from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.rag import SearchQuery, SearchResponse
from app.repositories.chunk_repository import ChunkRepository
from app.services.rag_service import RAGService
from app.services.embedding_service import EmbeddingService

router = APIRouter(prefix="/rag", tags=["RAG"])

# Inicializamos o EmbeddingService fora para carregar o modelo apenas uma vez
embedding_service = EmbeddingService()

@router.post("/search", response_model=SearchResponse)
async def semantic_search(
    query_in: SearchQuery,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chunk_repo = ChunkRepository(db)
    rag_service = RAGService(chunk_repo, embedding_service)
    
    results = await rag_service.search(
        query_text=query_in.query,
        user_id=current_user.id,
        limit=query_in.limit
    )
    
    return {"results": results}
