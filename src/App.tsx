import React, { useState, useEffect } from 'react';
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
import { LoginPage } from './pages/LoginPage';
import { supabase } from './lib/supabase';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { AuthModal } from './components/AuthModal';
import { BottomNav } from './components/BottomNav';
import { ErrorBoundary } from './components/ErrorBoundary';

export const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Tela de Carregamento Inicial
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#d8dde8] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 animate-pulse">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <h2 className="font-extrabold text-base text-slate-900 tracking-tight">
              SMART<span className="text-blue-600">LAR</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center justify-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Verificando autenticação...</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Se não estiver logado, exibe a Tela de Login dedicada
  if (!session) {
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-[#d8dde8] text-slate-800 font-sans flex flex-col">
      {/* Slim Dark Icon Rail (iPad Mockup Style) */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Area with Left Margin for the Akino Sidebar (w-64 on desktop) */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <Header
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
        />

        {/* Main View Container */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-28 sm:pb-32 lg:pb-10 max-w-[1600px] w-full mx-auto">
          <ErrorBoundary resetKey={currentTab}>
            {currentTab === 'dashboard' && <DashboardPage onNavigate={setCurrentTab} />}
            {currentTab === 'novo-pedido' && <NovoPedidoPage onNavigate={setCurrentTab} />}
            {currentTab === 'pedidos' && <PedidosPage />}
            {currentTab === 'agenda' && <AgendaPage />}
            {currentTab === 'clientes' && <ClientesPage />}
            {currentTab === 'produtos' && <ProdutosPage />}
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Bottom Navigation (App-like centered icon-only bar) */}
      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Modais */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onSuccess={() => {}} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
};
export default App;
