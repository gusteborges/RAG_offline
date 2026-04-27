from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.document import Document
from uuid import UUID
from typing import List, Optional

class DocumentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, document: Document) -> Document:
        self.db.add(document)
        await self.db.commit()
        await self.db.refresh(document)
        return document

    async def get_by_id(self, doc_id: UUID) -> Optional[Document]:
        result = await self.db.execute(select(Document).where(Document.id == doc_id))
        return result.scalars().first()

    async def get_by_user(self, user_id: UUID) -> List[Document]:
        result = await self.db.execute(select(Document).where(Document.user_id == user_id))
        return result.scalars().all()

    async def delete(self, document: Document) -> None:
        await self.db.delete(document)
        await self.db.commit()
