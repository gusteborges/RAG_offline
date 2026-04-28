#!/bin/bash
set -e

# Função para aguardar o Postgres
postgres_ready() {
  python << END
import sys
import asyncio
import asyncpg

async def check():
    try:
        conn = await asyncpg.connect(
            user="${POSTGRES_USER}",
            password="${POSTGRES_PASSWORD}",
            database="${POSTGRES_DB}",
            host="${POSTGRES_HOST}"
        )
        await conn.close()
        sys.exit(0)
    except Exception:
        sys.exit(-1)

asyncio.run(check())
END
}

echo "Aguardando o Postgres ficar pronto..."
until postgres_ready; do
  echo "Postgres ainda não responde... tentando novamente em 2s"
  sleep 2
done

echo "Postgres pronto! Executando migrações..."
alembic upgrade head

echo "Iniciando Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
