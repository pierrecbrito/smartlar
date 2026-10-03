import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  ClipboardList,
  Calendar,
  Users,
  Package,
} from 'lucide-react';
import { NavTab } from './Navbar';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'novo-pedido' as NavTab, label: 'Novo Orçamento', icon: ShoppingBag },
    { id: 'pedidos' as NavTab, label: 'Pedidos', icon: ClipboardList },
    { id: 'agenda' as NavTab, label: 'Agenda', icon: Calendar },
    { id: 'clientes' as NavTab, label: 'Clientes', icon: Users },
    { id: 'produtos' as NavTab, label: 'Produtos', icon: Package },
  ];

  return (
    <nav
      aria-label="Navegação inferior mobile"
      className="lg:hidden fixed bottom-4 sm:bottom-6 inset-x-4 z-50 flex justify-center pointer-events-none pb-safe"
    >
      <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.12)] p-1.5 sm:p-2 flex items-center justify-center gap-1.5 sm:gap-3 max-w-sm sm:max-w-md w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              id={`bottom-nav-${item.id}`}
              type="button"
              onClick={() => onTabChange(item.id)}
              aria-label={item.label}
              title={item.label}
              className={`flex-1 py-2.5 sm:py-3 rounded-2xl transition-all cursor-pointer flex items-center justify-center relative touch-manipulation ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 scale-105'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 active:scale-95'
              }`}
            >
              <Icon className="w-5 h-5 sm:w-5 sm:h-5" />
              {isActive && (
                <span className="sr-only">(ativo)</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
