import React, { useState, useEffect } from 'react';
import { Edit2, X, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Produto } from '../../types/database';
import { formatCurrency } from '../../lib/utils';
import { ModalPortal } from '../ModalPortal';

interface EditProductPriceModalProps {
  produto: Produto | null;
  onClose: () => void;
  onSuccess: (produtoId: string, novoPreco: number) => void;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

export const EditProductPriceModal: React.FC<EditProductPriceModalProps> = ({
  produto,
  onClose,
  onSuccess,
  showToast,
}) => {
  const [newPrice, setNewPrice] = useState(produto?.preco_unitario.toString() || '');
  const [savingPrice, setSavingPrice] = useState(false);

  useEffect(() => {
    if (produto) {
      setNewPrice(produto.preco_unitario.toString());
    }
  }, [produto]);

  if (!produto) return null;

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrice(true);
    try {
      const numPrice = parseFloat(newPrice.replace(',', '.'));
      if (isNaN(numPrice) || numPrice < 0) {
        throw new Error('Informe um preço válido.');
      }

      const { error } = await supabase
        .from('produtos')
        .update({ preco_unitario: numPrice })
        .eq('id', produto.id);

      if (error) throw error;

      showToast(
        'success',
        'Preço atualizado com sucesso!',
        `Novo valor: ${formatCurrency(numPrice)}. Pedidos anteriores mantêm o valor congelado.`
      );

      onSuccess(produto.id, numPrice);
      onClose();
    } catch (err: any) {
      console.error('Erro ao atualizar preço:', err);
      showToast('error', 'Falha ao atualizar preço', err.message);
    } finally {
      setSavingPrice(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
          <div className="flex items-center justify-between px-6 py-4 bg-blue-600 border-b border-blue-700/60 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight">
                  Editar Preço do Produto
                </h3>
                <p className="text-xs text-blue-100 font-medium">
                  Atualize o valor de catálogo
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSavePrice} className="p-6 space-y-4">
            <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl">
              <p className="font-bold text-slate-900 text-sm">{produto.nome}</p>
              <p className="text-[11px] text-slate-500 mt-1">
                💡 Atualizar o preço no catálogo não altera orçamentos ou pedidos já criados.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Novo Preço Unitário (R$) *
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Ex: 480.00"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-base font-extrabold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingPrice}
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {savingPrice ? 'Salvando...' : 'Salvar Preço'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
