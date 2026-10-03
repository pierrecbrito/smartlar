// Tipagens derivadas do schema PostgreSQL da SmartLar

export type StatusPedido = 'orcamento' | 'aprovado' | 'agendado' | 'em_andamento' | 'concluido' | 'cancelado';

export type TipoPagamento = 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'dinheiro';

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  endereco: string;
  created_at: string;
}

export interface Tecnico {
  id: string;
  nome: string;
  telefone: string;
  especialidade: string;
  ativo: boolean;
  created_at: string;
}

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  preco_unitario: number;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
}

export interface Pedido {
  id: string;
  numero_pedido?: number;
  cliente_id: string;
  tecnico_id: string | null;
  status: StatusPedido;
  data_instalacao: string | null;
  valor_total: number;
  forma_pagamento: TipoPagamento | null;
  observacoes: string | null;
  concluido_em: string | null;
  created_at: string;
  updated_at: string;
  cliente?: Cliente;
  tecnico?: Tecnico;
  itens?: ItemPedido[];
}

export interface ItemPedido {
  id: string;
  pedido_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  created_at: string;
  produto?: Produto;
}

export interface HistoricoStatus {
  id: string;
  pedido_id: string;
  status_anterior: StatusPedido | null;
  status_novo: StatusPedido;
  alterado_por: string | null;
  alterado_em: string;
}

export interface DashboardResumo {
  pedidos_mes: number;
  faturado_mes: number;
  a_receber: number;
  pendentes_agendamento: number;
}

export interface InstalacaoView {
  pedido_id: string;
  status: StatusPedido;
  data_instalacao: string;
  valor_total: number;
  cliente_nome: string;
  cliente_telefone: string;
  endereco: string;
  tecnico_id: string | null;
  tecnico_nome: string | null;
}
