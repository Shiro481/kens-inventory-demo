import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  /** Show a toast. Returns the toast id so callers can dismiss it early. */
  show: (message: string, type?: ToastType, duration?: number) => string;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  warning: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  show: (message, type = 'info', duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({ toasts: [...state.toasts, { id, type, message, duration }] }));
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
    return id;
  },

  success: (message, duration) =>
    get().show(message, 'success', duration),

  error: (message, duration) =>
    get().show(message, 'error', duration ?? 6000),

  warning: (message, duration) =>
    get().show(message, 'warning', duration),

  info: (message, duration) =>
    get().show(message, 'info', duration),

  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** Convenience hook — grab just the actions */
export const useToast = () => {
  const { success, error, warning, info, dismiss } = useToastStore();
  return { success, error, warning, info, dismiss };
};
