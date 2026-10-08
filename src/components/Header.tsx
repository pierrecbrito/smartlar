import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LogIn,
  LogOut,
  User,
  Shield,
  HelpCircle,
  ChevronDown,
  AlertCircle,
  Command,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { GlobalSearchModal } from './GlobalSearchModal';

interface HeaderProps {
  onOpenSidebar?: () => void;
  onOpenAuth?: () => void;
  onSelectOrder?: (pedidoId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuth,
  onSelectOrder,
}) => {
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Atalho global Ctrl+K / Cmd+K para abrir a paleta de busca
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
        setShowConfirmLogout(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  const handleLogout = async () => {
    try {
      await signOut();
      setProfileDropdownOpen(false);
      setShowConfirmLogout(false);
      showToast('info', 'Sessão encerrada com sucesso.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao sair';
      showToast('error', 'Falha ao encerrar sessão', msg);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#d8dde8]/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 border-b border-slate-300/80">
        {/* Barra de Busca Interativa (Aciona Command Palette) */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="w-full pl-11 pr-3 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm text-slate-400 hover:text-slate-600 hover:border-blue-400/60 focus:outline-none shadow-xs transition-all flex items-center justify-between text-left cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors absolute left-7 sm:left-9" />
              <span className="truncate">Buscar clientes, pedidos ou equipamentos...</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 group-hover:bg-blue-50 text-slate-500 group-hover:text-blue-700 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-slate-200/80 transition-colors shrink-0">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </button>
        </div>

        {/* Right Actions: User Profile com Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3" ref={dropdownRef}>
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileDropdownOpen((prev) => !prev);
                  setShowConfirmLogout(false);
                }}
                className={`flex items-center gap-2.5 bg-white border rounded-full p-1 pr-3 shadow-xs hover:border-slate-300 transition-all cursor-pointer ${
                  profileDropdownOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200/80'
                }`}
                title="Opções do usuário"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                  {user.email ? user.email.slice(0, 2).toUpperCase() : 'AD'}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <p className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                    {user.email?.split('@')[0] || 'Administrador'}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Online
                  </p>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform hidden sm:block ${
                    profileDropdownOpen ? 'rotate-180 text-blue-600' : ''
                  }`}
                />
              </button>

              {/* Menu Suspenso (Dropdown) */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-fade-in text-slate-800">
                  {/* Cabeçalho do Usuário */}
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {user.email}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        <Shield className="w-3 h-3 text-blue-600" />
                        Acesso Total
                      </span>
                    </div>
                  </div>

                  {/* Opções */}
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setSearchModalOpen(true);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Command className="w-4 h-4 text-slate-400" />
                        <span>Busca Rápida</span>
                      </div>
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Ctrl+K</span>
                    </button>

                    <div className="px-4 py-2 text-[11px] text-slate-400 flex items-center gap-2 border-t border-slate-100/60 mt-1">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>SmartLar v1.2 Pro • Supabase</span>
                    </div>
                  </div>

                  {/* Botão Sair com Confirmação Segura */}
                  <div className="border-t border-slate-100 pt-1 px-1">
                    {showConfirmLogout ? (
                      <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200/60 space-y-2">
                        <div className="flex items-start gap-2 text-rose-700 text-xs font-semibold">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>Tem certeza que deseja sair da conta?</span>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowConfirmLogout(false)}
                            className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            <LogOut className="w-3 h-3" />
                            Confirmar Saída
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowConfirmLogout(true)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Sair da Conta</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
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

      {/* Modal de Busca Universal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectOrder={onSelectOrder}
      />
    </>
  );
};
