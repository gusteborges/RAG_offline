// ============================================================
// DASHBOARD — NotebookLM-inspired layout with conversation sidebar
// ============================================================
import { useEffect, useState, useRef, useCallback } from 'react';
import type { DragEvent, ChangeEvent, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentsApi, ragApi, extractErrorMessage } from '../api';
import { useDocumentStore, useToastStore, useConversationStore, useAuthStore } from '../store';
import AudiobookModal from '../components/AudiobookModal';
import type { ChatMessage } from '../types';
import './Dashboard.css';

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export default function DashboardPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { documents, setDocuments, addDocument, removeDocument } = useDocumentStore();
  const { addToast } = useToastStore();
  const {
    conversations, activeId,
    setActiveId, createConversation, deleteConversation, addMessage,
  } = useConversationStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [input, setInput] = useState('');
  const [showAudiobook, setShowAudiobook] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeId);

  // Init: load docs + ensure at least one conversation
  useEffect(() => {
    (async () => {
      try {
        const docs = await documentsApi.list();
        setDocuments(docs);
      } catch { /* silent */ }
    })();
    if (conversations.length === 0) createConversation();
    else if (!activeId) setActiveId(conversations[0].id);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages.length]);

  // ── Upload ──────────────────────────────────────────────────
  const handleUpload = async (file: File) => {
    if (!file.name.match(/\.(pdf|txt)$/i)) {
      addToast('Apenas PDF e TXT são suportados', 'error'); return;
    }
    setUploading(true);
    try {
      const doc = await documentsApi.upload(file);
      addDocument(doc);
      addToast(`"${doc.title}" indexado!`, 'success');
      if (activeId) {
        addMessage(activeId, {
          id: uid(), role: 'assistant',
          content: `📄 **"${doc.title}"** foi indexado. Agora pode perguntar sobre ele!`,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) { addToast(await extractErrorMessage(err), 'error'); }
    finally { setUploading(false); }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleUpload(e.target.files[0]);
    e.target.value = '';
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]);
  };

  // ── Delete document ─────────────────────────────────────────
  const handleDeleteDoc = async (id: string, title: string) => {
    if (!confirm(`Remover "${title}"?`)) return;
    try {
      await documentsApi.delete(id);
      removeDocument(id);
      addToast('Removido', 'info');
    } catch (err) { addToast(await extractErrorMessage(err), 'error'); }
  };

  // ── Chat send ───────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || chatLoading || !activeId) return;

    const userMsg: ChatMessage = { id: uid(), role: 'user', content: text, timestamp: new Date().toISOString() };
    addMessage(activeId, userMsg);
    setInput('');
    setChatLoading(true);

    try {
      const res = await ragApi.chat(text);
      addMessage(activeId, {
        id: uid(), role: 'assistant',
        content: res.answer, sources: res.sources, model_used: res.model_used,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      addMessage(activeId, {
        id: uid(), role: 'assistant',
        content: `❌ ${await extractErrorMessage(err)}`,
        timestamp: new Date().toISOString(),
      });
    } finally { setChatLoading(false); }
  }, [input, chatLoading, activeId]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleNewChat = () => { createConversation(); setSidebarOpen(false); };

  const handleLogout = () => { logout(); navigate('/login'); };

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-visible' : ''}`}>

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside className="nb-sidebar">
        <div className="nb-sidebar-top">
          {/* Logo */}
          <div className="nb-logo">
            <span className="nb-logo-icon">⬡</span>
            <span className="nb-logo-text">SmartDocs</span>
          </div>

          {/* New Chat */}
          <button id="btn-new-chat" className="btn-new-chat" onClick={handleNewChat}>
            <span>＋</span> Nova Conversa
          </button>

          {/* Conversation list */}
          <nav className="nb-conv-list" aria-label="Conversas">
            <p className="nb-section-label">Conversas</p>
            {conversations.map((c) => (
              <div
                key={c.id}
                className={`nb-conv-item ${c.id === activeId ? 'active' : ''}`}
              >
                <button
                  className="nb-conv-btn"
                  onClick={() => { setActiveId(c.id); setSidebarOpen(false); }}
                  id={`conv-${c.id}`}
                  title={c.title}
                >
                  <span className="nb-conv-icon">💬</span>
                  <div className="nb-conv-info">
                    <span className="nb-conv-title">{c.title}</span>
                    <span className="nb-conv-date">{fmtDate(c.updatedAt)}</span>
                  </div>
                </button>
                <button
                  className="nb-conv-del"
                  onClick={() => deleteConversation(c.id)}
                  aria-label="Apagar conversa"
                  title="Apagar"
                >✕</button>
              </div>
            ))}
          </nav>
        </div>

        {/* Sources */}
        <div className="nb-sources">
          <div className="nb-section-label-row">
            <span className="nb-section-label">Fontes</span>
            <button
              className="nb-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Adicionar documento"
              id="btn-sidebar-upload"
            >
              {uploading ? <div className="spinner" /> : '＋'}
            </button>
            <input
              ref={fileInputRef} type="file" accept=".pdf,.txt"
              style={{ display: 'none' }} onChange={onFileChange}
            />
          </div>

          <div
            className={`nb-drop-zone ${dragging ? 'dragging' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            {dragging ? 'Solte aqui!' : 'Arraste PDFs aqui'}
          </div>

          <ul className="nb-doc-list">
            {documents.length === 0 && <li className="nb-doc-empty">Nenhum documento ainda</li>}
            {documents.map((doc) => (
              <li key={doc.id} className="nb-doc-item">
                <button
                  className="nb-doc-name"
                  onClick={() => navigate(`/documents/${doc.id}`)}
                  title={doc.title}
                >
                  <span>📄</span>
                  <span className="nb-doc-title">{doc.title}</span>
                </button>
                <button
                  className="nb-doc-del"
                  onClick={() => handleDeleteDoc(doc.id, doc.title)}
                  aria-label="Remover"
                >✕</button>
              </li>
            ))}
          </ul>

          {/* Logout */}
          <button className="nb-logout-btn" onClick={handleLogout} id="btn-logout">
            ↩ Sair
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="nb-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── CHAT MAIN ────────────────────────────────────────── */}
      <div className="chat-shell">
        {/* Chat top bar */}
        <header className="chat-topbar">
          <button
            className="chat-hamburger"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Abrir menu"
          >☰</button>
          <span className="chat-topbar-title">
            {activeConv?.title ?? 'SmartDocs RAG'}
          </span>
          <span className="chat-topbar-badge">RAG ✦ LLM local</span>
        </header>

        {/* Messages */}
        <div className="chat-messages" id="chat-messages">
          {activeConv?.messages.map((msg) => (
            <div key={msg.id} className={`chat-msg chat-msg-${msg.role}`}>
              <div className="chat-bubble">
                <p className="chat-text">
                  {msg.content.split(/\*\*(.*?)\*\*/g).map((part, i) =>
                    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                  )}
                </p>
                {msg.sources && msg.sources.length > 0 && (
                  <details className="chat-sources">
                    <summary className="sources-summary">
                      📎 {msg.sources.length} fonte{msg.sources.length > 1 ? 's' : ''}
                    </summary>
                    <div className="sources-list">
                      {msg.sources.map((s, i) => (
                        <div key={i} className="source-item">
                          <div className="source-header">
                            <span className="badge badge-primary">{(s.score * 100).toFixed(0)}%</span>
                            <button className="source-link" onClick={() => navigate(`/documents/${s.document_id}`)}>
                              Ver PDF →
                            </button>
                          </div>
                          <p className="source-text">{s.content}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
                <div className="chat-meta">
                  <span className="chat-time">{fmtTime(msg.timestamp)}</span>
                  {msg.model_used && msg.model_used !== 'none' && msg.model_used !== 'fallback' && (
                    <span className="chat-model">{msg.model_used}</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {chatLoading && (
            <div className="chat-msg chat-msg-assistant">
              <div className="chat-bubble chat-typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input bar */}
        <div className="chat-inputbar">
          <input
            id="chat-input"
            className="chat-input"
            type="text"
            placeholder={activeConv ? 'Pergunte sobre seus documentos…' : 'Selecione uma conversa'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={chatLoading || !activeId}
            autoComplete="off"
          />

          {/* Audiobook button */}
          <button
            id="btn-audiobook"
            className="inputbar-action"
            onClick={() => setShowAudiobook(true)}
            title="Gerar Audiobook"
            aria-label="Gerar Audiobook"
          >
            🎧
          </button>

          {/* Upload button */}
          <button
            id="btn-inputbar-upload"
            className="inputbar-action"
            onClick={() => fileInputRef.current?.click()}
            title="Anexar documento"
            aria-label="Anexar documento"
            disabled={uploading}
          >
            {uploading ? <div className="spinner" /> : '📎'}
          </button>

          {/* Send */}
          <button
            id="btn-send"
            className="btn btn-primary chat-send-btn"
            onClick={sendMessage}
            disabled={chatLoading || !input.trim() || !activeId}
            aria-label="Enviar"
          >
            {chatLoading ? <div className="spinner" /> : '↑'}
          </button>
        </div>
      </div>

      {/* Audiobook modal */}
      {showAudiobook && <AudiobookModal onClose={() => setShowAudiobook(false)} />}
    </div>
  );
}
