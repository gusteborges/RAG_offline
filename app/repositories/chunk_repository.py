from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.models.chunk import DocumentChunk
from typing import List, Tuple, Optional
from uuid import UUID

class ChunkRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_many(self, chunks: List[DocumentChunk], commit: bool = True) -> List[DocumentChunk]:
        self.db.add_all(chunks)
        if commit:
            await self.db.commit()
        else:
            await self.db.flush()
        return chunks

    async def search_similar_chunks(self, query_embedding: List[float], user_id: UUID, conversation_id: Optional[UUID] = None, limit: int = 5):
        """
        Busca os chunks mais similares filtrando pelo usuário dono do documento e, opcionalmente, pela conversa.
        """
        # Precisamos fazer um join com a tabela de documentos para garantir 
        # que o usuário só veja os seus próprios documentos.
        from app.models.document import Document
        
        query = (
            select(
                DocumentChunk,
                (1 - DocumentChunk.embedding.cosine_distance(query_embedding)).label("score")
            )
            .join(Document)
            .where(Document.user_id == user_id)
        )

        if conversation_id:
            query = query.where(Document.conversation_id == conversation_id)
            
        query = query.order_by(DocumentChunk.embedding.cosine_distance(query_embedding)).limit(limit)
        
        result = await self.db.execute(query)
        return result.all()
