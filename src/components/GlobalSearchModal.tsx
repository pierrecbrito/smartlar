import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  ClipboardList,
  Users,
  Package,
  ArrowRight,
  Command,
  CornerDownLeft,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ModalPortal } from './ModalPortal';
import { formatCurrency, formatOrderCode, STATUS_CONFIG } from '../lib/utils';
import { StatusPedido } from '../types/database';

interface SearchResultItem {
  id: string;
  type: 'pedido' | 'cliente' | 'produto';
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  url: string;
  meta?: any;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder?: (pedidoId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectOrder,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Foco automático ao abrir
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Busca em tempo real com debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const cleanQuery = query.trim().toLowerCase();
        const searchNumber = query.replace(/\D/g, '');

        // 1. Busca Pedidos
        const pedidosPromise = supabase
          .from('pedidos')
          .select('id, numero_pedido, status, valor_total, cliente:clientes(nome, telefone)')
          .limit(5);

        // 2. Busca Clientes
        const clientesPromise = supabase
          .from('clientes')
          .select('id, nome, telefone, cidade, bairro')
          .or(`nome.ilike.%${cleanQuery}%,telefone.ilike.%${cleanQuery}%,bairro.ilike.%${cleanQuery}%`)
          .limit(5);

        // 3. Busca Produtos
        const produtosPromise = supabase
          .from('produtos')
          .select('id, nome, categoria, preco_unitario')
          .ilike('nome', `%${cleanQuery}%`)
          .limit(5);

        const [pedidosRes, clientesRes, produtosRes] = await Promise.all([
          pedidosPromise,
          clientesPromise,
          produtosPromise,
        ]);

        const items: SearchResultItem[] = [];

        // Filtra e formata pedidos
        if (pedidosRes.data) {
          pedidosRes.data.forEach((p: any) => {
            const clienteNome = p.cliente?.nome || '';
            const matchNum = searchNumber && String(p.numero_pedido).includes(searchNumber);
            const matchNome = clienteNome.toLowerCase().includes(cleanQuery);
            const matchStatus = p.status.toLowerCase().includes(cleanQuery);

            if (matchNum || matchNome || matchStatus || p.id.includes(cleanQuery)) {
              const statusCfg = STATUS_CONFIG[p.status as StatusPedido];
              items.push({
                id: p.id,
                type: 'pedido',
                title: `Pedido ${formatOrderCode(p)} - ${clienteNome || 'Sem cliente'}`,
                subtitle: `${formatCurrency(p.valor_total || 0)} • ${statusCfg?.label || p.status}`,
                badge: statusCfg?.label || p.status,
                badgeColor: statusCfg ? `${statusCfg.bg} ${statusCfg.text}` : 'bg-slate-100 text-slate-700',
                url: `/pedidos?id=${p.id}`,
                meta: p,
              });
            }
          });
        }

        // Formata Clientes
        if (clientesRes.data) {
          clientesRes.data.forEach((c: any) => {
            items.push({
              id: c.id,
              type: 'cliente',
              title: c.nome,
              subtitle: `${c.telefone} • ${c.bairro ? `${c.bairro}, ` : ''}${c.cidade || 'Recife'}`,
              badge: 'Cliente',
              badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
              url: `/clientes`,
              meta: c,
            });
          });
        }

        // Formata Produtos
        if (produtosRes.data) {
          produtosRes.data.forEach((prod: any) => {
            items.push({
              id: prod.id,
              type: 'produto',
              title: prod.nome,
              subtitle: `${prod.categoria} • ${formatCurrency(prod.preco_unitario)}`,
              badge: 'Equipamento',
              badgeColor: 'bg-purple-50 text-purple-700 border border-purple-200/60',
              url: `/produtos`,
              meta: prod,
            });
          });
        }

        setResults(items);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Erro na busca global:', err);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  // Teclado: Navegação com setas e Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelectItem(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelectItem = (item: SearchResultItem) => {
    onClose();
    if (item.type === 'pedido' && onSelectOrder) {
      onSelectOrder(item.id);
    }
    navigate(item.url);
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200/90 flex flex-col max-h-[80vh] transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Input Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <Search className="w-5 h-5 text-blue-600 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar cliente, número de pedido ou produto..."
              className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-slate-400 bg-white border border-slate-200 rounded-lg shadow-2xs">
              ESC
            </kbd>
          </div>

          {/* Lista de Resultados */}
          <div className="overflow-y-auto p-2 divide-y divide-slate-100/60 flex-1">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Pesquisando no sistema...
              </div>
            ) : results.length > 0 ? (
              results.map((item, index) => {
                const isSelected = index === selectedIndex;
                const Icon =
                  item.type === 'pedido'
                    ? ClipboardList
                    : item.type === 'cliente'
                    ? Users
                    : Package;

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/80 text-blue-900 shadow-2xs'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold truncate">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <ArrowRight
                        className={`w-4 h-4 transition-transform ${
                          isSelected
                            ? 'text-blue-600 translate-x-0.5'
                            : 'text-slate-300'
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            ) : query.trim() ? (
              <div className="p-8 text-center text-slate-400">
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">
                  Nenhum resultado encontrado para "{query}"
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Verifique se o nome, número ou telefone foi digitado corretamente.
                </p>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400">
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 mb-2">
                  <Command className="w-4 h-4 text-blue-600" />
                  <span>Busca Universal SmartLar</span>
                </div>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Digite para buscar clientes, propostas, pedidos e equipamentos do catálogo.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-400">
                  <span className="px-2 py-1 bg-slate-100 rounded-lg">Ex: Marina</span>
                  <span className="px-2 py-1 bg-slate-100 rounded-lg">Ex: #0001</span>
                  <span className="px-2 py-1 bg-slate-100 rounded-lg">Ex: Câmera</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer com atalhos */}
          <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <CornerDownLeft className="w-3 h-3 text-slate-500" />
              <span>Pressione Enter para selecionar</span>
            </span>
            <span className="hidden sm:inline">Use ↑ ↓ para navegar</span>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
