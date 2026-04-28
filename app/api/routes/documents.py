from fastapi import APIRouter, Depends, UploadFile, File, status, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.document import DocumentResponse, DocumentDetailResponse
from app.repositories.document_repository import DocumentRepository
from app.services.document_service import DocumentService
from uuid import UUID
import os

router = APIRouter(prefix="/documents", tags=["documents"])

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc_repo = DocumentRepository(db)
    doc_service = DocumentService(doc_repo, db_session=db)
    
    return await doc_service.upload_document(file, current_user.id)

@router.get("/", response_model=List[DocumentResponse])
async def list_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc_repo = DocumentRepository(db)
    doc_service = DocumentService(doc_repo)
    
    return await doc_service.get_user_documents(current_user.id)

@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc_repo = DocumentRepository(db)
    doc_service = DocumentService(doc_repo)
    
    doc = await doc_service.get_document(document_id)
    if not doc or doc.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    
    return doc

@router.get("/{document_id}/file")
async def serve_document_file(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Serve the raw physical file for PDF viewer in the frontend."""
    doc_repo = DocumentRepository(db)
    doc_service = DocumentService(doc_repo)
    
    doc = await doc_service.get_document(document_id)
    if not doc or doc.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Arquivo físico não encontrado")
    
    media_type = "application/pdf" if doc.file_path.endswith(".pdf") else "text/plain"
    return FileResponse(path=doc.file_path, media_type=media_type, filename=doc.title)
