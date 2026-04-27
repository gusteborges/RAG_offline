from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, List

class DocumentBase(BaseModel):
    title: str

class DocumentCreate(DocumentBase):
    content: Optional[str] = None
    file_path: str

class DocumentResponse(DocumentBase):
    id: UUID
    user_id: UUID
    file_path: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class DocumentDetailResponse(DocumentResponse):
    content: Optional[str] = None
    # Podemos adicionar listas de chunks ou áudios aqui depois
