from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, IDMixin, TimestampMixin

# Modelo de Documento
class Document(Base, IDMixin, TimestampMixin):
    __tablename__ = "documents"

    title: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=True) # Texto extraído para busca inteligente
    file_path: Mapped[str] = mapped_column(String(511), nullable=False) # Caminho no storage/disco
    
    # Chave estrangeira
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Relacionamentos
    owner: Mapped["User"] = relationship("User", back_populates="documents")
    chunks: Mapped[list["DocumentChunk"]] = relationship("DocumentChunk", backref="document", cascade="all, delete-orphan")
    audio_books: Mapped[list["AudioBook"]] = relationship("AudioBook", backref="document", cascade="all, delete-orphan")
