from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.audio_book import AudioBook
from app.repositories.document_repository import DocumentRepository
from app.repositories.audio_book_repository import AudioBookRepository
from app.services.tts_service import TTSService
from uuid import UUID
import os

router = APIRouter(prefix="/audio", tags=["Audiobook"])

@router.post("/generate/{document_id}", status_code=status.HTTP_201_CREATED)
async def generate_audiobook(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc_repo = DocumentRepository(db)
    audio_repo = AudioBookRepository(db)
    tts_service = TTSService()

    # 1. Verificar se o documento existe e pertence ao usuário
    doc = await doc_repo.get_by_id(document_id)
    if not doc or doc.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Documento não encontrado")

    if not doc.content:
        raise HTTPException(status_code=400, detail="O documento não possui conteúdo de texto para converter em áudio")

    # 2. Gerar o áudio (usando o texto extraído do documento)
    try:
        # Nota: Para textos gigantes, poderíamos usar apenas o resumo ou partes.
        # Aqui, vamos usar o conteúdo completo (ou os primeiros 5000 chars por segurança)
        text_to_convert = doc.content[:5000] 
        audio_path = await tts_service.generate_audio(text_to_convert)
        
        # 3. Salvar registro no banco
        new_audio = AudioBook(
            file_path=audio_path,
            format="mp3",
            description=f"Audiobook de: {doc.title}",
            document_id=doc.id
        )
        await audio_repo.create(new_audio)
        
        return {
            "message": "Audiobook gerado com sucesso",
            "audio_id": new_audio.id,
            "file_path": audio_path
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar áudio: {str(e)}")

@router.get("/download/{audio_id}")
async def download_audio(
    audio_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    audio_repo = AudioBookRepository(db)
    audio = await audio_repo.get_by_id(audio_id)

    if not audio:
        raise HTTPException(status_code=404, detail="Áudio não encontrado")

    # Opcional: Verificar se o áudio pertence a um documento do usuário
    # (Pode ser adicionado um join aqui se quiser segurança extra)

    if not os.path.exists(audio.file_path):
        raise HTTPException(status_code=404, detail="Arquivo físico do áudio não encontrado no servidor")

    return FileResponse(
        path=audio.file_path, 
        media_type="audio/mpeg", 
        filename=os.path.basename(audio.file_path)
    )
