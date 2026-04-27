from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean
from app.models.base import Base, IDMixin, TimestampMixin

# Modelo de Usuário
class User(Base, IDMixin, TimestampMixin):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relacionamento: Um usuário possui muitos documentos
    # cascade="all, delete-orphan" deleta os documentos se o usuário for deletado
    documents: Mapped[list["Document"]] = relationship(
        "Document", 
        back_populates="owner", 
        cascade="all, delete-orphan"
    )
