// ============================================================
// ZUSTAND STORES
// ============================================================
import { create } from 'zustand';
import type { Document, Toast, ToastType } from '../types';

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
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  setDocuments: (docs) => set({ documents: docs }),
  addDocument: (doc) => set((s) => ({ documents: [doc, ...s.documents] })),
  removeDocument: (id) =>
    set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),
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
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4500);
  },

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
