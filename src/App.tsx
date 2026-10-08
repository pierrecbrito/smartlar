import React, { useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DashboardPage } from './pages/DashboardPage';
import { NovoPedidoPage } from './pages/NovoPedidoPage';
import { PedidosPage } from './pages/PedidosPage';
import { AgendaPage } from './pages/AgendaPage';
import { ClientesPage } from './pages/ClientesPage';
import { ProdutosPage } from './pages/ProdutosPage';
import { LoginPage } from './pages/LoginPage';
import { ShieldCheck, Loader2 } from 'lucide-react';

const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#d8dde8] text-slate-800 font-sans flex flex-col">
      {/* Sidebar com rotas e ativo automático */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Área Principal */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
        <Header
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onSelectOrder={(orderId) => navigate(`/pedidos?id=${orderId}`)}
        />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-28 sm:pb-32 lg:pb-10 max-w-[1600px] w-full mx-auto">
          <ErrorBoundary resetKey={location.pathname}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={<DashboardPage onNavigate={(tab) => navigate('/' + tab)} />}
              />
              <Route
                path="/novo-pedido"
                element={<NovoPedidoPage onNavigate={(tab) => navigate('/' + tab)} />}
              />
              <Route path="/pedidos" element={<PedidosPage />} />
              <Route path="/agenda" element={<AgendaPage />} />
              <Route path="/clientes" element={<ClientesPage />} />
              <Route path="/produtos" element={<ProdutosPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>

      {/* Navegação Mobile Inferior com suporte a rotas */}
      <BottomNav />
    </div>
  );
};

const AuthGuard: React.FC = () => {
  const { session, loading } = useAuth();

  if (loading) {
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
              <span>Verificando autenticação segura...</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  return <AppLayout />;
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <AuthGuard />
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
