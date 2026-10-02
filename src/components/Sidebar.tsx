import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  Calendar,
  Users,
  Package,
  ShieldCheck,
  Database,
  Sparkles,
  ChevronRight,
  HelpCircle,
  Bot
} from 'lucide-react';
import { NavTab } from './Navbar';
import { getSupabaseConfig } from '../lib/supabase';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenConfig: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  isOpen,
  onClose,
  onOpenConfig,
}) => {
  const { isConfigured } = getSupabaseConfig();

  const menuItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'novo-pedido' as NavTab,
      label: 'Novo Pedido',
      icon: PlusCircle,
      badge: '+ Orçar',
    },
    {
      id: 'pedidos' as NavTab,
      label: 'Gestão de Pedidos',
      icon: ClipboardList,
    },
    {
      id: 'agenda' as NavTab,
      label: 'Timeline & Agenda',
      icon: Calendar,
    },
  ];

  const cadastroItems = [
    {
      id: 'clientes' as NavTab,
      label: 'Clientes',
      icon: Users,
    },
    {
      id: 'produtos' as NavTab,
      label: 'Catálogo de Produtos',
      icon: Package,
    },
  ];

  const handleSelect = (tab: NavTab) => {
    onTabChange(tab);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-60 bg-[#0d1017] text-slate-300 flex flex-col border-r border-white/[0.06] transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Aivora-style */}
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-purple-500/20 flex items-center justify-center text-white shrink-0">
              <div className="w-full h-full bg-[#0d1017] rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-base text-white tracking-tight flex items-center gap-1.5">
                SmartLar
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  AI
                </span>
              </span>
              <p className="text-[10px] text-slate-400 truncate">
                Automação Residencial
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          {/* MENU */}
          <div>
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              MENU
            </span>
            <div className="mt-2 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-white/[0.08] text-white font-semibold shadow-xs border-l-2 border-indigo-400 pl-2.5'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CADASTROS */}
          <div>
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              CADASTROS
            </span>
            <div className="mt-2 space-y-1">
              {cadastroItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-white/[0.08] text-white font-semibold shadow-xs border-l-2 border-indigo-400 pl-2.5'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card Inferior: Ask SmartLar / Aivora Bot Style */}
        <div className="p-3.5 border-t border-white/[0.06] space-y-3">
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-indigo-950/40 to-purple-950/40 border border-purple-500/20 text-center space-y-2 relative overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 mx-auto flex items-center justify-center text-white shadow-md shadow-purple-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Ask SmartLar</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Insights em tempo real com n8n e Postgres
              </p>
            </div>
            <button
              onClick={onOpenConfig}
              className="w-full py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-bold text-indigo-200 border border-white/10 transition-colors"
            >
              {isConfigured ? 'Banco Conectado' : 'Conectar Banco'}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
