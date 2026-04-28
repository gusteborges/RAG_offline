// ============================================================
// API CLIENT — ky wrapper with JWT injection & error handling
// ============================================================
import ky, { HTTPError } from 'ky';
import type { BeforeRequestHook, AfterResponseHook } from 'ky';
import type {
  AuthTokens,
  Document,
  DocumentDetail,
  RagSearchResponse,
  ChatResponse,
  AudioGenerateResponse,
} from '../types';

// ── Base client (proxied via Vite → localhost:8080) ──────────
const beforeRequest: BeforeRequestHook = ({ request }) => {
  const token = sessionStorage.getItem('access_token');
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
};

const afterResponse: AfterResponseHook = ({ response }) => {
  if (response.status === 401) {
    sessionStorage.removeItem('access_token');
    window.location.href = '/login';
  }
  return response;
};

const base = ky.create({
  prefix: '/api',
  timeout: 300_000,
  hooks: {
    beforeRequest: [beforeRequest],
    afterResponse: [afterResponse],
  },
});

// ── Auth ─────────────────────────────────────────────────────
export const authApi = {
  register: (username: string, email: string, password: string) =>
    base.post('auth/register', { json: { username, email, password } }).json<Document>(),

  login: async (email: string, password: string): Promise<AuthTokens> => {
    const form = new URLSearchParams();
    form.set('username', email);
    form.set('password', password);
    return base
      .post('auth/login', {
        body: form,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .json<AuthTokens>();
  },
};

// ── Documents ────────────────────────────────────────────────
export const documentsApi = {
  list: () => base.get('documents/').json<Document[]>(),

  get: (id: string) => base.get(`documents/${id}`).json<DocumentDetail>(),

  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return base.post('documents/upload', { body: form }).json<Document>();
  },

  delete: (id: string) => base.delete(`documents/${id}`),
};

// ── RAG ──────────────────────────────────────────────────────
export const ragApi = {
  search: (query: string, limit = 5) =>
    base.post('rag/search', { json: { query, limit } }).json<RagSearchResponse>(),

  chat: (message: string, limit = 5) =>
    base.post('rag/chat', { json: { message, limit } }).json<ChatResponse>(),
};

// ── Audio ────────────────────────────────────────────────────
export const audioApi = {
  generate: (documentId: string) =>
    base.post(`audio/generate/${documentId}`).json<AudioGenerateResponse>(),

  /** Fetch audio as blob and return an ObjectURL (includes auth header). */
  fetchBlobUrl: async (audioId: string): Promise<string> => {
    const token = sessionStorage.getItem('access_token');
    const res = await fetch(`/api/audio/download/${audioId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`Erro ao baixar áudio: ${res.status}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  /** Direct download href (for <a download> — requires same fetch approach) */
  downloadUrl: (audioId: string) => `/api/audio/download/${audioId}`,
};

// ── Error helper ─────────────────────────────────────────────
export async function extractErrorMessage(err: unknown): Promise<string> {
  if (err instanceof HTTPError) {
    try {
      const body = await err.response.json();
      return (body as { detail?: string }).detail ?? err.message;
    } catch {
      return err.message;
    }
  }
  if (err instanceof Error) return err.message;
  return 'Erro desconhecido';
}
