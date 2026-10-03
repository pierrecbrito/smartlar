import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  ClipboardList,
  Calendar,
  Users,
  Package,
  Settings,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  HelpCircle,
  Database
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
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'novo-pedido' as NavTab, label: 'Novo Pedido', icon: ShoppingBag },
    { id: 'pedidos' as NavTab, label: 'Gestão de Pedidos', icon: ClipboardList },
    { id: 'agenda' as NavTab, label: 'Agenda & Instalações', icon: Calendar },
    { id: 'clientes' as NavTab, label: 'Clientes & Contatos', icon: Users },
    { id: 'produtos' as NavTab, label: 'Catálogo de Produtos', icon: Package },
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
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Akino Style Clean White Sidebar (w-64) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white text-slate-700 flex flex-col justify-between border-r border-slate-200/80 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Top Brand: Logo + Name (Akino style) */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-[#090d16] border border-slate-700/50 flex items-center justify-center p-1 shadow-md shadow-blue-900/10 overflow-hidden shrink-0">
              <img src="/logo.png" alt="SmartLar" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-slate-900 tracking-tight leading-none">
                SMART<span className="text-blue-600">LAR</span>
              </h1>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block mt-1">
                Automação & Segurança
              </span>
            </div>
          </div>

          {/* Navigation Section: MENU */}
          <div className="px-4 py-5">
            <span className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase px-3 block mb-3">
              MENU
            </span>
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer relative group ${
                      isActive
                        ? 'bg-blue-50/80 text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {/* Active vertical pill indicator on left (Exact Akino style) */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-blue-600 rounded-r-full shadow-sm" />
                    )}

                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Navigation Section: GERAL */}
          <div className="px-4 pb-4">
            <span className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase px-3 block mb-3">
              GERAL
            </span>
            <nav className="space-y-1">
              <button
                onClick={onOpenConfig}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-slate-400" />
                  <span>Configurações</span>
                </div>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConfigured ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                  }`}
                />
              </button>
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
};
