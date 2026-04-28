// ============================================================
// DOCUMENT DETAIL PAGE — PDF Viewer + Audiobook generator
// ============================================================
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PDFViewer from '../components/PDFViewer';
import AudioPlayer from '../components/AudioPlayer';
import { documentsApi, audioApi, extractErrorMessage } from '../api';
import { useToastStore } from '../store';
import type { DocumentDetail } from '../types';
import './DocumentDetail.css';

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [audioId, setAudioId] = useState<string | null>(null);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'viewer' | 'text'>('viewer');

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await documentsApi.get(id);
        setDoc(data);

        // Fetch the actual PDF file to render it
        const token = sessionStorage.getItem('access_token');
        const res = await fetch(`/api/documents/${id}/file`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const blob = await res.blob();
          setPdfUrl(URL.createObjectURL(blob));
        } else {
          // Fallback: try to use the file_path as URL (won't work cross-origin but harmless)
          setPdfUrl(null);
        }
      } catch (err) {
        const msg = await extractErrorMessage(err);
        addToast(msg, 'error');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [id]);

  const handleGenerateAudio = async () => {
    if (!id) return;
    setGeneratingAudio(true);
    try {
      const res = await audioApi.generate(id);
      setAudioId(res.audio_id);
      setAudioReady(true);
      addToast('Audiobook gerado com sucesso! 🎧', 'success');
    } catch (err) {
      const msg = await extractErrorMessage(err);
      addToast(msg, 'error');
    } finally {
      setGeneratingAudio(false);
    }
  };

  if (loading) {
    return (
      <div className="detail-layout">
        <Navbar />
        <div className="detail-loading full-center">
          <div className="spinner spinner-lg" />
          <p>Carregando documento…</p>
        </div>
      </div>
    );
  }

  if (!doc) return null;

  const isPdf = doc.title.toLowerCase().endsWith('.pdf');

  return (
    <div className="detail-layout">
      <Navbar />
      <main className="detail-main container">

        {/* Header */}
        <div className="detail-header fade-up">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
            ← Voltar
          </button>
          <div className="detail-title-wrap">
            <h1 className="detail-title">{doc.title}</h1>
            <span className="badge badge-primary">{isPdf ? 'PDF' : 'TXT'}</span>
          </div>
        </div>

        <div className="detail-grid">

          {/* Left: PDF Viewer + Text */}
          <section className="detail-left fade-up fade-up-d1">
            {isPdf && (
              <div className="detail-tabs">
                <button
                  id="tab-viewer"
                  className={`tab-btn ${activeTab === 'viewer' ? 'active' : ''}`}
                  onClick={() => setActiveTab('viewer')}
                >
                  👁 Visualizador
                </button>
                <button
                  id="tab-text"
                  className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
                  onClick={() => setActiveTab('text')}
                >
                  📝 Texto Extraído
                </button>
              </div>
            )}

            {activeTab === 'viewer' && isPdf ? (
              pdfUrl ? (
                <PDFViewer source={pdfUrl} />
              ) : (
                <div className="pdf-unavailable">
                  <p>⚠️ Visualizador indisponível — o endpoint <code>/documents/{'{id}'}/file</code> não existe no backend ainda.</p>
                  <p>Alterne para a aba <strong>Texto Extraído</strong> para ver o conteúdo.</p>
                </div>
              )
            ) : (
              <div className="detail-text-content">
                <pre>{doc.content || 'Nenhum conteúdo extraído.'}</pre>
              </div>
            )}
          </section>

          {/* Right: Audiobook panel */}
          <aside className="detail-right fade-up fade-up-d2">
            <div className="audiobook-panel card">
              <div className="audiobook-panel-header">
                <span className="audiobook-panel-icon">🎧</span>
                <div>
                  <h2 className="audiobook-panel-title">Audiobook</h2>
                  <p className="audiobook-panel-sub">Converta o documento em áudio narrado</p>
                </div>
              </div>

              {!audioReady ? (
                <button
                  id="btn-generate-audio"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 8 }}
                  onClick={handleGenerateAudio}
                  disabled={generatingAudio}
                >
                  {generatingAudio ? (
                    <><div className="spinner" /> Gerando audiobook…</>
                  ) : (
                    '▶ Gerar Audiobook'
                  )}
                </button>
              ) : (
                <div style={{ marginTop: 8 }}>
                  <AudioPlayer
                    src={audioApi.downloadUrl(audioId!)}
                    title={`Audiobook — ${doc.title}`}
                  />
                </div>
              )}

              {generatingAudio && (
                <div className="audio-progress-info">
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: '60%' }} />
                  </div>
                  <p>Sintetizando voz… isso pode levar alguns segundos.</p>
                </div>
              )}
            </div>

            {/* Text stats */}
            <div className="card detail-stats">
              <h3 className="detail-stats-title">📊 Estatísticas</h3>
              <dl className="stats-list">
                <div className="stat-item">
                  <dt>Palavras</dt>
                  <dd>{doc.content ? doc.content.split(/\s+/).filter(Boolean).length.toLocaleString('pt-BR') : '—'}</dd>
                </div>
                <div className="stat-item">
                  <dt>Caracteres</dt>
                  <dd>{doc.content ? doc.content.length.toLocaleString('pt-BR') : '—'}</dd>
                </div>
                <div className="stat-item">
                  <dt>Leitura est.</dt>
                  <dd>{doc.content ? `~${Math.ceil(doc.content.split(/\s+/).length / 200)} min` : '—'}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
