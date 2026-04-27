from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.api.routes import auth, documents

# IMPORTANTE: Importar todos os modelos aqui para o SQLAlchemy registrá-los
from app.models.user import User
from app.models.document import Document
from app.models.chunk import DocumentChunk
from app.models.audio_book import AudioBook

app = FastAPI(title="SmartDocs API", version="0.1.0")

# Incluindo as rotas
app.include_router(auth.router)
app.include_router(documents.router)

@app.get("/test-db")
async def test_db(db: AsyncSession = Depends(get_db)):
    try:
        # Teste ORM real
        result = await db.execute(select(User))
        users = result.scalars().all()

        return {
            "status": "ok",
            "message": "Conexão e ORM funcionando",
            "users_count": len(users)
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
