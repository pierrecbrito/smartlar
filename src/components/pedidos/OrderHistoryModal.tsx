import React, { useEffect, useState } from 'react';
import { History, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Pedido, HistoricoStatus } from '../../types/database';
import { formatDateTime, formatOrderCode, STATUS_CONFIG } from '../../lib/utils';
import { ModalPortal } from '../ModalPortal';

interface OrderHistoryModalProps {
  pedido: Pedido | null;
  onClose: () => void;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({ pedido, onClose, showToast }) => {
  const [historyLogs, setHistoryLogs] = useState<HistoricoStatus[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (pedido) {
      loadHistory(pedido.id);
    }
  }, [pedido]);

  const loadHistory = async (pedidoId: string) => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('historico_status')
        .select('*')
        .eq('pedido_id', pedidoId)
        .order('alterado_em', { ascending: true });

      if (error) throw error;
      setHistoryLogs(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar histórico:', err);
      showToast('error', 'Erro ao carregar histórico', err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!pedido) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
          <div className="flex items-center justify-between px-6 py-4 bg-blue-600 border-b border-blue-700/60 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight">
                  Histórico do Pedido
                </h3>
                <p className="text-xs text-blue-100 font-medium">
                  {formatOrderCode(pedido)}
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

          <div className="p-6 max-h-[400px] overflow-y-auto">
            {loadingHistory ? (
              <div className="py-8 text-center text-xs text-slate-400">Carregando histórico...</div>
            ) : historyLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Nenhum registro de alteração.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {historyLogs.map((log) => (
                  <div key={log.id} className="relative">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                    <div className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">
                          {log.status_anterior ? (
                            <>
                              <span className="text-slate-500">{STATUS_CONFIG[log.status_anterior].label}</span>
                              <span className="text-slate-400 mx-1">➔</span>
                            </>
                          ) : (
                            <span className="text-slate-500">Criação inicial: </span>
                          )}
                          <span className="text-blue-600">{STATUS_CONFIG[log.status_novo].label}</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatDateTime(log.alterado_em)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
