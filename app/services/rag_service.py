from typing import List, Optional
from uuid import UUID
from app.models.chunk import DocumentChunk
from app.repositories.chunk_repository import ChunkRepository
from app.services.embedding_service import EmbeddingService

class RAGService:
    def __init__(self, chunk_repository: ChunkRepository, embedding_service: EmbeddingService):
        self.chunk_repository = chunk_repository
        self.embedding_service = embedding_service

    async def process_document_chunks(self, text: str, document_id: UUID, chunk_size: int = 500, overlap: int = 50, commit: bool = True):
        """
        Divide o texto e gera embeddings para cada pedaço.
        """
        chunks_content = []
        start = 0
        text_length = len(text)

        while start < text_length:
            end = start + chunk_size
            chunks_content.append(text[start:end])
            start += (chunk_size - overlap)

        embeddings = self.embedding_service.generate_embeddings_batch(chunks_content)

        chunks_to_create = []
        for i, content in enumerate(chunks_content):
            chunk = DocumentChunk(
                content=content,
                index=i,
                document_id=document_id,
                embedding=embeddings[i]
            )
            chunks_to_create.append(chunk)

        if chunks_to_create:
            await self.chunk_repository.create_many(chunks_to_create, commit=commit)
        
        return len(chunks_to_create)

    async def search(self, query_text: str, user_id: UUID, conversation_id: Optional[UUID] = None, limit: int = 5):
        """
        Busca semântica: pergunta -> vetor -> busca similaridade.
        """
        query_embedding = self.embedding_service.generate_embedding(query_text)

        similar_chunks = await self.chunk_repository.search_similar_chunks(
            query_embedding=query_embedding,
            user_id=user_id,
            conversation_id=conversation_id,
            limit=limit
        )

        results = []
        for row in similar_chunks:
            chunk, score = row
            results.append({
                "content": chunk.content,
                "document_id": chunk.document_id,
                "index": chunk.index,
                "score": float(score)
            })
        
        return results
