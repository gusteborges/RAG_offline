from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector # <--- O segredo para buscas de IA
from app.models.base import Base, IDMixin, TimestampMixin

class DocumentChunk(Base, IDMixin, TimestampMixin):
    __tablename__ = "document_chunks"

    content: Mapped[str] = mapped_column(Text, nullable=False)
    index: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # O modelo 'paraphrase-multilingual-MiniLM-L12-v2' gera vetores de 384 dimensões.
    # Precisamos especificar esse tamanho exato para o banco se organizar.
    embedding: Mapped[list[float]] = mapped_column(Vector(384), nullable=True)
    
    document_id: Mapped[UUID] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
