import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  ClipboardList,
  Calendar,
  Users,
  Package,
  ShieldCheck,
  Settings,
  LogOut,
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

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'novo-pedido' as NavTab, label: 'Novo Pedido', icon: ShoppingBag },
    { id: 'pedidos' as NavTab, label: 'Gestão de Pedidos', icon: ClipboardList },
    { id: 'agenda' as NavTab, label: 'Agenda & Instalações', icon: Calendar },
    { id: 'clientes' as NavTab, label: 'Clientes', icon: Users },
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
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Slim Dark Icon Rail (Matching the uploaded iPad UI) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-20 bg-[#0e131f] text-slate-400 flex flex-col items-center justify-between py-5 border-r border-slate-800/80 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Brand Logo */}
        <div className="flex flex-col items-center gap-6 w-full">
          <button
            onClick={() => handleSelect('dashboard')}
            className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 hover:scale-105 transition-transform"
            title="SmartLar PRO"
          >
            <ShieldCheck className="w-5 h-5 text-white" />
          </button>

          {/* Icon Navigation with Left Notch */}
          <nav className="flex flex-col items-center gap-2 w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <div key={item.id} className="relative w-full flex items-center justify-center py-1">
                  {/* Active White Vertical Pill Notch (Exact detail from screenshot!) */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-white rounded-r-full shadow-sm" />
                  )}

                  <button
                    onClick={() => handleSelect(item.id)}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all group ${
                      isActive
                        ? 'bg-white/10 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5" />

                    {/* Tooltip Hover no Desktop */}
                    <span className="fixed left-20 px-2.5 py-1 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 ml-2">
                      {item.label}
                    </span>
                  </button>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions: Settings / DB Config & Status */}
        <div className="flex flex-col items-center gap-3 w-full pt-4 border-t border-slate-800/80">
          <button
            onClick={onOpenConfig}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors relative group"
            title="Configurações Supabase"
          >
            <Settings className="w-5 h-5" />
            <span
              className={`w-2 h-2 rounded-full absolute top-2 right-2 ${
                isConfigured ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="fixed left-20 px-2.5 py-1 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 ml-2">
              Configurações do Banco
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};
