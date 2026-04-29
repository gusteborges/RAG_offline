from uuid import UUID
from typing import List, Optional
from app.repositories.conversation_repository import ConversationRepository
from app.models.conversation import Conversation
from app.models.message import Message

class ConversationService:
    def __init__(self, conversation_repository: ConversationRepository):
        self.conversation_repository = conversation_repository

    async def create_conversation(self, user_id: UUID, title: str = "Nova Conversa") -> Conversation:
        return await self.conversation_repository.create(user_id, title)

    async def get_user_conversations(self, user_id: UUID) -> List[Conversation]:
        return await self.conversation_repository.get_user_conversations(user_id)

    async def get_conversation_messages(self, conversation_id: UUID) -> List[Message]:
        return await self.conversation_repository.get_messages(conversation_id)

    async def add_message(self, conversation_id: UUID, role: str, content: str, sources: Optional[List] = None, model_used: Optional[str] = None) -> Message:
        return await self.conversation_repository.add_message(conversation_id, role, content, sources, model_used)

    async def update_title(self, conversation_id: UUID, title: str) -> Optional[Conversation]:
        return await self.conversation_repository.update_title(conversation_id, title)

    async def delete_conversation(self, conversation_id: UUID) -> bool:
        return await self.conversation_repository.delete(conversation_id)
