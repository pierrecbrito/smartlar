export type ValorPreset =
  | 'todos'
  | 'ate_500'
  | '500_1500'
  | '1500_3000'
  | 'acima_3000'
  | 'custom';

export type PeriodoFilter = 'todos' | 'hoje' | '7dias' | 'este_mes' | '30dias';

export type SortByOption =
  | 'recentes'
  | 'antigos'
  | 'maior_valor'
  | 'menor_valor'
  | 'cliente_az';

export interface PedidosFilterState {
  search: string;
  clienteId: string; // 'todos' ou id do cliente
  valorMin: string; // string para controle do input numérico
  valorMax: string; // string para controle do input numérico
  valorPreset: ValorPreset;
  tecnicoId: string; // 'todos' | 'sem_tecnico' | id do técnico
  periodo: PeriodoFilter;
  sortBy: SortByOption;
}

export const INITIAL_PEDIDOS_FILTERS: PedidosFilterState = {
  search: '',
  clienteId: 'todos',
  valorMin: '',
  valorMax: '',
  valorPreset: 'todos',
  tecnicoId: 'todos',
  periodo: 'todos',
  sortBy: 'recentes',
};

export const VALOR_PRESET_OPTIONS: { id: ValorPreset; label: string; min: string; max: string }[] = [
  { id: 'todos', label: 'Todos os valores', min: '', max: '' },
  { id: 'ate_500', label: 'Até R$ 500', min: '', max: '500' },
  { id: '500_1500', label: 'R$ 500 – R$ 1.500', min: '500', max: '1500' },
  { id: '1500_3000', label: 'R$ 1.500 – R$ 3.000', min: '1500', max: '3000' },
  { id: 'acima_3000', label: 'Acima de R$ 3.000', min: '3000', max: '' },
];

export function countActiveFilters(filters: PedidosFilterState): number {
  let count = 0;
  if (filters.search.trim() !== '') count++;
  if (filters.clienteId !== 'todos') count++;
  if (filters.valorPreset !== 'todos' || filters.valorMin !== '' || filters.valorMax !== '') count++;
  if (filters.tecnicoId !== 'todos') count++;
  if (filters.periodo !== 'todos') count++;
  if (filters.sortBy !== 'recentes') count++;
  return count;
}
