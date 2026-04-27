from sqlalchemy.ext.asyncio import AsyncSession
from app.models.chunk import DocumentChunk
from typing import List

class ChunkRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_many(self, chunks: List[DocumentChunk]) -> List[DocumentChunk]:
        self.db.add_all(chunks)
        await self.db.commit()
        return chunks
