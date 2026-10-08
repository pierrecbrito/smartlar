import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Produto } from '../../types/database';
import { ModalPortal } from '../ModalPortal';
import { produtoSchema, ProdutoFormData } from '../../lib/schemas';

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
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: '',
      categoria: '',
      preco_unitario: 0,
      descricao: '',
      ativo: true,
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: ProdutoFormData) => {
    try {
      const { data: createdProduct, error } = await supabase
        .from('produtos')
        .insert({
          nome: data.nome.trim(),
          categoria: data.categoria.trim(),
          preco_unitario: data.preco_unitario,
          descricao: data.descricao?.trim() || null,
          ativo: true,
        })
        .select()
        .single();

      if (error) throw error;

      showToast('success', 'Produto cadastrado com sucesso!');
      onSuccess(createdProduct as Produto);
      reset();
      onClose();
    } catch (err: unknown) {
      console.error('Erro ao cadastrar produto:', err);
      const msg = err instanceof Error ? err.message : 'Falha ao salvar produto no banco.';
      showToast('error', 'Erro ao salvar produto', msg);
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
                  Adicione itens ao catálogo com validação rigorosa
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
              className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nome do Dispositivo *
              </label>
              <input
                type="text"
                placeholder="Ex: Câmera Speed Dome 4K"
                {...register('nome')}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none ${
                  errors.nome ? 'border-rose-300 ring-2 ring-rose-200/50' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {errors.nome && (
                <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.nome.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Categoria *
              </label>
              <input
                type="text"
                placeholder="Seguranca, Automacao, Iluminacao..."
                {...register('categoria')}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none ${
                  errors.categoria ? 'border-rose-300 ring-2 ring-rose-200/50' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {errors.categoria && (
                <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.categoria.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Preço Unitário (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 450.00"
                {...register('preco_unitario', { valueAsNumber: true })}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none font-mono ${
                  errors.preco_unitario ? 'border-rose-300 ring-2 ring-rose-200/50' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {errors.preco_unitario && (
                <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.preco_unitario.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Descrição Técnica
              </label>
              <textarea
                rows={2}
                placeholder="Especificações, conectividade..."
                {...register('descricao')}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  reset();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Cadastrando...' : 'Salvar Equipamento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
