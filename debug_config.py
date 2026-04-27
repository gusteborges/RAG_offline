from app.core.config import settings
import os

print("--- DIAGNÓSTICO DE CONFIGURAÇÃO ---")
print(f"Diretório atual: {os.getcwd()}")
print(f"Arquivo .env existe? {os.path.exists('.env')}")
print(f"POSTGRES_HOST: {settings.POSTGRES_HOST}")
print(f"URL Gerada: {settings.DATABASE_URL}")
print("-----------------------------------")
