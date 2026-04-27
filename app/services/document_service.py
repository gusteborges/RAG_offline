import os
import shutil
from uuid import UUID, uuid4
from fastapi import UploadFile
from pypdf import PdfReader
from app.models.document import Document
from app.repositories.document_repository import DocumentRepository
from app.core.config import settings

from app.repositories.chunk_repository import ChunkRepository
from app.services.rag_service import RAGService

class DocumentService:
    def __init__(self, repository: DocumentRepository, db_session=None):
        self.repository = repository
        self.db_session = db_session # Adicionado para instanciar outros serviços
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    async def upload_document(self, file: UploadFile, user_id: UUID) -> Document:
        file_ext = os.path.splitext(file.filename)[1].lower()
        unique_filename = f"{uuid4()}{file_ext}"
        file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        content = ""
        
        if file_ext == ".txt":
            file.file.seek(0)
            content = (await file.read()).decode("utf-8")
        elif file_ext == ".pdf":
            try:
                reader = PdfReader(file_path)
                text_parts = [page.extract_text() for page in reader.pages if page.extract_text()]
                content = "\n".join(text_parts)
            except Exception as e:
                content = f"Erro ao extrair PDF: {str(e)}"

        # 1. Salvar Documento Pai
        new_doc = Document(
            title=file.filename,
            content=content,
            file_path=file_path,
            user_id=user_id
        )
        saved_doc = await self.repository.create(new_doc)

        # 2. Processar Chunks se houver conteúdo
        if content and self.db_session:
            chunk_repo = ChunkRepository(self.db_session)
            rag_service = RAGService(chunk_repo)
            await rag_service.process_document_chunks(content, saved_doc.id)

        return saved_doc

    async def get_user_documents(self, user_id: UUID):
        return await self.repository.get_by_user(user_id)

    async def get_document(self, doc_id: UUID):
        return await self.repository.get_by_id(doc_id)
