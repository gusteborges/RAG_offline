from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, IDMixin, TimestampMixin

class DocumentChunk(Base, IDMixin, TimestampMixin):
    __tablename__ = "document_chunks"

    content: Mapped[str] = mapped_column(Text, nullable=False)
    index: Mapped[int] = mapped_column(Integer, nullable=False) # Ordem do chunk no documento
    
    # Relacionamento com o Documento
    document_id: Mapped[UUID] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    
    # Opcional: Aqui poderíamos ter a coluna de embedding se usarmos pgvector direto, 
    # ou uma relação para uma tabela de embeddings. Para simplificar o MVP:
    # embedding = mapped_column(Vector(1536)) # Se usar pgvector
