import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = 'info', title, message, duration = 4000 }) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, type, title, message }]);
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  const toast = useMemo(
    () => ({
      success: (title, message) => showToast({ type: 'success', title, message }),
      error: (title, message) => showToast({ type: 'error', title, message }),
      info: (title, message) => showToast({ type: 'info', title, message }),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const styles = {
            success: 'bg-white border-emerald-200 text-slate-800',
            error: 'bg-white border-red-200 text-slate-800',
            info: 'bg-white border-blue-200 text-slate-800',
          };
          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
            error: <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />,
            info: <Info className="w-5 h-5 text-royal-600 shrink-0" />,
          };

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-elevated ${
                styles[t.type] || styles.info
              }`}
            >
              {icons[t.type]}
              <div className="flex-1 min-w-0">
                {t.title && <p className="text-sm font-bold text-navy-900">{t.title}</p>}
                {t.message && <p className="text-xs text-slate-600 mt-0.5">{t.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast harus digunakan di dalam ToastProvider');
  return ctx;
}