import React, { useState } from 'react';
import {
  Search,
  X,
  FolderKanban,
  List,
  SlidersHorizontal,
  User,
  DollarSign,
} from 'lucide-react';
import { Cliente, Tecnico } from '../../types/database';
import {
  PedidosFilterState,
  VALOR_PRESET_OPTIONS,
  ValorPreset,
  countActiveFilters,
} from '../../types/pedidosFilters';
import { PedidosFilterDrawer } from './PedidosFilterDrawer';
import { PedidosActiveFiltersBar } from './PedidosActiveFiltersBar';

interface PedidosFilterBarProps {
  filters: PedidosFilterState;
  onFilterChange: (updater: Partial<PedidosFilterState>) => void;
  onResetFilters: () => void;
  clientes: Cliente[];
  tecnicos: Tecnico[];
  clientOrderCounts: Record<string, number>;
  viewMode: 'kanban' | 'lista';
  onViewModeChange: (mode: 'kanban' | 'lista') => void;
  selectedStatusFilter: string;
  onSelectStatusFilter: (status: string) => void;
  filteredCount: number;
  totalCount: number;
  totalValue: number;
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
  filters,
  onFilterChange,
  onResetFilters,
  clientes,
  tecnicos,
  clientOrderCounts,
  viewMode,
  onViewModeChange,
  selectedStatusFilter,
  onSelectStatusFilter,
  filteredCount,
  totalCount,
  totalValue,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const activeCount = countActiveFilters(filters);

  // Clientes ordenados por número de pedidos e nome
  const sortedClientes = [...clientes].sort((a, b) => {
    const countA = clientOrderCounts[a.id] || 0;
    const countB = clientOrderCounts[b.id] || 0;
    if (countB !== countA) return countB - countA;
    return a.nome.localeCompare(b.nome);
  });

  const handleSelectValorPreset = (preset: ValorPreset) => {
    const opt = VALOR_PRESET_OPTIONS.find((o) => o.id === preset);
    if (opt) {
      onFilterChange({
        valorPreset: preset,
        valorMin: opt.min,
        valorMax: opt.max,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header com Título e Controles Topo */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase">
            FLUXO OPERACIONAL
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Gestão de Pedidos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Acompanhamento e controle de status dos atendimentos com filtros inteligentes
          </p>
        </div>

        {/* Controles de Busca, Botão de Filtros e Alternância de Visualização */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Campo de Busca Geral */}
          <div className="relative flex-1 sm:w-64 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              placeholder="Buscar por cliente, número, técnico..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs transition-all"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => onFilterChange({ search: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Botão de Filtros Avançados */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen((prev) => !prev)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
              isDrawerOpen || activeCount > 0
                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
                : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
            <span>Filtros</span>
            {activeCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>

          {/* Switcher Kanban / Lista */}
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

      {/* Barra de Filtros Rápidos Diretos (Clientes e Valores) */}
      <div className="flex flex-wrap items-center gap-3 bg-white/70 backdrop-blur-xs border border-slate-200/70 rounded-2xl p-2.5 shadow-2xs">
        {/* Seletor Rápido de Cliente */}
        <div className="flex items-center gap-2 min-w-[210px]">
          <div className="flex items-center gap-1 text-slate-500 text-xs font-bold shrink-0">
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Cliente:</span>
          </div>
          <select
            value={filters.clienteId}
            onChange={(e) => onFilterChange({ clienteId: e.target.value })}
            className={`w-full py-1.5 px-2.5 text-xs rounded-xl border font-semibold transition-all cursor-pointer ${
              filters.clienteId !== 'todos'
                ? 'bg-blue-50 border-blue-300 text-blue-800'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
            }`}
          >
            <option value="todos">Todos os Clientes</option>
            {sortedClientes.map((c) => {
              const count = clientOrderCounts[c.id] || 0;
              return (
                <option key={c.id} value={c.id}>
                  {c.nome} {count > 0 ? `(${count})` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Separador vertical em telas médias+ */}
        <div className="hidden md:block w-px h-6 bg-slate-200" />

        {/* Pílulas de Faixa de Valores */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none flex-1">
          <div className="flex items-center gap-1 text-slate-500 text-xs font-bold shrink-0 mr-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Valor:</span>
          </div>

          {VALOR_PRESET_OPTIONS.map((opt) => {
            const isSelected =
              filters.valorPreset === opt.id &&
              filters.valorMin === opt.min &&
              filters.valorMax === opt.max;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectValorPreset(opt.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
                }`}
              >
                {opt.label}
              </button>
            );
          })}

          {/* Indicador de valor customizado */}
          {filters.valorPreset === 'custom' && (
            <span className="px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap bg-emerald-100 text-emerald-800 border border-emerald-300">
              Personalizado
            </span>
          )}
        </div>
      </div>

      {/* Painel Expansível de Filtros Avançados */}
      <PedidosFilterDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        filters={filters}
        clientes={clientes}
        tecnicos={tecnicos}
        clientOrderCounts={clientOrderCounts}
        onFilterChange={onFilterChange}
        onResetFilters={onResetFilters}
      />

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

      {/* Barra de Filtros Ativos e Resumo Numérico/Financeiro */}
      <PedidosActiveFiltersBar
        filters={filters}
        clientes={clientes}
        tecnicos={tecnicos}
        filteredCount={filteredCount}
        totalCount={totalCount}
        totalValue={totalValue}
        onFilterChange={onFilterChange}
        onResetFilters={onResetFilters}
      />
    </div>
  );
};
