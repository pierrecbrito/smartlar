import React from 'react';
import { Search, X, FolderKanban, List } from 'lucide-react';

interface PedidosFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  viewMode: 'kanban' | 'lista';
  onViewModeChange: (mode: 'kanban' | 'lista') => void;
  selectedStatusFilter: string;
  onSelectStatusFilter: (status: string) => void;
}

const STATUS_OPTIONS = [
  { id: 'todos', label: 'Todos' },
  { id: 'orcamento', label: 'Orçamentos' },
  { id: 'aprovado', label: 'Aprovados' },
  { id: 'agendado', label: 'Agendados' },
  { id: 'em_andamento', label: 'Em Andamento' },
  { id: 'concluido', label: 'Concluídos' },
  { id: 'cancelado', label: 'Cancelados' },
];

export const PedidosFilterBar: React.FC<PedidosFilterBarProps> = ({
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  selectedStatusFilter,
  onSelectStatusFilter,
}) => {
  return (
    <div className="space-y-4">
      {/* Header com Título e Controles Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase">
            FLUXO OPERACIONAL
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Gestão de Pedidos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Acompanhamento e controle de status dos atendimentos
          </p>
        </div>

        {/* Controles de Busca e Alternância de Visualização */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-64 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por cliente, número, técnico..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="inline-flex bg-slate-100 p-1 rounded-2xl border border-slate-200/70">
            <button
              type="button"
              onClick={() => onViewModeChange('kanban')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('lista')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'lista'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
          </div>
        </div>
      </div>

      {/* Se estiver no modo lista, exibe os filtros de status pills */}
      {viewMode === 'lista' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {STATUS_OPTIONS.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => onSelectStatusFilter(st.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedStatusFilter === st.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
