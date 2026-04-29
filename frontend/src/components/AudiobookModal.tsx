// ============================================================
// AUDIOBOOK MODAL — pick a PDF and generate audio
// ============================================================
import { useState, useEffect } from 'react';
import { audioApi, extractErrorMessage } from '../api';
import { useDocumentStore, useToastStore } from '../store';
import AudioPlayer from './AudioPlayer';
import type { Document } from '../types';
import './AudiobookModal.css';

interface Props { onClose: () => void; }

export default function AudiobookModal({ onClose }: Props) {
  const { documents, loadAllDocuments } = useDocumentStore();
  const { addToast } = useToastStore();
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioTitle, setAudioTitle] = useState('');

  useEffect(() => {
    loadAllDocuments();
  }, []);

  const handleGenerate = async (doc: Document) => {
    setGeneratingId(doc.id);
    setAudioBlobUrl(null);
    try {
      const res = await audioApi.generate(doc.id);
      const blobUrl = await audioApi.fetchBlobUrl(res.audio_id);
      setAudioBlobUrl(blobUrl);
      setAudioTitle(doc.title);
      addToast('Audiobook gerado! 🎧', 'success');
    } catch (err) {
      addToast(await extractErrorMessage(err), 'error');
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div
      className="ab-overlay"
      onClick={(e) => e.currentTarget === e.target && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Gerar Audiobook"
    >
      <div className="ab-modal">
        {/* Header */}
        <div className="ab-header">
          <div className="ab-header-left">
            <div className="ab-header-icon">🎧</div>
            <div>
              <h2 className="ab-title">Gerar Audiobook</h2>
              <p className="ab-sub">Converta um PDF em narração de áudio</p>
            </div>
          </div>
          <button className="ab-close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        {/* Player (when ready) */}
        {audioBlobUrl && (
          <div className="ab-player">
            <AudioPlayer src={audioBlobUrl} title={audioTitle} />
          </div>
        )}

        {/* Document list */}
        <div className="ab-list">
          {documents.length === 0 ? (
            <p className="ab-empty">
              Nenhum documento disponível.<br />Faça upload de um PDF no painel principal.
            </p>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className={`ab-item ${generatingId === doc.id ? 'ab-item-loading' : ''}`}>
                <span className="ab-item-icon">📄</span>
                <span className="ab-item-name" title={doc.title}>{doc.title}</span>
                <button
                  id={`btn-audio-gen-${doc.id}`}
                  className="btn btn-primary btn-sm"
                  onClick={() => handleGenerate(doc)}
                  disabled={!!generatingId}
                >
                  {generatingId === doc.id
                    ? <><div className="spinner" /> Gerando…</>
                    : '▶ Gerar'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
