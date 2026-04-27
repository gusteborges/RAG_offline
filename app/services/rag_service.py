from typing import List
from uuid import UUID
from app.models.chunk import DocumentChunk
from app.repositories.chunk_repository import ChunkRepository

class RAGService:
    def __init__(self, chunk_repository: ChunkRepository):
        self.chunk_repository = chunk_repository

    async def process_document_chunks(self, text: str, document_id: UUID, chunk_size: int = 500, overlap: int = 50):
        """
        Algoritmo de Chunking Manual:
        1. Percorre o texto em saltos (step)
        2. Extrai fatias (slices) do tamanho definido
        3. Garante que haja uma sobreposição para manter o contexto
        """
        chunks_to_create = []
        text_length = len(text)
        start = 0
        index = 0

        while start < text_length:
            # Define o fim da fatia
            end = start + chunk_size
            
            # Extrai o pedaço do texto
            content = text[start:end]
            
            # Cria o objeto do modelo
            chunk = DocumentChunk(
                content=content,
                index=index,
                document_id=document_id
            )
            chunks_to_create.append(chunk)
            
            # O próximo ponto de início recua o valor do overlap
            # para garantir que o final deste pedaço esteja no início do próximo
            start += (chunk_size - overlap)
            index += 1

        if chunks_to_create:
            await self.chunk_repository.create_many(chunks_to_create)
        
        return len(chunks_to_create)
