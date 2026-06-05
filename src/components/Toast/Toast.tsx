import { useToastStore, type Toast, type ToastType } from './useToastStore';
import styles from './Toast.module.css';

// ── Icon map ────────────────────────────────────────────────────────────────
const icons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

// ── Single toast item ────────────────────────────────────────────────────────
function ToastItem({ toast }: { toast: Toast }) {
  const { dismiss } = useToastStore();
  return (
    <div className={`${styles.toast} ${styles[toast.type]}`} role="alert">
      <span className={styles.icon}>{icons[toast.type]}</span>
      <span className={styles.message}>{toast.message}</span>
      <button
        className={styles.close}
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

// ── Container — mount once near the root ────────────────────────────────────
export default function ToastContainer() {
  const { toasts } = useToastStore();
  if (!toasts.length) return null;
  return (
    <div className={styles.container} aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
