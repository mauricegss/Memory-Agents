import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ message, type = 'info', duration = 3500 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const showSuccess = useCallback((message, duration) => addToast({ message, type: 'success', duration }), [addToast]);
  const showError = useCallback((message, duration) => addToast({ message, type: 'error', duration }), [addToast]);
  const showWarning = useCallback((message, duration) => addToast({ message, type: 'warning', duration }), [addToast]);
  const showInfo = useCallback((message, duration) => addToast({ message, type: 'info', duration }), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full px-3">
        {toasts.map((toast) => {
          const typeStyles = {
            success: 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-emerald-100',
            error: 'bg-rose-50 border-rose-300 text-rose-800 shadow-rose-100',
            warning: 'bg-amber-50 border-amber-300 text-amber-800 shadow-amber-100',
            info: 'bg-blue-50 border-blue-300 text-blue-800 shadow-blue-100',
          }[toast.type] || 'bg-white border-blue-200 text-slate-700 shadow-slate-100';

          const icons = {
            success: <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />,
            error: <AlertCircle className="text-rose-500 shrink-0" size={20} />,
            warning: <AlertTriangle className="text-amber-500 shrink-0" size={20} />,
            info: <Info className="text-blue-500 shrink-0" size={20} />,
          }[toast.type];

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl border-2 shadow-lg backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-2 fade-in ${typeStyles}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {icons}
                <p className="text-sm font-bold leading-snug break-words">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-black/5 shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
