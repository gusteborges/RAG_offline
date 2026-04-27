from fastapi import HTTPException, status
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate
from app.models.user import User
from app.core.security import get_password_hash

class UserService:
    def __init__(self, user_repository: UserRepository):
        """
        Injeção de dependência do repositório. 
        Isso facilita testes unitários e mantém o desacoplamento.
        """
        self.user_repository = user_repository
    
    async def create_user(self, user_create: UserCreate) -> User:
        # 1. Verificar se o e-mail já existe (Regra de Negócio)
        existing_user = await self.user_repository.get_user_by_email(user_create.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Email já registrado"
            )
        
        # 2. Gerar o hash seguro da senha usando Argon2
        hashed_password = get_password_hash(user_create.password)
        
        # 3. Mapear o Schema (Entrada) para o Model (Banco)
        new_user = User(
            email=user_create.email,
            username=user_create.username,  # Corrigido para minúsculo
            hashed_password=hashed_password # Conforme definido no seu Model
        )
        
        # 4. Persistir no banco de dados via Repositório
        return await self.user_repository.create_user(new_user)
