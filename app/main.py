from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.db.session import get_db, init_db
from app.api.routes import auth, documents, rag, audio, conversations

# IMPORTANTE: Importar todos os modelos aqui para o SQLAlchemy registrá-los
from app.models import Base

app = FastAPI(title="SmartDocs API", version="0.1.0")

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    await init_db()

# Incluindo as rotas
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(rag.router)
app.include_router(audio.router)
app.include_router(conversations.router)

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
