import React, { useState, useEffect } from 'react';
import {
  Menu,
  PlusCircle,
  Database,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
  Search,
  Bell,
  Sparkles
} from 'lucide-react';
import { NavTab } from './Navbar';
import { supabase, getSupabaseConfig } from '../lib/supabase';
import { useToast } from './Toast';

interface HeaderProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenSidebar: () => void;
  onOpenConfig: () => void;
  onOpenAuth: () => void;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Visão Geral & Faturamento',
    subtitle: 'Métricas em tempo real, fechamento mensal e instalações da semana',
  },
  'novo-pedido': {
    title: 'Novo Pedido & Orçamento',
    subtitle: 'Montagem de proposta com cálculo atômico no PostgreSQL',
  },
  pedidos: {
    title: 'Gestão de Pedidos',
    subtitle: 'Máquina de estados blindada por triggers e trilha de auditoria',
  },
  agenda: {
    title: 'Agenda de Instalações',
    subtitle: 'Escala técnica com detecção preventiva de conflitos',
  },
  clientes: {
    title: 'Clientes & WhatsApp',
    subtitle: 'Base de clientes com histórico de compras e contatos',
  },
  produtos: {
    title: 'Catálogo de Produtos',
    subtitle: 'Equipamentos inteligentes com freeze de preço unitário',
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenSidebar,
  onOpenConfig,
  onOpenAuth,
}) => {
  const [user, setUser] = useState<any>(null);
  const { isConfigured } = getSupabaseConfig();
  const { showToast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    showToast('info', 'Você foi desconectado.');
  };

  const pageInfo = TAB_TITLES[currentTab];

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 transition-all">
      {/* Esquerda: Botão Menu (Mobile) + Título da Página / Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          title="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
              SmartLar
            </span>
            <span className="text-xs text-slate-300 hidden sm:inline">/</span>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
              {pageInfo.title}
            </h1>
          </div>
          <p className="text-[11px] text-slate-500 hidden md:block">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Direita: Ações Rápidas */}
      <div className="flex items-center gap-2.5">
        {/* Botão Novo Orçamento (se não estiver na tela) */}
        {currentTab !== 'novo-pedido' && (
          <button
            type="button"
            onClick={() => onTabChange('novo-pedido')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Orçamento</span>
          </button>
        )}

        {/* Status Supabase Pill */}
        <button
          type="button"
          onClick={onOpenConfig}
          title="Configurações de Conexão Supabase"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
            isConfigured
              ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              : 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isConfigured ? 'bg-emerald-500 shadow-xs shadow-emerald-500' : 'bg-amber-500'
            }`}
          />
          <span className="hidden md:inline font-mono text-[11px]">
            {isConfigured ? 'PostgreSQL Ativo' : 'Configurar DB'}
          </span>
        </button>

        {/* Login / Auth */}
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <span className="text-xs font-medium text-slate-600 hidden sm:inline">
              {user.email?.split('@')[0]}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              title="Sair"
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <LogIn className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Login (RLS)</span>
          </button>
        )}
      </div>
    </header>
  );
};
