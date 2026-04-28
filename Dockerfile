FROM python:3.11-slim

WORKDIR /app

# Instala dependências do sistema para processamento de áudio/PDF
RUN apt-get update && apt-get install -y \
    build-essential \
    ffmpeg \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copia e instala dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o resto do código
COPY . .

# Garante que a pasta de uploads exista
RUN mkdir -p uploads

# Expõe a porta do FastAPI
EXPOSE 8080

# Comando para rodar a aplicação
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
