// Tipagens estritas compatíveis com o cliente oficial do Supabase e o PostgreSQL da SmartLar

export type StatusPedido = 'orcamento' | 'aprovado' | 'agendado' | 'em_andamento' | 'concluido' | 'cancelado';
export type TipoPagamento = 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'dinheiro';

export interface Database {
  public: {
    Tables: {
      clientes: {
        Row: Cliente;
        Insert: {
          id?: string;
          nome: string;
          telefone: string;
          email?: string | null;
          endereco: string;
          cep?: string | null;
          logradouro?: string | null;
          numero?: string | null;
          complemento?: string | null;
          bairro?: string | null;
          cidade?: string | null;
          estado?: string | null;
          ponto_referencia?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          telefone?: string;
          email?: string | null;
          endereco?: string;
          cep?: string | null;
          logradouro?: string | null;
          numero?: string | null;
          complemento?: string | null;
          bairro?: string | null;
          cidade?: string | null;
          estado?: string | null;
          ponto_referencia?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      tecnicos: {
        Row: Tecnico;
        Insert: {
          id?: string;
          nome: string;
          telefone: string;
          especialidade: string;
          ativo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          telefone?: string;
          especialidade?: string;
          ativo?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      produtos: {
        Row: Produto;
        Insert: {
          id?: string;
          nome: string;
          categoria: string;
          preco_unitario: number;
          descricao?: string | null;
          ativo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          categoria?: string;
          preco_unitario?: number;
          descricao?: string | null;
          ativo?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      pedidos: {
        Row: PedidoRow;
        Insert: {
          id?: string;
          numero_pedido?: number;
          cliente_id: string;
          tecnico_id?: string | null;
          status?: StatusPedido;
          data_instalacao?: string | null;
          valor_total?: number;
          forma_pagamento?: TipoPagamento | null;
          observacoes?: string | null;
          endereco_instalacao?: string | null;
          ponto_referencia?: string | null;
          concluido_em?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          numero_pedido?: number;
          cliente_id?: string;
          tecnico_id?: string | null;
          status?: StatusPedido;
          data_instalacao?: string | null;
          valor_total?: number;
          forma_pagamento?: TipoPagamento | null;
          observacoes?: string | null;
          endereco_instalacao?: string | null;
          ponto_referencia?: string | null;
          concluido_em?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      itens_pedido: {
        Row: ItemPedidoRow;
        Insert: {
          id?: string;
          pedido_id: string;
          produto_id: string;
          quantidade: number;
          preco_unitario: number;
          subtotal?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          pedido_id?: string;
          produto_id?: string;
          quantidade?: number;
          preco_unitario?: number;
          subtotal?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      historico_status: {
        Row: HistoricoStatus;
        Insert: {
          id?: string;
          pedido_id: string;
          status_anterior?: StatusPedido | null;
          status_novo: StatusPedido;
          alterado_por?: string | null;
          alterado_em?: string;
        };
        Update: {
          id?: string;
          pedido_id?: string;
          status_anterior?: StatusPedido | null;
          status_novo?: StatusPedido;
          alterado_por?: string | null;
          alterado_em?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      v_dashboard_resumo: {
        Row: DashboardResumo;
      };
      v_instalacoes: {
        Row: InstalacaoView;
      };
    };
    Functions: {
      criar_pedido: {
        Args: {
          p_cliente_id: string;
          p_itens: Array<{ produto_id: string; quantidade: number }>;
          p_forma_pagamento?: TipoPagamento | null;
          p_observacoes?: string | null;
          p_ponto_referencia?: string | null;
        };
        Returns: string;
      };
    };
    Enums: {
      status_pedido: StatusPedido;
      tipo_pagamento: TipoPagamento;
    };
  };
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  endereco: string;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  ponto_referencia?: string | null;
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

export interface PedidoRow {
  id: string;
  numero_pedido?: number;
  cliente_id: string;
  tecnico_id: string | null;
  status: StatusPedido;
  data_instalacao: string | null;
  valor_total: number;
  forma_pagamento: TipoPagamento | null;
  observacoes: string | null;
  endereco_instalacao?: string | null;
  ponto_referencia?: string | null;
  concluido_em: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemPedidoRow {
  id: string;
  pedido_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  created_at: string;
}

export interface ItemPedido extends ItemPedidoRow {
  produto?: Produto;
}

export interface Pedido extends PedidoRow {
  cliente?: Cliente;
  tecnico?: Tecnico | null;
  itens?: ItemPedido[];
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
  ponto_referencia?: string | null;
  tecnico_id: string | null;
  tecnico_nome: string | null;
}
