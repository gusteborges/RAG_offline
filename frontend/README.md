# Frontend — SmartDocs

Frontend React + TypeScript para o sistema RAG local **SmartDocs**.

## Stack

| Tecnologia | Versão | Função |
|---|---|---|
| **Vite** | ^6 | Build tool / dev server |
| **React** | ^18 | UI framework |
| **TypeScript** | ^5 | Segurança de tipos |
| **react-pdf** | latest | Visualizador de PDF (worker local) |
| **Zustand** | latest | Estado global |
| **ky** | latest | HTTP client tipado |
| **react-router-dom** | v6 | Roteamento |

## Como rodar

### 1. Suba o backend
```bash
# Na raiz do projeto
docker compose up -d
```

### 2. Rode o frontend
```bash
cd frontend
npm install
npm run dev
```

Acesse: **http://localhost:5173**

## Estrutura

```
frontend/src/
├── api/           → Clientes HTTP (auth, documents, rag, audio)
├── components/    → Navbar, PDFViewer, AudioPlayer, Toast
├── pages/         → Login, Register, Dashboard, DocumentDetail
├── store/         → Zustand (auth, documents, toasts)
├── types/         → Tipos TypeScript alinhados com o backend
└── main.tsx       → Entrypoint
```

## Segurança

- JWT em sessionStorage (limpo ao fechar aba)
- Proxy Vite: zero request externo em runtime
- CSP via meta tag no index.html
- pdfjs worker local (sem CDN)
- Validação de tipo de arquivo no upload

## Nota sobre o PDF Viewer

O backend ainda nao expoe o endpoint GET /documents/{id}/file para servir o
arquivo fisico. A pagina de detalhe mostra a aba Texto Extraido como fallback.
Para habilitar o visualizador de PDF, adicione a rota abaixo ao backend (documents.py):

```python
@router.get("/{document_id}/file")
async def serve_file(document_id: UUID, db: AsyncSession = Depends(get_db),
                     current_user: User = Depends(get_current_user)):
    doc_repo = DocumentRepository(db)
    doc = await doc_repo.get_by_id(document_id)
    if not doc or doc.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Documento nao encontrado")
    return FileResponse(path=doc.file_path, media_type="application/pdf")
```
