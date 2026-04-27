import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings
from app.models.base import Base
# Importar modelos para garantir que o metadata os conheça
from app.models.user import User
from app.models.document import Document

async def reset_db():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        print("Limpando banco de dados...")
        # Drop de todas as tabelas conhecidas pelo Base.metadata
        await conn.run_sync(Base.metadata.drop_all)
        
        # Opcional: Drop da tabela do alembic caso ela exista
        try:
            from sqlalchemy import text
            await conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
        except Exception:
            pass
            
    print("Banco de dados limpo com sucesso!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(reset_db())
