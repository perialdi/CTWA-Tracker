import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const TOAST_ICONS = {
  success: <CheckCircle2 className="toast-icon text-emerald-600" />,
  error: <AlertCircle className="toast-icon text-rose-600" />,
  warning: <AlertTriangle className="toast-icon text-amber-600" />,
  info: <Info className="toast-icon text-blue-600" />,
};

export function ToastNotification({ toasts, onDismiss }: ToastNotificationProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-item toast-${toast.type}`}
          role="alert"
        >
          {TOAST_ICONS[toast.type]}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[13px] leading-snug">{toast.title}</p>
            {toast.message && (
              <p className="text-[12px] mt-0.5 opacity-80 leading-relaxed">{toast.message}</p>
            )}
          </div>
          <button
            className="toast-close"
            onClick={() => onDismiss(toast.id)}
            aria-label="Tutup notifikasi"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
