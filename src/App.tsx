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
import { AlertTriangle, ShieldCheck, Database } from 'lucide-react';
import { ConfigModal } from './components/ConfigModal';
import { AuthModal } from './components/AuthModal';

export const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('novo-pedido');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { isConfigured } = getSupabaseConfig();

  return (
    <div className="min-h-screen bg-[#f4f5f9] text-slate-800 font-sans flex flex-col">
      {/* Slim Dark Icon Rail (iPad Mockup Style) */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenConfig={() => setIsConfigOpen(true)}
      />

      {/* Main Area with Left Margin for the Slim Rail (w-20 on desktop) */}
      <div className="lg:pl-20 flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <Header
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenConfig={() => setIsConfigOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
        />

        {/* Supabase Notice Banner */}
        {!isConfigured && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mb-4 bg-amber-500 text-slate-950 px-4 py-2.5 rounded-2xl shadow-xs text-xs font-semibold flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950" />
              <span>
                <b>Atenção:</b> Credenciais do Supabase ausentes no <code className="bg-amber-400 px-1 py-0.5 rounded font-mono">.env</code>.
              </span>
            </div>
            <button
              onClick={() => setIsConfigOpen(true)}
              className="px-3 py-1 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shrink-0 text-[11px] font-bold"
            >
              Configurar DB
            </button>
          </div>
        )}

        {/* Main View Container */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-8 max-w-[1600px] w-full mx-auto">
          {currentTab === 'dashboard' && <DashboardPage onNavigate={setCurrentTab} />}
          {currentTab === 'novo-pedido' && <NovoPedidoPage onNavigate={setCurrentTab} />}
          {currentTab === 'pedidos' && <PedidosPage />}
          {currentTab === 'agenda' && <AgendaPage />}
          {currentTab === 'clientes' && <ClientesPage />}
          {currentTab === 'produtos' && <ProdutosPage />}
        </main>
      </div>

      {/* Modais */}
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
