from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from app.models.conversation import Conversation
from app.models.message import Message
from typing import List, Optional
from uuid import UUID

class ConversationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_id: UUID, title: str = "Nova Conversa") -> Conversation:
        conversation = Conversation(user_id=user_id, title=title)
        self.db.add(conversation)
        await self.db.commit()
        await self.db.refresh(conversation)
        return conversation

    async def get_by_id(self, conversation_id: UUID) -> Optional[Conversation]:
        query = select(Conversation).where(Conversation.id == conversation_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_user_conversations(self, user_id: UUID) -> List[Conversation]:
        query = (
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update_title(self, conversation_id: UUID, title: str) -> Optional[Conversation]:
        query = (
            update(Conversation)
            .where(Conversation.id == conversation_id)
            .values(title=title)
            .returning(Conversation)
        )
        result = await self.db.execute(query)
        await self.db.commit()
        return result.scalar_one_or_none()

    async def delete(self, conversation_id: UUID) -> bool:
        query = delete(Conversation).where(Conversation.id == conversation_id)
        await self.db.execute(query)
        await self.db.commit()
        return True

    async def add_message(self, conversation_id: UUID, role: str, content: str, sources: Optional[List] = None, model_used: Optional[str] = None) -> Message:
        message = Message(
            conversation_id=conversation_id, 
            role=role, 
            content=content,
            sources=sources,
            model_used=model_used
        )
        self.db.add(message)
        # Atualiza o updated_at da conversa
        await self.db.execute(
            update(Conversation)
            .where(Conversation.id == conversation_id)
            .values(updated_at=func.now())
        )
        await self.db.commit()
        await self.db.refresh(message)
        return message

    async def get_messages(self, conversation_id: UUID) -> List[Message]:
        query = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())
