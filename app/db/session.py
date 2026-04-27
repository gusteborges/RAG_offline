from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

# Criando o motor Async para se conectar ao banco de dados PostgreSQL
engine = create_async_engine(
    settings.DATABASE_URL, 
    echo=settings.DEBUG
)

# Criando uma fábrica de sessões assíncronas
AsyncSessionLocal = async_sessionmaker(
    bind=engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

# Dependência para as rotas do FastAPI
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
