import React, { useState, useEffect } from 'react';
import {
  Menu,
  Plus,
  Search,
  Bell,
  Moon,
  Sparkles,
  LogOut,
  LogIn,
  ChevronDown
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
    showToast('info', 'Desconectado da sessão.');
  };

  return (
    <header className="sticky top-0 z-30 bg-[#090b11]/90 backdrop-blur-md border-b border-white/[0.06] px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
      {/* Esquerda: Menu Mobile + User Profile Pill (Aivora Style) */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-xl transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
            RM
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-white leading-tight">Rafael Matos</p>
            <p className="text-[10px] text-slate-400 leading-tight">@rafael.smartlar</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
        </div>
      </div>

      {/* Centro: Barra de Busca "Search Anything..." (Aivora Style) */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Anything (clientes, orçamentos, técnicos)..."
            className="w-full pl-10 pr-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-all"
          />
        </div>
      </div>

      {/* Direita: Notificações, Tema, Ask AI e Botão + Add Task / Novo Pedido */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notificação Bell com Dot */}
        <button
          type="button"
          onClick={() => showToast('info', 'Notificações', 'Nenhum alerta crítico pendente no momento.')}
          className="relative p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          title="Notificações"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-indigo-500 absolute top-1.5 right-1.5 shadow-xs shadow-indigo-500" />
        </button>

        {/* Status Supabase */}
        <button
          type="button"
          onClick={onOpenConfig}
          title="Configuração do Banco"
          className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <span
            className={`w-2.5 h-2.5 rounded-full inline-block ${
              isConfigured ? 'bg-emerald-400 shadow-xs shadow-emerald-400' : 'bg-amber-400 animate-pulse'
            }`}
          />
        </button>

        {/* Botão Ask AI (Aivora Style) */}
        <button
          type="button"
          onClick={() => showToast('info', 'SmartLar AI', 'Automações n8n conectadas e monitorando o banco.')}
          className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-bold text-slate-200 hover:bg-white/[0.08] transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Ask AI</span>
        </button>

        {/* Botão Principal: + Novo Pedido (Aivora Style: + Add Task) */}
        <button
          type="button"
          onClick={() => onTabChange('novo-pedido')}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#e0e7ff] hover:bg-white text-[#1e1b4b] rounded-xl text-xs font-extrabold shadow-md shadow-indigo-500/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Pedido</span>
        </button>
      </div>
    </header>
  );
};
