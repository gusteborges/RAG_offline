// ============================================================
// TOAST COMPONENT
// ============================================================
import { useToastStore } from '../store';
import './Toast.css';

const ICONS: Record<string, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`} role="alert">
          <span className={`toast-icon toast-icon-${t.type}`}>{ICONS[t.type]}</span>
          <span className="toast-msg">{t.message}</span>
          <button
            className="toast-close"
            onClick={() => removeToast(t.id)}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
