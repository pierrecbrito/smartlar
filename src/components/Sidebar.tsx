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
  UserCheck,
  ChevronRight,
  Sparkles,
  ExternalLink,
  PhoneCall
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

  const mainNav = [
    {
      id: 'dashboard' as NavTab,
      label: 'Painel Geral',
      icon: LayoutDashboard,
      badge: 'KPIs',
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'novo-pedido' as NavTab,
      label: 'Novo Orçamento',
      icon: PlusCircle,
      highlight: true,
    },
    {
      id: 'pedidos' as NavTab,
      label: 'Gestão de Pedidos',
      icon: ClipboardList,
      badge: 'Fluxo',
      badgeColor: 'bg-blue-50 text-blue-700',
    },
    {
      id: 'agenda' as NavTab,
      label: 'Agenda de Instalações',
      icon: Calendar,
      badge: 'Técnicos',
      badgeColor: 'bg-purple-50 text-purple-700',
    },
  ];

  const cadastrosNav = [
    {
      id: 'clientes' as NavTab,
      label: 'Clientes & WhatsApp',
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
      {/* Backdrop Mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Workspace Brand Header */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center text-white shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-white tracking-tight truncate">
                  SmartLar
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Gestão & Instalações
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Grupo 1: Operações Principais */}
          <div>
            <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-300">
              Operações
            </span>
            <div className="mt-2 space-y-1">
              {mainNav.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                if (item.highlight) {
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/25 ring-2 ring-blue-400/30'
                          : 'bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-blue-400" />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[10px] bg-blue-500/30 px-1.5 py-0.5 rounded text-blue-200">
                        + Orçar
                      </span>
                    </button>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-800 text-slate-400 border border-slate-700/50">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grupo 2: Cadastros & Recursos */}
          <div>
            <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-300">
              Cadastros
            </span>
            <div className="mt-2 space-y-1">
              {cadastrosNav.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card Supabase Live Status no Sidebar */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                Supabase Backend
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isConfigured ? 'bg-emerald-500 shadow-xs shadow-emerald-500' : 'bg-amber-500 animate-pulse'
                }`}
              />
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              {isConfigured
                ? 'PostgreSQL 16 conectado com triggers e views ativas.'
                : 'Credenciais ausentes. Conecte sua instância.'}
            </p>
            <button
              type="button"
              onClick={onOpenConfig}
              className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              Ver configurações
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* User Card: Rafael (Proprietário) */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              RF
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">Rafael Matos</p>
              <p className="text-[10px] text-slate-400 truncate">Dono • SmartLar</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
