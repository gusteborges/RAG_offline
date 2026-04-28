// ============================================================
// DASHBOARD PAGE — Document list + drag-and-drop upload + RAG
// ============================================================
import { useEffect, useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { documentsApi, ragApi, extractErrorMessage } from '../api';
import { useDocumentStore, useToastStore } from '../store';
import type { Document, RagResult } from '../types';
import './Dashboard.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { documents, setDocuments, addDocument, removeDocument } = useDocumentStore();
  const { addToast } = useToastStore();

  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [ragQuery, setRagQuery] = useState('');
  const [ragResults, setRagResults] = useState<RagResult[]>([]);
  const [ragLoading, setRagLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load documents on mount
  useEffect(() => {
    (async () => {
      try {
        const docs = await documentsApi.list();
        setDocuments(docs);
      } catch (err) {
        const msg = await extractErrorMessage(err);
        addToast(msg, 'error');
      } finally {
        setLoadingDocs(false);
      }
    })();
  }, []);

  // Upload handler
  const handleUpload = async (file: File) => {
    if (!file.name.match(/\.(pdf|txt)$/i)) {
      addToast('Apenas arquivos PDF e TXT são suportados', 'error');
      return;
    }
    setUploading(true);
    try {
      const doc = await documentsApi.upload(file);
      addDocument(doc);
      addToast(`"${doc.title}" carregado com sucesso!`, 'success');
    } catch (err) {
      const msg = await extractErrorMessage(err);
      addToast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleUpload(e.target.files[0]);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]);
  };

  // Delete handler
  const handleDelete = async (doc: Document) => {
    if (!confirm(`Remover "${doc.title}"?`)) return;
    try {
      await documentsApi.delete(doc.id);
      removeDocument(doc.id);
      addToast('Documento removido', 'info');
    } catch {
      addToast('Erro ao remover documento', 'error');
    }
  };

  // RAG search
  const handleRagSearch = async () => {
    if (!ragQuery.trim()) return;
    setRagLoading(true);
    setRagResults([]);
    try {
      const res = await ragApi.search(ragQuery);
      setRagResults(res.results);
      if (res.results.length === 0) addToast('Nenhum resultado encontrado', 'info');
    } catch (err) {
      const msg = await extractErrorMessage(err);
      addToast(msg, 'error');
    } finally {
      setRagLoading(false);
    }
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="dashboard-layout">
      <Navbar />
      <main className="dashboard-main container">

        {/* Hero */}
        <section className="dash-hero fade-up">
          <div>
            <h1>Seus <span className="text-gradient">Documentos</span></h1>
            <p className="dash-hero-sub">Faça upload de PDFs, pesquise com IA e gere audiobooks.</p>
          </div>
          <div className="dash-stats">
            <div className="stat-chip">
              <span className="stat-num">{documents.length}</span>
              <span className="stat-label">Documentos</span>
            </div>
          </div>
        </section>

        {/* Upload zone */}
        <section
          className={`upload-zone fade-up fade-up-d1 ${dragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          id="upload-zone"
          aria-label="Área de upload de documentos"
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            id="file-input"
            type="file"
            accept=".pdf,.txt"
            style={{ display: 'none' }}
            onChange={onFileChange}
          />
          {uploading ? (
            <>
              <div className="spinner spinner-lg" />
              <p className="upload-text">Processando e indexando documento…</p>
            </>
          ) : (
            <>
              <div className="upload-icon">⬆</div>
              <p className="upload-text">
                {dragging ? 'Solte o arquivo aqui!' : 'Arraste um PDF/TXT ou clique para selecionar'}
              </p>
              <p className="upload-hint">PDF e TXT até qualquer tamanho</p>
            </>
          )}
        </section>

        {/* RAG Search */}
        <section className="rag-section fade-up fade-up-d2">
          <h2 className="section-title">🔍 Busca Semântica</h2>
          <div className="rag-search-row">
            <input
              id="rag-query"
              className="input"
              type="text"
              placeholder="Faça uma pergunta sobre seus documentos…"
              value={ragQuery}
              onChange={(e) => setRagQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRagSearch()}
            />
            <button
              id="btn-rag-search"
              className="btn btn-primary"
              onClick={handleRagSearch}
              disabled={ragLoading || !ragQuery.trim()}
            >
              {ragLoading ? <div className="spinner" /> : '→'}&nbsp;Buscar
            </button>
          </div>

          {ragResults.length > 0 && (
            <div className="rag-results">
              {ragResults.map((r, i) => (
                <div key={i} className="rag-result-card card fade-up">
                  <div className="rag-result-header">
                    <span className="badge badge-primary">Score: {(r.score * 100).toFixed(0)}%</span>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/documents/${r.document_id}`)}
                    >
                      Ver documento →
                    </button>
                  </div>
                  <p className="rag-result-text">{r.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Documents list */}
        <section className="docs-section fade-up fade-up-d3">
          <h2 className="section-title">📄 Documentos</h2>
          {loadingDocs ? (
            <div className="docs-loading">
              <div className="spinner spinner-lg" />
              <p>Carregando documentos…</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="docs-empty">
              <p className="docs-empty-icon">📭</p>
              <p>Nenhum documento ainda. Faça upload acima!</p>
            </div>
          ) : (
            <div className="docs-grid">
              {documents.map((doc) => (
                <article key={doc.id} className="doc-card card">
                  <div className="doc-card-icon">📄</div>
                  <div className="doc-card-info">
                    <h3 className="doc-card-title truncate">{doc.title}</h3>
                    <p className="doc-card-date">{formatDate(doc.created_at)}</p>
                  </div>
                  <div className="doc-card-actions">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/documents/${doc.id}`)}
                      id={`btn-view-${doc.id}`}
                    >
                      Abrir
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(doc)}
                      id={`btn-del-${doc.id}`}
                    >
                      ✕
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
