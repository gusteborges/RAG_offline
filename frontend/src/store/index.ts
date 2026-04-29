// ============================================================
// ZUSTAND STORES
// ============================================================
import { create } from 'zustand';
import { conversationsApi, documentsApi } from '../api';
import type { Document, Toast, ToastType, Conversation } from '../types';

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
    set({ token: null, isAuthenticated: false });
  },
}));

// ── Document Store ───────────────────────────────────────────
interface DocumentState {
  documents: Document[];
  setDocuments: (docs: Document[]) => void;
  addDocument: (doc: Document) => void;
  removeDocument: (id: string) => void;
  loadDocuments: (convId?: string) => Promise<void>;
  loadAllDocuments: () => Promise<void>;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  setDocuments: (docs) => set({ documents: docs }),
  addDocument: (doc) => set((s) => ({ documents: [doc, ...s.documents] })),
  removeDocument: (id) =>
    set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),
  loadDocuments: async (convId) => {
    try {
      const docs = await documentsApi.list(convId);
      set({ documents: docs });
    } catch { /* silent */ }
  },
  loadAllDocuments: async () => {
    try {
      const docs = await documentsApi.list();
      set({ documents: docs });
    } catch { /* silent */ }
  }
}));

// ── Conversation Store ───────────────────────────────────────
interface ConversationState {
  conversations: Conversation[];
  activeId: string | null;

  setActiveId: (id: string | null) => void;
  loadConversations: () => Promise<void>;
  createConversation: () => Promise<string>;
  deleteConversation: (id: string) => Promise<void>;
  addMessage: (convId: string, role: string, content: string, sources?: any[], model_used?: string) => Promise<void>;
  updateTitle: (convId: string, title: string) => Promise<void>;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  activeId: null,

  setActiveId: (id) => {
    set({ activeId: id });
    if (id) {
      // Quando trocar de conversa, buscar dados atualizados dela (incluindo mensagens)
      conversationsApi.get(id).then((conv) => {
        set((s) => ({
          conversations: s.conversations.map((c) => (c.id === id ? conv : c)),
        }));
      }).catch(err => console.error("Erro ao carregar conversa:", err));
    }
  },

  loadConversations: async () => {
    try {
      const convs = await conversationsApi.list();
      set({ conversations: convs });
      if (convs.length > 0 && !get().activeId) {
        set({ activeId: convs[0].id });
      }
    } catch { /* silent */ }
  },

  createConversation: async () => {
    try {
      const conv = await conversationsApi.create('Nova Conversa');
      await conversationsApi.addMessage(conv.id, 'assistant', 'Olá! 👋 Faça upload de um PDF e me pergunte qualquer coisa sobre ele.');
      
      const updatedConv = await conversationsApi.get(conv.id);
      set((s) => ({ 
        conversations: [updatedConv, ...s.conversations],
        activeId: updatedConv.id 
      }));
      return updatedConv.id;
    } catch (err) {
      console.error(err);
      return '';
    }
  },

  deleteConversation: async (id) => {
    try {
      await conversationsApi.delete(id);
      set((s) => {
        const updated = s.conversations.filter((c) => c.id !== id);
        const activeId = s.activeId === id ? (updated[0]?.id ?? null) : s.activeId;
        return { conversations: updated, activeId };
      });
    } catch { /* silent */ }
  },

  addMessage: async (convId, role, content, sources, model_used) => {
    try {
      await conversationsApi.addMessage(convId, role, content, sources, model_used);
      const conv = await conversationsApi.get(convId);
      
      set((s) => ({
        conversations: s.conversations.map((c) => c.id === convId ? conv : c)
      }));

      if (conv.title === 'Nova Conversa' && role === 'user') {
        const newTitle = content.slice(0, 42) + (content.length > 42 ? '…' : '');
        await conversationsApi.update(convId, newTitle);
        const updated = await conversationsApi.get(convId);
        set((s) => ({
          conversations: s.conversations.map((c) => c.id === convId ? updated : c)
        }));
      }
    } catch { /* silent */ }
  },

  updateTitle: async (convId, title) => {
    try {
      await conversationsApi.update(convId, title);
      set((s) => ({
        conversations: s.conversations.map((c) => c.id === convId ? { ...c, title } : c)
      }));
    } catch { /* silent */ }
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
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4500);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
