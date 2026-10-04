import React, { useEffect, useState } from 'react';
import { X, ClipboardList } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Cliente, Pedido } from '../../types/database';
import { formatCurrency, formatDateTime, formatOrderCode, formatPhone, STATUS_CONFIG } from '../../lib/utils';
import { ModalPortal } from '../ModalPortal';

interface ClientOrdersModalProps {
  cliente: Cliente | null;
  onClose: () => void;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

export const ClientOrdersModal: React.FC<ClientOrdersModalProps> = ({ cliente, onClose, showToast }) => {
  const [clientOrders, setClientOrders] = useState<Pedido[]>([]);
  const [loadingClientOrders, setLoadingClientOrders] = useState(false);

  useEffect(() => {
    if (cliente) {
      handleOpenClientOrders(cliente);
    }
  }, [cliente]);

  const handleOpenClientOrders = async (cliente: Cliente) => {
    setLoadingClientOrders(true);
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          tecnico:tecnicos(nome),
          itens:itens_pedido(*, produto:produtos(nome))
        `)
        .eq('cliente_id', cliente.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientOrders(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar pedidos do cliente:', err);
      showToast('error', 'Erro ao carregar histórico do cliente', err.message);
    } finally {
      setLoadingClientOrders(false);
    }
  };

  if (!cliente) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
          <div className="flex items-center justify-between px-6 py-4 bg-blue-600 border-b border-blue-700/60 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight">
                  Histórico de Pedidos
                </h3>
                <p className="text-xs text-blue-100 font-medium">
                  {cliente.nome} • {formatPhone(cliente.telefone)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 max-h-[480px] overflow-y-auto space-y-4">
            {loadingClientOrders ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                Carregando pedidos...
              </div>
            ) : clientOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold text-slate-600">Nenhum pedido encontrado para este cliente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clientOrders.map((pedido) => {
                  const st = STATUS_CONFIG[pedido.status];
                  return (
                    <div
                      key={pedido.id}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-blue-50/30 transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            {formatOrderCode(pedido)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.bg} ${st.text} ${st.border}`}
                          >
                            {st.label}
                          </span>
                        </div>
                        <span className="text-sm font-extrabold text-slate-900">
                          {formatCurrency(pedido.valor_total)}
                        </span>
                      </div>

                      {pedido.itens && pedido.itens.length > 0 && (
                        <div className="text-xs text-slate-600 divide-y divide-slate-100 bg-white p-2.5 rounded-xl border border-slate-200/60">
                          {pedido.itens.map((it) => (
                            <div key={it.id} className="py-1 flex justify-between">
                              <span>{it.quantidade}x {it.produto?.nome || 'Produto'}</span>
                              <span className="font-bold text-slate-900">{formatCurrency(it.subtotal)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>Criado em {formatDateTime(pedido.created_at)}</span>
                        {pedido.tecnico?.nome && (
                          <span className="text-slate-600 font-medium">Técnico: {pedido.tecnico.nome}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
