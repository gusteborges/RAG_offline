from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.conversation import (
    ConversationRead, ConversationCreate, ConversationUpdate, 
    ConversationWithMessages, MessageRead, MessageCreate
)
from app.repositories.conversation_repository import ConversationRepository
from app.services.conversation_service import ConversationService

router = APIRouter(prefix="/conversations", tags=["Conversations"])

def get_conversation_service(db: AsyncSession = Depends(get_db)) -> ConversationService:
    repo = ConversationRepository(db)
    return ConversationService(repo)

@router.get("/", response_model=List[ConversationRead])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    service: ConversationService = Depends(get_conversation_service),
):
    return await service.get_user_conversations(current_user.id)

@router.post("/", response_model=ConversationRead, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    conv_in: ConversationCreate,
    current_user: User = Depends(get_current_user),
    service: ConversationService = Depends(get_conversation_service),
):
    return await service.create_conversation(current_user.id, conv_in.title)

@router.get("/{conversation_id}", response_model=ConversationWithMessages)
async def get_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    service: ConversationService = Depends(get_conversation_service),
):
    # Simplificação: assume que a conversa pertence ao usuário (poderia ter check explícito)
    messages = await service.get_conversation_messages(conversation_id)
    # Precisamos da própria conversa para o model de retorno
    # Aqui vou buscar a conversa tb
    repo = service.conversation_repository
    conv = await repo.get_by_id(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")
    if conv.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    return {
        "id": conv.id,
        "title": conv.title,
        "user_id": conv.user_id,
        "created_at": conv.created_at,
        "updated_at": conv.updated_at,
        "messages": messages
    }

@router.patch("/{conversation_id}", response_model=ConversationRead)
async def update_conversation(
    conversation_id: UUID,
    conv_in: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    service: ConversationService = Depends(get_conversation_service),
):
    return await service.update_title(conversation_id, conv_in.title)

@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    service: ConversationService = Depends(get_conversation_service),
):
    await service.delete_conversation(conversation_id)
    return {"message": "Conversa deletada"}

@router.post("/{conversation_id}/messages", response_model=MessageRead)
async def add_message(
    conversation_id: UUID,
    msg_in: MessageCreate,
    current_user: User = Depends(get_current_user),
    service: ConversationService = Depends(get_conversation_service),
):
    return await service.add_message(
        conversation_id, 
        msg_in.role, 
        msg_in.content,
        sources=msg_in.sources,
        model_used=msg_in.model_used
    )
