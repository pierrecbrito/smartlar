import React from 'react';
import {
  X,
  RotateCcw,
  User,
  DollarSign,
  Wrench,
  Calendar,
  ArrowUpDown,
  Check,
} from 'lucide-react';
import { Cliente, Tecnico } from '../../types/database';
import {
  PedidosFilterState,
  VALOR_PRESET_OPTIONS,
  ValorPreset,
  PeriodoFilter,
  SortByOption,
} from '../../types/pedidosFilters';
import { formatPhone } from '../../lib/utils';

interface PedidosFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: PedidosFilterState;
  clientes: Cliente[];
  tecnicos: Tecnico[];
  clientOrderCounts: Record<string, number>;
  onFilterChange: (updater: Partial<PedidosFilterState>) => void;
  onResetFilters: () => void;
}

export const PedidosFilterDrawer: React.FC<PedidosFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  clientes,
  tecnicos,
  clientOrderCounts,
  onFilterChange,
  onResetFilters,
}) => {
  if (!isOpen) return null;

  const handleSelectPreset = (preset: ValorPreset) => {
    const opt = VALOR_PRESET_OPTIONS.find((o) => o.id === preset);
    if (opt) {
      onFilterChange({
        valorPreset: preset,
        valorMin: opt.min,
        valorMax: opt.max,
      });
    }
  };

  const handleCustomMinChange = (val: string) => {
    // Permite apenas dígitos e ponto/vírgula
    const sanitized = val.replace(/[^\d.,]/g, '').replace(',', '.');
    onFilterChange({
      valorMin: sanitized,
      valorPreset: 'custom',
    });
  };

  const handleCustomMaxChange = (val: string) => {
    const sanitized = val.replace(/[^\d.,]/g, '').replace(',', '.');
    onFilterChange({
      valorMax: sanitized,
      valorPreset: 'custom',
    });
  };

  // Clientes ordenados: primeiro os que possuem pedidos, depois os demais
  const sortedClientes = [...clientes].sort((a, b) => {
    const countA = clientOrderCounts[a.id] || 0;
    const countB = clientOrderCounts[b.id] || 0;
    if (countB !== countA) return countB - countA;
    return a.nome.localeCompare(b.nome);
  });

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg space-y-5 sm:space-y-6 animate-slide-up">
      {/* Top Header do Painel */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <DollarSign className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              Filtros Avançados do Kanban
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 truncate">
              Clientes, faixa de valores, técnicos e datas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Redefinir</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Fechar painel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* ==================== 1. FILTRO DE CLIENTE ==================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Cliente</span>
            </label>
            {filters.clienteId !== 'todos' && (
              <button
                type="button"
                onClick={() => onFilterChange({ clienteId: 'todos' })}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={filters.clienteId}
              onChange={(e) => onFilterChange({ clienteId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white shadow-2xs cursor-pointer transition-all"
            >
              <option value="todos">Todos os Clientes</option>
              {sortedClientes.map((c) => {
                const count = clientOrderCounts[c.id] || 0;
                return (
                  <option key={c.id} value={c.id}>
                    {c.nome} {count > 0 ? `(${count} ${count === 1 ? 'pedido' : 'pedidos'})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Quick chips para clientes mais frequentes */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
              Mais frequentes:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sortedClientes.slice(0, 4).map((c) => {
                const isSelected = filters.clienteId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      onFilterChange({
                        clienteId: isSelected ? 'todos' : c.id,
                      })
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    {c.nome.split(' ')[0]}
                    {c.telefone && ` (${formatPhone(c.telefone).slice(-4)})`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ==================== 2. FILTRO DE VALORES ==================== */}
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Faixa de Valor do Pedido</span>
            </label>
            {(filters.valorPreset !== 'todos' || filters.valorMin !== '' || filters.valorMax !== '') && (
              <button
                type="button"
                onClick={() =>
                  onFilterChange({
                    valorPreset: 'todos',
                    valorMin: '',
                    valorMax: '',
                  })
                }
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Presets de valor */}
          <div className="flex flex-wrap gap-2">
            {VALOR_PRESET_OPTIONS.map((opt) => {
              const isSelected = filters.valorPreset === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectPreset(opt.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Inputs Customizados de Mínimo e Máximo */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                R$
              </span>
              <input
                type="text"
                value={filters.valorMin}
                onChange={(e) => handleCustomMinChange(e.target.value)}
                placeholder="Valor Mínimo"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white shadow-2xs transition-all"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                R$
              </span>
              <input
                type="text"
                value={filters.valorMax}
                onChange={(e) => handleCustomMaxChange(e.target.value)}
                placeholder="Valor Máximo"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white shadow-2xs transition-all"
              />
            </div>
          </div>
        </div>

        {/* ==================== 3. FILTRO DE TÉCNICO ==================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-purple-600" />
              <span>Técnico Alocado</span>
            </label>
            {filters.tecnicoId !== 'todos' && (
              <button
                type="button"
                onClick={() => onFilterChange({ tecnicoId: 'todos' })}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>

          <select
            value={filters.tecnicoId}
            onChange={(e) => onFilterChange({ tecnicoId: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-purple-500 focus:bg-white shadow-2xs cursor-pointer transition-all"
          >
            <option value="todos">Todos os Técnicos</option>
            <option value="sem_tecnico">Sem técnico atribuído</option>
            {tecnicos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} ({t.especialidade})
              </option>
            ))}
          </select>
        </div>

        {/* ==================== 4. FILTRO DE PERÍODO ==================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>Período de Criação</span>
            </label>
            {filters.periodo !== 'todos' && (
              <button
                type="button"
                onClick={() => onFilterChange({ periodo: 'todos' })}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>

          <select
            value={filters.periodo}
            onChange={(e) => onFilterChange({ periodo: e.target.value as PeriodoFilter })}
            className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-amber-500 focus:bg-white shadow-2xs cursor-pointer transition-all"
          >
            <option value="todos">Todo o período</option>
            <option value="hoje">Hoje</option>
            <option value="7dias">Últimos 7 dias</option>
            <option value="este_mes">Este mês</option>
            <option value="30dias">Últimos 30 dias</option>
          </select>
        </div>

        {/* ==================== 5. ORDENAÇÃO DOS CARDS ==================== */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Ordenar Pedidos Por</span>
          </label>

          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as SortByOption })}
            className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-500 focus:bg-white shadow-2xs cursor-pointer transition-all"
          >
            <option value="recentes">Mais recentes primeiro</option>
            <option value="antigos">Mais antigos primeiro</option>
            <option value="maior_valor">Maior valor primeiro</option>
            <option value="menor_valor">Menor valor primeiro</option>
            <option value="cliente_az">Cliente (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Footer com Botão de Conclusão */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          <span>Aplicar e Fechar</span>
        </button>
      </div>
    </div>
  );
};
