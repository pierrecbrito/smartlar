import React, { useState, useEffect } from 'react';
import {
  Home,
  PlusCircle,
  ClipboardList,
  Calendar,
  Users,
  Package,
  Database,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';
import { supabase, getSupabaseConfig } from '../lib/supabase';
import { ConfigModal } from './ConfigModal';
import { AuthModal } from './AuthModal';
import { useToast } from './Toast';

export type NavTab = 'dashboard' | 'novo-pedido' | 'pedidos' | 'agenda' | 'clientes' | 'produtos';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange }) => {
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: Home },
    { id: 'pedidos' as NavTab, label: 'Gestão de Pedidos', icon: ClipboardList },
    { id: 'agenda' as NavTab, label: 'Agenda & Instalações', icon: Calendar },
    { id: 'clientes' as NavTab, label: 'Clientes', icon: Users },
    { id: 'produtos' as NavTab, label: 'Produtos', icon: Package },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Brand */}
            <div className="flex items-center gap-8">
              <button
                onClick={() => onTabChange('dashboard')}
                className="flex items-center gap-2.5 group text-left focus:outline-none"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                    SmartLar
                    <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      PRO
                    </span>
                  </span>
                  <p className="text-[11px] text-slate-500 font-medium leading-none">
                    Automação & Segurança
                  </p>
                </div>
              </button>

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Highlighted CTA: Novo Pedido */}
              <button
                onClick={() => onTabChange('novo-pedido')}
                className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  currentTab === 'novo-pedido'
                    ? 'bg-blue-800 text-white ring-2 ring-blue-500/40'
                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                Novo Pedido
              </button>

              {/* Supabase Status Pill */}
              <button
                onClick={() => setConfigModalOpen(true)}
                title="Configurações de Conexão Supabase"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  isConfigured
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 animate-pulse'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">
                  {isConfigured ? 'Supabase Conectado' : 'Conectar Supabase'}
                </span>
                <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </button>

              {/* User / Auth */}
              {user ? (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold" title={user.email}>
                    <User className="w-4 h-4" />
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Sair da Conta"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Entrar (RLS)</span>
                </button>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-4 space-y-1">
            <button
              onClick={() => {
                onTabChange('novo-pedido');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white mb-2"
            >
              <PlusCircle className="w-4 h-4" />
              Novo Pedido (Orçamento)
            </button>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left ${
                    isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      <ConfigModal isOpen={configModalOpen} onClose={() => setConfigModalOpen(false)} />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} onSuccess={() => {}} />
    </>
  );
};
