import React from 'react';
import { Package, Edit2 } from 'lucide-react';
import { Produto } from '../../types/database';
import { formatCurrency } from '../../lib/utils';

interface ProdutosTableProps {
  produtos: Produto[];
  loading: boolean;
  onToggleAtivo: (produto: Produto) => void;
  onEditPrice: (produto: Produto) => void;
}

export const ProdutosTable: React.FC<ProdutosTableProps> = ({
  produtos,
  loading,
  onToggleAtivo,
  onEditPrice,
}) => {
  if (loading) {
    return (
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden p-6 space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-14 bg-slate-100/80 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (produtos.length === 0) {
    return (
      <div className="rounded-3xl bg-white border border-slate-200/80 p-12 text-center text-slate-400 shadow-xs">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
        <p className="text-sm font-semibold text-slate-600">Nenhum equipamento cadastrado com os critérios.</p>
      </div>
    );
  }

  return (
    <>
      {/* LISTAGEM MOBILE: CARDS VERTICAIS (100% LARGURA, SEM OVERFLOW) */}
      <div className="md:hidden space-y-3">
        {produtos.map((p) => (
          <div
            key={p.id}
            className={`bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs space-y-3 ${
              !p.ativo ? 'opacity-75 bg-slate-50/40' : ''
            }`}
          >
            {/* Top: Nome e Status */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 text-sm leading-snug">
                  {p.nome}
                </h4>
              </div>

              <button
                type="button"
                onClick={() => onToggleAtivo(p)}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  p.ativo
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                }`}
                title={p.ativo ? 'Clique para desativar' : 'Clique para ativar'}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${p.ativo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                <span>{p.ativo ? 'Ativo' : 'Inativo'}</span>
              </button>
            </div>

            {/* Descrição */}
            {p.descricao && (
              <p className="text-xs text-slate-500 leading-relaxed">
                {p.descricao}
              </p>
            )}

            {/* Categoria e Preço */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80">
                {p.categoria}
              </span>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Preço Unitário</span>
                <span className="font-extrabold text-slate-900 text-sm font-mono">
                  {formatCurrency(p.preco_unitario)}
                </span>
              </div>
            </div>

            {/* Ação: Editar Preço */}
            <button
              type="button"
              onClick={() => onEditPrice(p)}
              className="w-full py-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold rounded-2xl border border-slate-200 hover:border-blue-200 text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Editar Preço</span>
            </button>
          </div>
        ))}
      </div>

      {/* LISTAGEM DESKTOP: TABELA HORIZONTAL COMPLETA */}
      <div className="hidden md:block rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider divide-x divide-slate-100">
                <th className="py-4 px-4 w-14 text-center">#</th>
                <th className="py-4 px-6 w-1/4">Produto / Equipamento</th>
                <th className="py-4 px-6">Descrição</th>
                <th className="py-4 px-4 whitespace-nowrap">Categoria</th>
                <th className="py-4 px-5 text-right whitespace-nowrap">Preço Unitário</th>
                <th className="py-4 px-4 text-center whitespace-nowrap">Status</th>
                <th className="py-4 px-6 text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {produtos.map((p, index) => (
                <tr
                  key={p.id}
                  className={`hover:bg-blue-50/30 transition-colors group divide-x divide-slate-100 ${
                    !p.ativo ? 'bg-slate-50/40 opacity-70' : ''
                  }`}
                >
                  {/* Número / Posição vertical */}
                  <td className="py-4 px-4 text-center font-mono text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                    {String(index + 1).padStart(2, '0')}
                  </td>

                  {/* Nome do Produto */}
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                      {p.nome}
                    </p>
                  </td>

                  {/* Descrição */}
                  <td className="py-4 px-6">
                    {p.descricao ? (
                      <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                        {p.descricao}
                      </p>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Sem descrição</span>
                    )}
                  </td>

                  {/* Categoria */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="text-[10px] uppercase font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80">
                      {p.categoria}
                    </span>
                  </td>

                  {/* Preço Unitário */}
                  <td className="py-4 px-5 text-right whitespace-nowrap">
                    <span className="font-extrabold text-slate-900 text-sm font-mono">
                      {formatCurrency(p.preco_unitario)}
                    </span>
                  </td>

                  {/* Status Ativo/Inativo */}
                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onToggleAtivo(p)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        p.ativo
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                      }`}
                      title={p.ativo ? 'Clique para desativar produto' : 'Clique para ativar produto'}
                    >
                      {p.ativo ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Ativo</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span>Inativo</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Ações */}
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onEditPrice(p)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 rounded-xl transition-all cursor-pointer shadow-xs"
                      title="Editar Preço"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar Preço</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rodapé Informativo */}
        <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Mostrando <b>{produtos.length}</b> {produtos.length === 1 ? 'produto cadastrado' : 'produtos cadastrados'}
          </span>
          <span className="text-[11px] text-slate-400">
            Snapshot de Preço: alterações de valor não afetam pedidos passados
          </span>
        </div>
      </div>
    </>
  );
};
