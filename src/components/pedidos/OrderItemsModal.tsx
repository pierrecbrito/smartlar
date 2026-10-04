import React from 'react';
import { ClipboardList, X, FileText } from 'lucide-react';
import { Pedido } from '../../types/database';
import { formatCurrency, formatOrderCode } from '../../lib/utils';
import { ModalPortal } from '../ModalPortal';

interface OrderItemsModalProps {
  pedido: Pedido | null;
  onClose: () => void;
  onGeneratePdf: (pedido: Pedido) => void;
}

export const OrderItemsModal: React.FC<OrderItemsModalProps> = ({ pedido, onClose, onGeneratePdf }) => {
  if (!pedido) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
          <div className="flex items-center justify-between px-6 py-4 bg-blue-600 border-b border-blue-700/60 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight">
                  Itens do Pedido
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

          <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
            <div className="divide-y divide-slate-100">
              {pedido.itens && pedido.itens.length > 0 ? (
                pedido.itens.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block text-sm">
                        {item.produto?.nome || 'Produto'}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        {item.quantidade}x a {formatCurrency(item.preco_unitario)}
                      </span>
                    </div>
                    <div className="font-extrabold text-slate-900 text-sm">
                      {formatCurrency(item.subtotal)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">Nenhum item vinculado.</p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-baseline justify-between">
              <span className="text-xs font-bold text-slate-500">Total Confirmado:</span>
              <span className="text-xl font-extrabold text-slate-900">
                {formatCurrency(pedido.valor_total)}
              </span>
            </div>

            {pedido.cliente && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGeneratePdf(pedido);
                }}
                className="w-full mt-3 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Gerar Proposta PDF / Enviar WhatsApp</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
