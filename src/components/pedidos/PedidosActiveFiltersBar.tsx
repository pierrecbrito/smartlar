import React from 'react';
import { X, RotateCcw, Filter, DollarSign, User, Calendar, Wrench, ArrowUpDown } from 'lucide-react';
import { Cliente, Tecnico } from '../../types/database';
import {
  PedidosFilterState,
  VALOR_PRESET_OPTIONS,
  countActiveFilters,
} from '../../types/pedidosFilters';
import { formatCurrency } from '../../lib/utils';

interface PedidosActiveFiltersBarProps {
  filters: PedidosFilterState;
  clientes: Cliente[];
  tecnicos: Tecnico[];
  filteredCount: number;
  totalCount: number;
  totalValue: number;
  onFilterChange: (updater: Partial<PedidosFilterState>) => void;
  onResetFilters: () => void;
}

export const PedidosActiveFiltersBar: React.FC<PedidosActiveFiltersBarProps> = ({
  filters,
  clientes,
  tecnicos,
  filteredCount,
  totalCount,
  totalValue,
  onFilterChange,
  onResetFilters,
}) => {
  const activeCount = countActiveFilters(filters);
  if (activeCount === 0) {
    return (
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 py-0.5">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Total:</span>
          <span>
            {totalCount} {totalCount === 1 ? 'pedido' : 'pedidos'}
          </span>
          <span className="text-slate-300">•</span>
          <span className="font-bold text-slate-900">{formatCurrency(totalValue)}</span>
        </div>
      </div>
    );
  }

  // Obter labels descritivos para os chips ativos
  const selectedClienteObj = clientes.find((c) => c.id === filters.clienteId);
  const selectedTecnicoObj = tecnicos.find((t) => t.id === filters.tecnicoId);

  // Descrição do filtro de valor
  let valorLabel = '';
  if (filters.valorPreset !== 'todos' && filters.valorPreset !== 'custom') {
    const opt = VALOR_PRESET_OPTIONS.find((o) => o.id === filters.valorPreset);
    valorLabel = opt ? opt.label : '';
  } else if (filters.valorMin !== '' || filters.valorMax !== '') {
    if (filters.valorMin !== '' && filters.valorMax !== '') {
      valorLabel = `${formatCurrency(Number(filters.valorMin))} a ${formatCurrency(Number(filters.valorMax))}`;
    } else if (filters.valorMin !== '') {
      valorLabel = `A partir de ${formatCurrency(Number(filters.valorMin))}`;
    } else if (filters.valorMax !== '') {
      valorLabel = `Até ${formatCurrency(Number(filters.valorMax))}`;
    }
  }

  const periodoLabels: Record<string, string> = {
    hoje: 'Hoje',
    '7dias': 'Últimos 7 dias',
    este_mes: 'Este mês',
    '30dias': 'Últimos 30 dias',
  };

  const sortLabels: Record<string, string> = {
    antigos: 'Mais antigos',
    maior_valor: 'Maior valor',
    menor_valor: 'Menor valor',
    cliente_az: 'Cliente (A-Z)',
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/90 border border-slate-200/80 rounded-2xl p-2.5 sm:px-3.5 sm:py-2.5 shadow-2xs">
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filtros ativos ({activeCount}):</span>
        </div>

        {/* Chip: Cliente */}
        {filters.clienteId !== 'todos' && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-blue-200 text-blue-900 shadow-2xs animate-fade-in">
            <User className="w-3 h-3 text-blue-600" />
            <span>Cliente: {selectedClienteObj?.nome || 'Selecionado'}</span>
            <button
              type="button"
              onClick={() => onFilterChange({ clienteId: 'todos' })}
              className="hover:text-rose-600 p-0.5 rounded-full cursor-pointer transition-colors"
              title="Remover filtro de cliente"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {/* Chip: Valor */}
        {valorLabel && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-emerald-200 text-emerald-900 shadow-2xs animate-fade-in">
            <DollarSign className="w-3 h-3 text-emerald-600" />
            <span>Valor: {valorLabel}</span>
            <button
              type="button"
              onClick={() =>
                onFilterChange({
                  valorPreset: 'todos',
                  valorMin: '',
                  valorMax: '',
                })
              }
              className="hover:text-rose-600 p-0.5 rounded-full cursor-pointer transition-colors"
              title="Remover filtro de valor"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {/* Chip: Técnico */}
        {filters.tecnicoId !== 'todos' && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-purple-200 text-purple-900 shadow-2xs animate-fade-in">
            <Wrench className="w-3 h-3 text-purple-600" />
            <span>
              Técnico:{' '}
              {filters.tecnicoId === 'sem_tecnico'
                ? 'Sem técnico'
                : selectedTecnicoObj?.nome || 'Selecionado'}
            </span>
            <button
              type="button"
              onClick={() => onFilterChange({ tecnicoId: 'todos' })}
              className="hover:text-rose-600 p-0.5 rounded-full cursor-pointer transition-colors"
              title="Remover filtro de técnico"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {/* Chip: Período */}
        {filters.periodo !== 'todos' && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-amber-200 text-amber-900 shadow-2xs animate-fade-in">
            <Calendar className="w-3 h-3 text-amber-600" />
            <span>Período: {periodoLabels[filters.periodo]}</span>
            <button
              type="button"
              onClick={() => onFilterChange({ periodo: 'todos' })}
              className="hover:text-rose-600 p-0.5 rounded-full cursor-pointer transition-colors"
              title="Remover filtro de período"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {/* Chip: Ordenação customizada */}
        {filters.sortBy !== 'recentes' && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-800 shadow-2xs animate-fade-in">
            <ArrowUpDown className="w-3 h-3 text-slate-500" />
            <span>Ordem: {sortLabels[filters.sortBy]}</span>
            <button
              type="button"
              onClick={() => onFilterChange({ sortBy: 'recentes' })}
              className="hover:text-rose-600 p-0.5 rounded-full cursor-pointer transition-colors"
              title="Restaurar ordem padrão"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {/* Chip: Busca texto */}
        {filters.search.trim() !== '' && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-800 shadow-2xs animate-fade-in">
            <span>Busca: "{filters.search}"</span>
            <button
              type="button"
              onClick={() => onFilterChange({ search: '' })}
              className="hover:text-rose-600 p-0.5 rounded-full cursor-pointer transition-colors"
              title="Limpar busca de texto"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {/* Botão Limpar Tudo */}
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-dashed border-slate-300 hover:border-rose-300 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Limpar todos</span>
        </button>
      </div>

      {/* Resumo Métrico */}
      <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-semibold text-slate-600 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
        <span>
          Mostrando <span className="font-extrabold text-slate-900">{filteredCount}</span> de{' '}
          {totalCount} {totalCount === 1 ? 'pedido' : 'pedidos'}
        </span>
        <span className="text-slate-300">•</span>
        <span>
          Total:{' '}
          <span className="font-extrabold text-blue-700">{formatCurrency(totalValue)}</span>
        </span>
      </div>
    </div>
  );
};
