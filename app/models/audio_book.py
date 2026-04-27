from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, IDMixin, TimestampMixin

class AudioBook(Base, IDMixin, TimestampMixin):
    __tablename__ = "audio_books"

    file_path: Mapped[str] = mapped_column(String(511), nullable=False)
    format: Mapped[str] = mapped_column(String(10), default="mp3")
    
    # Qual texto originou este áudio (pode ser o documento todo ou um resumo)
    description: Mapped[str] = mapped_column(Text, nullable=True)

    # Relacionamento
    document_id: Mapped[UUID] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
