from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.rag import SearchQuery, SearchResponse, ChatQuery, ChatResponse
from app.repositories.chunk_repository import ChunkRepository
from app.services.rag_service import RAGService
from app.services.embedding_service import EmbeddingService
from app.core.config import settings

router = APIRouter(prefix="/rag", tags=["RAG"])

# Inicializamos o EmbeddingService fora para carregar o modelo apenas uma vez
embedding_service = EmbeddingService()


@router.post("/search", response_model=SearchResponse)
async def semantic_search(
    query_in: SearchQuery,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    chunk_repo = ChunkRepository(db)
    rag_service = RAGService(chunk_repo, embedding_service)

    results = await rag_service.search(
        query_text=query_in.query,
        user_id=current_user.id,
        conversation_id=query_in.conversation_id,
        limit=query_in.limit,
    )

    return {"results": results}


@router.post("/chat", response_model=ChatResponse)
async def chat(
    query_in: ChatQuery,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Busca chunks relevantes e gera uma resposta via Ollama (LLM local).
    Fallback gracioso se o Ollama não estiver disponível.
    """
    chunk_repo = ChunkRepository(db)
    rag_service = RAGService(chunk_repo, embedding_service)

    try:
        # 1. Recuperação semântica
        results = await rag_service.search(
            query_text=query_in.message,
            user_id=current_user.id,
            conversation_id=query_in.conversation_id,
            limit=query_in.limit,
        )
    except Exception as e:
        print(f"DEBUG: Erro na busca semântica: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro na busca semântica: {str(e)}")

    if not results:
        return ChatResponse(
            answer="Não encontrei nenhum trecho relevante nos seus documentos para responder a essa pergunta.",
            sources=[],
            model_used="none",
        )

    # 2. Montar contexto
    context_parts = [
        f"[Trecho {i+1}]:\n{r['content']}" for i, r in enumerate(results)
    ]
    context = "\n\n".join(context_parts)

    prompt = (
        "Você é um assistente especializado em responder perguntas com base em documentos fornecidos.\n"
        "Responda em português de forma clara, objetiva e conversacional.\n"
        "Use APENAS as informações dos trechos abaixo. Se não souber, diga que não encontrou nos documentos.\n\n"
        f"--- CONTEXTO DOS DOCUMENTOS ---\n{context}\n--- FIM DO CONTEXTO ---\n\n"
        f"Pergunta do usuário: {query_in.message}\n\n"
        "Resposta:"
    )

    model_used = settings.OLLAMA_MODEL

    # 3. Chamar Ollama
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            resp = await client.post(
                f"{settings.OLLAMA_URL}/api/generate",
                json={
                    "model": model_used,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.3},
                },
            )
            if resp.status_code != 200:
                error_body = resp.text
                print(f"ERRO OLLAMA ({resp.status_code}): {error_body}")
                
            resp.raise_for_status()
            data = resp.json()
            answer = data.get("response", "").strip()

    except (httpx.ConnectError, httpx.TimeoutException):
        # Ollama offline ou lento demais → fallback com contexto formatado
        answer = (
            "⚠️ O modelo de linguagem (Ollama) está offline ou demorando muito para responder. "
            "Aqui estão os trechos mais relevantes encontrados nos seus documentos:\n\n"
            + "\n\n---\n\n".join(r["content"] for r in results)
        )
        model_used = "fallback"

    except Exception as exc:
        print(f"ERRO CRÍTICO OLLAMA: {type(exc).__name__} - {str(exc)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao chamar o Ollama: {str(exc)}",
        )

    return ChatResponse(answer=answer, sources=results, model_used=model_used)
