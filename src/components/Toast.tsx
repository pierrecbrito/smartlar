import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextData {
  showToast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

const TOAST_STYLES: Record<ToastType, { badgeBg: string; text: string; icon: React.FC<{ className?: string }> }> = {
  success: {
    badgeBg: 'bg-emerald-100 text-emerald-600',
    text: 'text-emerald-950',
    icon: CheckCircle2,
  },
  error: {
    badgeBg: 'bg-rose-100 text-rose-600',
    text: 'text-rose-950',
    icon: XCircle,
  },
  warning: {
    badgeBg: 'bg-amber-100 text-amber-600',
    text: 'text-amber-950',
    icon: AlertTriangle,
  },
  info: {
    badgeBg: 'bg-blue-100 text-blue-600',
    text: 'text-blue-950',
    icon: Info,
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container: Centralizado no topo no mobile, canto inferior direito no desktop */}
      <div className="fixed top-3.5 left-0 right-0 sm:top-auto sm:bottom-6 sm:right-6 sm:left-auto z-50 flex flex-col items-center sm:items-end gap-2 pointer-events-none px-3 sm:px-0">
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
          const Icon = style.icon;

          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-center gap-2.5 sm:gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-white/95 border border-slate-200/90 shadow-xl shadow-slate-900/10 backdrop-blur-md transition-all duration-300 max-w-[92vw] sm:max-w-md w-auto min-w-[270px] animate-fade-in"
            >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${style.badgeBg}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {toast.title}
                </p>
                {toast.message && (
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug line-clamp-2">
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Fechar notificação"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
