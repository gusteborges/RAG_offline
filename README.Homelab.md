# 🚀 Guia de Deploy no Homelab

Este projeto está pronto para rodar via Docker Compose.

## 1. Configuração do Arquivo .env
Antes de subir, garanta que seu arquivo `.env` tenha estas configurações:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua_senha_aqui
POSTGRES_DB=smartdocs
POSTGRES_HOST=postgres_db
POSTGRES_PORT=5432

SECRET_KEY=uma_chave_aleatoria_e_longa
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=600

# Se o Ollama estiver na mesma máquina do Homelab:
OLLAMA_URL=http://host.docker.internal:11434
OLLAMA_MODEL=llama3
```

## 2. Como Rodar
Na pasta raiz do projeto, execute:

```bash
docker compose up -d --build
```

## 3. Portas Acessíveis
- **Frontend:** http://ip-do-servidor (Porta 80)
- **Backend API:** http://ip-do-servidor:8080
- **Documentação API:** http://ip-do-servidor:8080/docs

## 4. Dica de Performance (Ollama)
Se o seu Homelab for limitado, altere o `OLLAMA_MODEL` para `phi3` ou `tinyllama` para respostas instantâneas.
Não esqueça de rodar `ollama pull nome-do-modelo` no host do Homelab.
