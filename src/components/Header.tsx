import React, { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  Settings,
  ChevronDown,
  User,
  LogOut,
  Database
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
    <header className="sticky top-0 z-30 bg-[#f4f5f9]/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
      {/* Mobile Toggle + Search Bar Pill (Matching the iPad UI) */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="lg:hidden p-2.5 bg-white border border-slate-200/80 rounded-full text-slate-600 hover:text-slate-900 shadow-xs"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product, client, or order..."
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs transition-all"
          />
        </div>
      </div>

      {/* Right Actions: Notification, Settings Gear, and User Pill (Matching the iPad UI) */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Notification Bell Pill */}
        <button
          type="button"
          onClick={() => showToast('info', 'Notificações', 'Nenhum alerta pendente no momento.')}
          className="w-10 h-10 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition-colors relative"
          title="Notificações"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-2 right-2 ring-2 ring-white" />
        </button>

        {/* Settings / DB Config Pill */}
        <button
          type="button"
          onClick={onOpenConfig}
          className="w-10 h-10 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition-colors relative"
          title="Configurações do Banco"
        >
          <Settings className="w-4 h-4" />
          <span
            className={`w-2 h-2 rounded-full absolute top-2 right-2 ${
              isConfigured ? 'bg-emerald-500 ring-2 ring-white' : 'bg-amber-500 ring-2 ring-white animate-pulse'
            }`}
          />
        </button>

        {/* User Profile Chip (Noah Brooks style -> Rafael Matos) */}
        <div
          onClick={user ? handleLogout : onOpenAuth}
          className="flex items-center gap-2.5 bg-white border border-slate-200/80 rounded-full p-1 pr-3.5 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
          title={user ? 'Clique para deslogar' : 'Clique para autenticar (Supabase Auth)'}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-900 to-slate-700 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            RF
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <p className="text-xs font-bold text-slate-900">Rafael Matos</p>
            <p className="text-[10px] text-slate-400 font-medium">Store owner</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
        </div>
      </div>
    </header>
  );
};
