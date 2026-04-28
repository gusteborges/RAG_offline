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
from app.services.embedding_service import EmbeddingService

class DocumentService:
    def __init__(self, repository: DocumentRepository, db_session=None):
        self.repository = repository
        self.db_session = db_session # Adicionado para instanciar outros serviços
        self.embedding_service = EmbeddingService()
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
                print(f"Erro ao extrair PDF: {str(e)}")
                content = f"Erro ao extrair PDF: {str(e)}"

        try:
            # 1. Adicionar Documento Pai (sem commit ainda)
            new_doc = Document(
                title=file.filename,
                content=content,
                file_path=file_path,
                user_id=user_id
            )
            saved_doc = await self.repository.add(new_doc)

            # 2. Processar Chunks se houver conteúdo
            if content and self.db_session:
                chunk_repo = ChunkRepository(self.db_session)
                rag_service = RAGService(chunk_repo, self.embedding_service)
                # Passar commit=False para manter tudo na mesma transação
                await rag_service.process_document_chunks(content, saved_doc.id, commit=False)

            # 3. Commit final de TUDO
            if self.db_session:
                await self.db_session.commit()
            
            await self.repository.db.refresh(saved_doc)
            return saved_doc

        except Exception as e:
            if self.db_session:
                await self.db_session.rollback()
            print(f"ERRO CRÍTICO no upload/processamento: {str(e)}")
            # Se falhou tudo, talvez queiramos remover o arquivo físico
            if os.path.exists(file_path):
                os.remove(file_path)
            raise e

    async def get_user_documents(self, user_id: UUID):
        return await self.repository.get_by_user(user_id)

    async def get_document(self, doc_id: UUID):
        return await self.repository.get_by_id(doc_id)

    async def delete_document(self, doc_id: UUID, user_id: UUID):
        doc = await self.repository.get_by_id(doc_id)
        if not doc or doc.user_id != user_id:
            return False
        
        # 1. Remover arquivo físico
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)
            
        # 2. Remover do banco (os chunks e audios serão removidos pelo CASCADE do SQLAlchemy)
        await self.repository.delete(doc)
        return True
