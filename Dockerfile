ARG PYTHON_VERSION=3.11.3
FROM python:${PYTHON_VERSION}-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instala dependências de sistema necessárias para algumas libs de IA e o script de entrada
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Criar usuário e pastas antes de mudar para usuário não-privilegiado
RUN adduser --disabled-password --gecos "" appuser && \
    mkdir -p /app/uploads && \
    chown -R appuser:appuser /app

# Instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar o código
COPY --chown=appuser:appuser . .

# Corrigir finais de linha do Windows e dar permissão de execução
RUN sed -i 's/\r$//' /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

# Mudar para o usuário seguro
USER appuser

EXPOSE 8080

# Usar o script para iniciar TUDO de uma vez
ENTRYPOINT ["/app/entrypoint.sh"]
