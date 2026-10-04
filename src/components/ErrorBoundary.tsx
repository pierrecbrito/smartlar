import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Quando muda (ex.: troca de aba), o erro é limpo automaticamente. */
  resetKey?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Evita tela branca: captura erros de renderização e oferece recuperação. */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Erro não tratado na interface:', error, info.componentStack);
  }

  componentDidUpdate(prev: ErrorBoundaryProps) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        role="alert"
        className="bg-white rounded-3xl border border-rose-200 p-8 text-center max-w-lg mx-auto mt-10 shadow-xs"
      >
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-900">Algo deu errado</h2>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          Esta tela encontrou um erro inesperado. Seus dados no servidor não foram afetados.
        </p>
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Recarregar página
          </button>
        </div>
      </div>
    );
  }
}
