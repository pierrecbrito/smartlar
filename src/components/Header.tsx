import React, { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  Mail,
  Settings,
  ChevronDown,
  User,
  Plus,
  FileDown
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
    showToast('info', 'Você saiu da sessão.');
  };

  return (
    <header className="sticky top-0 z-30 bg-[#eaecf2]/85 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 border-b border-slate-300/60">
      {/* Mobile Toggle & Search Bar Pill (Akino Style) */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="lg:hidden p-2.5 bg-white border border-slate-200/80 rounded-2xl text-slate-600 hover:text-slate-900 shadow-xs cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="lg:hidden flex items-center shrink-0">
          <img src="/logo.png" alt="SmartLar" className="h-8 w-8 object-contain rounded-xl" />
        </div>

        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, pedido ou equipamento..."
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs transition-all"
          />
        </div>
      </div>

      {/* Right Actions: Akino Action Buttons (+ Add Project / Import Data) + User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* "+ Novo Pedido" Pill Button (in vibrant blue from Akino!) */}
        <button
          onClick={() => onTabChange('novo-pedido')}
          className="hidden md:flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Pedido</span>
        </button>

        {/* "Exportar / Dados" Pill Button */}
        <button
          onClick={() => showToast('info', 'Exportação', 'Relatório consolidado pronto para download.')}
          className="hidden xl:flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <FileDown className="w-3.5 h-3.5 text-slate-500" />
          <span>Exportar Dados</span>
        </button>

        {/* Mensagens / Suporte */}
        <button
          type="button"
          onClick={() => showToast('info', 'Mensagens', 'Caixa de mensagens com técnicos sincronizada.')}
          className="w-10 h-10 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition-colors relative cursor-pointer hidden sm:flex"
          title="Mensagens"
        >
          <Mail className="w-4 h-4 text-slate-500" />
        </button>

        {/* Notification Bell Pill */}
        <button
          type="button"
          onClick={() => showToast('info', 'Notificações', '1 instalação agendada para amanhã pelo n8n.')}
          className="w-10 h-10 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition-colors relative cursor-pointer"
          title="Notificações"
        >
          <Bell className="w-4 h-4 text-slate-500" />
          <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-2.5 right-2.5 ring-2 ring-white" />
        </button>

        {/* Settings / DB Config */}
        <button
          type="button"
          onClick={onOpenConfig}
          className="w-10 h-10 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition-colors relative cursor-pointer"
          title="Configurações do Banco"
        >
          <Settings className="w-4 h-4 text-slate-500" />
          <span
            className={`w-2 h-2 rounded-full absolute top-2.5 right-2.5 ${
              isConfigured ? 'bg-emerald-500 ring-2 ring-white' : 'bg-amber-500 ring-2 ring-white animate-pulse'
            }`}
          />
        </button>

        {/* User Profile Chip (Akino Style with Avatar + Name + Subtitle) */}
        <div
          onClick={user ? handleLogout : onOpenAuth}
          className="flex items-center gap-2.5 bg-white border border-slate-200/80 rounded-full p-1 pr-3 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
          title={user ? 'Clique para deslogar' : 'Clique para autenticar'}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            RF
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <p className="text-xs font-bold text-slate-900">Rafael Matos</p>
            <p className="text-[10px] text-slate-400 font-medium">Administrador</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
        </div>
      </div>
    </header>
  );
};
