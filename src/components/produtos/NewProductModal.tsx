import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Produto } from '../../types/database';
import { ModalPortal } from '../ModalPortal';

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProduct: Produto) => void;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

export const NewProductModal: React.FC<NewProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  showToast,
}) => {
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [preco, setPreco] = useState('');
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const precoNum = parseFloat(preco.replace(',', '.'));
      if (isNaN(precoNum) || precoNum < 0) {
        throw new Error('Informe um preço unitário válido.');
      }

      const { data, error } = await supabase
        .from('produtos')
        .insert({
          nome: nome.trim(),
          categoria: categoria.trim(),
          preco_unitario: precoNum,
          descricao: descricao.trim() || null,
          ativo: true,
        })
        .select()
        .single();

      if (error) throw error;

      showToast('success', 'Produto cadastrado com sucesso!');
      onSuccess(data);
      setNome('');
      setCategoria('');
      setPreco('');
      setDescricao('');
      onClose();
    } catch (err: any) {
      console.error('Erro ao cadastrar produto:', err);
      showToast('error', 'Erro ao salvar produto', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
          <div className="flex items-center justify-between px-6 py-4 bg-blue-600 border-b border-blue-700/60 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight">
                  Cadastrar Novo Equipamento
                </h3>
                <p className="text-xs text-blue-100 font-medium">
                  Adicione itens ao catálogo da SmartLar
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

          <form onSubmit={handleCreate} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nome do Dispositivo *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Câmera Speed Dome 4K"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Categoria *
              </label>
              <input
                type="text"
                required
                placeholder="Seguranca, Automacao, Iluminacao..."
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Preço Unitário (R$) *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 450.00"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Descrição Técnica
              </label>
              <textarea
                rows={2}
                placeholder="Especificações, conectividade..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Cadastrando...' : 'Salvar Equipamento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
