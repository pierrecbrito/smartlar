import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  ClipboardList,
  Calendar,
  Users,
  Package,
  ShieldCheck,
} from 'lucide-react';
import { NavTab } from './Navbar';

interface SidebarProps {
  currentTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  isOpen,
  onClose,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Deriva a aba ativa a partir do path atual da URL
  const currentPath = location.pathname.replace(/^\//, '') || 'dashboard';
  const activeTab: NavTab = (currentTab || currentPath.split('/')[0] || 'dashboard') as NavTab;

  const menuItems = [
    { id: 'dashboard' as NavTab, path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'novo-pedido' as NavTab, path: '/novo-pedido', label: 'Novo Pedido', icon: ShoppingBag },
    { id: 'pedidos' as NavTab, path: '/pedidos', label: 'Gestão de Pedidos', icon: ClipboardList },
    { id: 'agenda' as NavTab, path: '/agenda', label: 'Agenda & Instalações', icon: Calendar },
    { id: 'clientes' as NavTab, path: '/clientes', label: 'Clientes & Contatos', icon: Users },
    { id: 'produtos' as NavTab, path: '/produtos', label: 'Catálogo de Produtos', icon: Package },
  ];

  const handleSelect = (item: (typeof menuItems)[0]) => {
    navigate(item.path);
    if (onTabChange) onTabChange(item.id);
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
          {/* Top Brand: Logo + Name */}
          <div
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 px-6 py-6 border-b border-slate-100 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/25 shrink-0 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 text-white" />
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
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer relative group ${
                      isActive
                        ? 'bg-blue-50/80 text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {/* Active vertical pill indicator on left */}
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
        </div>
      </aside>
    </>
  );
};
