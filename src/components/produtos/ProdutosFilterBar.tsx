import React from 'react';
import { Plus, Search, RefreshCw } from 'lucide-react';

interface ProdutosFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  categorias: string[];
  selectedCat: string;
  onSelectCat: (category: string) => void;
  loading: boolean;
  onRefresh: () => void;
  onNewProduct: () => void;
}

export const ProdutosFilterBar: React.FC<ProdutosFilterBarProps> = ({
  search,
  onSearchChange,
  categorias,
  selectedCat,
  onSelectCat,
  loading,
  onRefresh,
  onNewProduct,
}) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase">
            CATÁLOGO & PREÇOS
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Catálogo de Equipamentos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Reajustes de preços não afetam orçamentos e pedidos já realizados
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200/80 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-2xl shadow-xs transition-colors cursor-pointer"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          </button>
          <button
            type="button"
            onClick={onNewProduct}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por equipamento ou descrição..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {categorias.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCat(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold capitalize whitespace-nowrap transition-all cursor-pointer ${
                selectedCat === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {cat === 'todas' ? 'Todas as categorias' : cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
