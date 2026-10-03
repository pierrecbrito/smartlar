import React, { useState, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  LogIn,
  LogOut
} from 'lucide-react';
import { NavTab } from './Navbar';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';

interface HeaderProps {
  currentTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
  onOpenSidebar?: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuth,
}) => {
  const [user, setUser] = useState<any>(null);
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
    <header className="sticky top-0 z-30 bg-[#d8dde8]/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 border-b border-slate-300/80">
      {/* Search Bar Pill (Akino Style) */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, pedido ou equipamento..."
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs transition-all"
          />
        </div>
      </div>

      {/* Right Actions: User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* User Profile Chip / Login State */}
        {user ? (
          <div
            onClick={handleLogout}
            className="flex items-center gap-2.5 bg-white border border-slate-200/80 rounded-full p-1 pr-3 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
            title="Clique para deslogar"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-xs">
              {user.email ? user.email.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                {user.email?.split('@')[0] || 'Administrador'}
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Autenticado
              </p>
            </div>
            <LogOut className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full py-1.5 px-3.5 shadow-xs transition-all cursor-pointer text-xs font-bold shrink-0"
            title="Clique para fazer login"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Fazer Login</span>
          </button>
        )}
      </div>
    </header>
  );
};
