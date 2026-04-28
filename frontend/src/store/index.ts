// ============================================================
// ZUSTAND STORES
// ============================================================
import { create } from 'zustand';
import type { Document, Toast, ToastType, ChatMessage, Conversation } from '../types';

// ── Helpers ──────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function loadLS<T>(key: string, fallback: T): T {
  try { const s = localStorage.getItem(key); return s ? (JSON.parse(s) as T) : fallback; }
  catch { return fallback; }
}
function saveLS<T>(key: string, val: T) {
  localStorage.setItem(key, JSON.stringify(val));
}

const CONVS_KEY = 'smartdocs_conversations';

// ── Auth Store ───────────────────────────────────────────────
interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: sessionStorage.getItem('access_token'),
  isAuthenticated: !!sessionStorage.getItem('access_token'),

  setToken: (token) => {
    sessionStorage.setItem('access_token', token);
    set({ token, isAuthenticated: true });
  },

  logout: () => {
    sessionStorage.removeItem('access_token');
    localStorage.removeItem(CONVS_KEY);
    set({ token: null, isAuthenticated: false });
  },
}));

// ── Document Store ───────────────────────────────────────────
interface DocumentState {
  documents: Document[];
  setDocuments: (docs: Document[]) => void;
  addDocument: (doc: Document) => void;
  removeDocument: (id: string) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  setDocuments: (docs) => set({ documents: docs }),
  addDocument: (doc) => set((s) => ({ documents: [doc, ...s.documents] })),
  removeDocument: (id) =>
    set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),
}));

// ── Conversation Store ───────────────────────────────────────
interface ConversationState {
  conversations: Conversation[];
  activeId: string | null;

  setActiveId: (id: string | null) => void;
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  addMessage: (convId: string, msg: ChatMessage) => void;
  updateTitle: (convId: string, title: string) => void;
}

export const useConversationStore = create<ConversationState>((set) => ({
  conversations: loadLS<Conversation[]>(CONVS_KEY, []),
  activeId: null,

  setActiveId: (id) => set({ activeId: id }),

  createConversation: () => {
    const id = uid();
    const now = new Date().toISOString();
    const conv: Conversation = {
      id,
      title: 'Nova Conversa',
      messages: [
        {
          id: uid(),
          role: 'assistant',
          content: 'Olá! 👋 Faça upload de um PDF e me pergunte qualquer coisa sobre ele.',
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    set((s) => {
      const updated = [conv, ...s.conversations];
      saveLS(CONVS_KEY, updated);
      return { conversations: updated, activeId: id };
    });
    return id;
  },

  deleteConversation: (id) => {
    set((s) => {
      const updated = s.conversations.filter((c) => c.id !== id);
      saveLS(CONVS_KEY, updated);
      const activeId = s.activeId === id ? (updated[0]?.id ?? null) : s.activeId;
      return { conversations: updated, activeId };
    });
  },

  addMessage: (convId, msg) => {
    set((s) => {
      const updated = s.conversations.map((c) => {
        if (c.id !== convId) return c;
        // Auto-title from first user message
        let title = c.title;
        if (title === 'Nova Conversa' && msg.role === 'user') {
          title = msg.content.slice(0, 42) + (msg.content.length > 42 ? '…' : '');
        }
        return { ...c, title, messages: [...c.messages, msg], updatedAt: new Date().toISOString() };
      });
      saveLS(CONVS_KEY, updated);
      return { conversations: updated };
    });
  },

  updateTitle: (convId, title) => {
    set((s) => {
      const updated = s.conversations.map((c) => c.id === convId ? { ...c, title } : c);
      saveLS(CONVS_KEY, updated);
      return { conversations: updated };
    });
  },
}));

// ── Toast Store ──────────────────────────────────────────────
interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = uid();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4500);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
