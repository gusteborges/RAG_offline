// ============================================================
// TYPESCRIPT TYPES — aligned with FastAPI backend schemas
// ============================================================

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export interface Document {
  id: string;
  title: string;
  file_path: string;
  created_at: string;
  user_id: string;
}

export interface DocumentDetail extends Document {
  content: string;
}

export interface RagResult {
  content: string;
  document_id: string;
  index: number;
  score: number;
}

export interface RagSearchResponse {
  results: RagResult[];
}

export interface AudioBook {
  id: string;
  file_path: string;
  format: string;
  description: string;
  document_id: string;
  created_at: string;
}

export interface AudioGenerateResponse {
  message: string;
  audio_id: string;
  file_path: string;
}

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}
