# SmartDocs RAG 🚀

SmartDocs é um sistema de **RAG (Retrieval-Augmented Generation)** offline e privado, projetado para permitir que você converse com seus próprios documentos (PDF e TXT) de forma segura. O projeto utiliza modelos de linguagem locais via **Ollama**, embeddings multilinguais de alta performance e uma interface moderna inspirada no NotebookLM.

## ✨ Funcionalidades

- 📄 **Upload e Indexação**: Suporte para arquivos PDF e TXT.
- 🔍 **Busca Semântica**: Recuperação de trechos relevantes usando `pgvector`.
- 💬 **Chat Inteligente**: Histórico de mensagens persistente e respostas baseadas no contexto dos seus arquivos.
- 🎧 **Audiobooks**: Transforme seus documentos em áudio usando o serviço de TTS integrado.
- 🔒 **Privacidade**: Tudo roda localmente (ou no seu servidor homelab), sem enviar seus dados para APIs externas de IA.

---

## 🛠️ Tecnologias Utilizadas

- **Backend**: FastAPI (Python 3.11), SQLAlchemy, Alembic.
- **Banco de Dados**: PostgreSQL com extensão `pgvector`.
- **IA/LLM**: Ollama (Llama 3, Mistral, etc) + Sentence Transformers (Embeddings).
- **Frontend**: React, TypeScript, Zustand, Vanilla CSS.
- **Containerização**: Docker e Docker Compose.

---

## 🚀 Como Executar

### Pré-requisitos
- **Docker** e **Docker Compose** instalados.
- **Ollama** instalado no host (ou rodando em um container acessível).
  - Após instalar o Ollama, baixe o modelo padrão: `ollama pull llama3` (ou o modelo configurado no `.env`).

---

### 🪟 No Windows (via Docker Desktop)

1.  **Clonar o repositório**:
    ```bash
    git clone https://github.com/gusteborges/RAG_offline.git
    cd RAG_offline
    ```

2.  **Configurar Variáveis de Ambiente**:
    Crie um arquivo `.env` na raiz do projeto (use o `.env.example` como base se disponível):
    ```env
    OLLAMA_URL=http://host.docker.internal:11434
    OLLAMA_MODEL=llama3
    POSTGRES_USER=postgres
    POSTGRES_PASSWORD=postgres
    POSTGRES_DB=smartdocs
    SECRET_KEY=sua_chave_secreta_aqui
    ```

3.  **Subir os containers**:
    No terminal (PowerShell ou CMD):
    ```bash
    docker compose up -d --build
    ```

4.  **Rodar Migrações**:
    ```bash
    docker exec -it smartdocs_api alembic upgrade head
    ```

5.  **Acesse**:
    - Frontend: `http://localhost`
    - API Docs: `http://localhost:8080/docs`

---

### 🐧 No Linux / Homelab

1.  **Clonar o repositório**:
    ```bash
    git clone https://github.com/gusteborges/RAG_offline.git
    cd RAG_offline
    ```

2.  **Configurar Variáveis de Ambiente**:
    No Linux, se o Ollama estiver rodando no host, use o IP da rede docker ou o IP local da máquina:
    ```env
    OLLAMA_URL=http://172.17.0.1:11434  # Geralmente o IP do host no Docker
    OLLAMA_MODEL=llama3
    ```

3.  **Executar**:
    ```bash
    docker compose up -d --build
    ```

4.  **Rodar Migrações**:
    ```bash
    docker exec -it smartdocs_api alembic upgrade head
    ```

---

## 🛠️ Desenvolvimento Manual (Sem Docker)

Se preferir rodar fora do Docker:

1.  **Backend**:
    ```bash
    python -m venv venv
    source venv/bin/activate  # Linux
    .\venv\Scripts\activate   # Windows
    pip install -r requirements.txt
    uvicorn app.main:app --reload --port 8080
    ```

2.  **Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

---

## 📁 Estrutura do Projeto

- `/app`: Backend FastAPI (Modelos, Repositórios, Serviços e Rotas).
- `/alembic`: Migrações do banco de dados.
- `/frontend`: Interface React em TypeScript.
- `/uploads`: Armazenamento local dos documentos enviados.

## 📄 Licença

Este projeto é para fins de estudo e uso pessoal. Sinta-se à vontade para contribuir!
