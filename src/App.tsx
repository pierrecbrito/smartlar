import React, { useState } from 'react';
import { ToastProvider } from './components/Toast';
import { NavTab } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { NovoPedidoPage } from './pages/NovoPedidoPage';
import { PedidosPage } from './pages/PedidosPage';
import { AgendaPage } from './pages/AgendaPage';
import { ClientesPage } from './pages/ClientesPage';
import { ProdutosPage } from './pages/ProdutosPage';
import { getSupabaseConfig } from './lib/supabase';
import { Database, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ConfigModal } from './components/ConfigModal';
import { AuthModal } from './components/AuthModal';

export const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { isConfigured } = getSupabaseConfig();

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 font-sans flex flex-col">
      {/* Sidebar (SaaS Shell) */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenConfig={() => setIsConfigOpen(true)}
      />

      {/* Conteúdo com margem esquerda para a Sidebar no desktop */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <Header
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenConfig={() => setIsConfigOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
        />

        {/* Banner se o Supabase não estiver configurado */}
        {!isConfigured && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2.5 shadow-xs text-xs font-semibold flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 max-w-5xl mx-auto w-full justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950" />
                <span>
                  <b>Atenção:</b> Credenciais do Supabase não configuradas no <code className="bg-amber-400 px-1 py-0.5 rounded font-mono">.env</code>.
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

        {/* Main Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && <DashboardPage onNavigate={setCurrentTab} />}
          {currentTab === 'novo-pedido' && <NovoPedidoPage onNavigate={setCurrentTab} />}
          {currentTab === 'pedidos' && <PedidosPage />}
          {currentTab === 'agenda' && <AgendaPage />}
          {currentTab === 'clientes' && <ClientesPage />}
          {currentTab === 'produtos' && <ProdutosPage />}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-4 px-6 text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-800">SmartLar</span>
              <span>— Solução No-Code para Gestão de Instalações</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-500" />
                PostgreSQL 16
              </span>
              <span>•</span>
              <span>Fuso de Brasília (GMT-3)</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Modais Globais */}
      <ConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onSuccess={() => {}} />
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
