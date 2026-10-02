import React, { useState } from 'react';
import { ToastProvider } from './components/Toast';
import { Navbar, NavTab } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { NovoPedidoPage } from './pages/NovoPedidoPage';
import { PedidosPage } from './pages/PedidosPage';
import { AgendaPage } from './pages/AgendaPage';
import { ClientesPage } from './pages/ClientesPage';
import { ProdutosPage } from './pages/ProdutosPage';
import { getSupabaseConfig } from './lib/supabase';
import { Database, AlertTriangle, ShieldCheck, Github, ExternalLink } from 'lucide-react';
import { ConfigModal } from './components/ConfigModal';

export const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const { isConfigured } = getSupabaseConfig();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Banner se o Supabase ainda não estiver configurado */}
      {!isConfigured && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 shadow-sm text-xs font-semibold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 max-w-5xl mx-auto w-full justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950" />
              <span>
                <b>Atenção:</b> Credenciais do Supabase não configuradas no <code className="bg-amber-400 px-1 py-0.5 rounded font-mono">.env</code>. Conecte seu projeto para carregar e salvar dados.
              </span>
            </div>
            <button
              onClick={() => setIsConfigOpen(true)}
              className="px-3 py-1 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0 text-[11px] font-bold"
            >
              Configurar Agora
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo Principal com Container Max Width */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'dashboard' && <DashboardPage onNavigate={setCurrentTab} />}
        {currentTab === 'novo-pedido' && <NovoPedidoPage onNavigate={setCurrentTab} />}
        {currentTab === 'pedidos' && <PedidosPage />}
        {currentTab === 'agenda' && <AgendaPage />}
        {currentTab === 'clientes' && <ClientesPage />}
        {currentTab === 'produtos' && <ProdutosPage />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-800">SmartLar</span>
            <span>— Sistema Integrado de Gestão & Automação</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-slate-400" />
              PostgreSQL + Supabase
            </span>
            <span>•</span>
            <span>Automações n8n</span>
            <span>•</span>
            <span>Horário Oficial de Brasília</span>
          </div>
        </div>
      </footer>

      <ConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};
export default App;
