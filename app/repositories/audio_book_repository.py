from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.audio_book import AudioBook
from uuid import UUID
from typing import List, Optional

class AudioBookRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, audio_book: AudioBook) -> AudioBook:
        self.db.add(audio_book)
        await self.db.commit()
        await self.db.refresh(audio_book)
        return audio_book

    async def get_by_document(self, document_id: UUID) -> List[AudioBook]:
        result = await self.db.execute(
            select(AudioBook).where(AudioBook.document_id == document_id)
        )
        return result.scalars().all()

    async def get_by_id(self, audio_id: UUID) -> Optional[AudioBook]:
        result = await self.db.execute(
            select(AudioBook).where(AudioBook.id == audio_id)
        )
        return result.scalars().first()
