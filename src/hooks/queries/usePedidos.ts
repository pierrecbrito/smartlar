import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Pedido, Tecnico, Cliente, StatusPedido } from '../../types/database';

export const PEDIDOS_QUERY_KEY = ['pedidos'];
export const TECNICOS_QUERY_KEY = ['tecnicos'];
export const CLIENTES_QUERY_KEY = ['clientes'];

export interface FetchPedidosOptions {
  status?: string;
  clienteId?: string;
  tecnicoId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchPedidos(options?: FetchPedidosOptions): Promise<Pedido[]> {
  let query = supabase
    .from('pedidos')
    .select(`
      *,
      cliente:clientes(id, nome, telefone, endereco),
      tecnico:tecnicos(id, nome, telefone, especialidade),
      itens:itens_pedido(
        id,
        quantidade,
        preco_unitario,
        subtotal,
        produto:produtos(id, nome, categoria)
      )
    `)
    .order('created_at', { ascending: false });

  // Filtros no servidor se especificados
  if (options?.status && options.status !== 'todos') {
    query = query.eq('status', options.status as any);
  }

  if (options?.clienteId && options.clienteId !== 'todos') {
    query = query.eq('cliente_id', options.clienteId);
  }

  if (options?.tecnicoId) {
    if (options.tecnicoId === 'sem_tecnico') {
      query = query.is('tecnico_id', null);
    } else if (options.tecnicoId !== 'todos') {
      query = query.eq('tecnico_id', options.tecnicoId);
    }
  }

  // Paginação opcional via range se fornecida
  if (options?.page !== undefined && options?.pageSize !== undefined) {
    const from = (options.page - 1) * options.pageSize;
    const to = from + options.pageSize - 1;
    query = query.range(from, to);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Pedido[];
}

export async function fetchTecnicos(): Promise<Tecnico[]> {
  const { data, error } = await supabase
    .from('tecnicos')
    .select('*')
    .eq('ativo', true)
    .order('nome', { ascending: true });
  if (error) throw error;
  return (data || []) as Tecnico[];
}

export async function fetchClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('id, nome, telefone, endereco, cep, logradouro, numero, bairro, cidade, estado, created_at')
    .order('nome', { ascending: true });
  if (error) throw error;
  return (data || []) as Cliente[];
}

/**
 * Hook principal para gerenciar pedidos com cache inteligente e sincronização Realtime
 */
export function usePedidos(options?: FetchPedidosOptions) {
  const queryClient = useQueryClient();

  const queryKey = options ? [...PEDIDOS_QUERY_KEY, options] : PEDIDOS_QUERY_KEY;

  const pedidosQuery = useQuery({
    queryKey,
    queryFn: () => fetchPedidos(options),
  });

  // Listener Supabase Realtime ativo para pedidos
  useEffect(() => {
    const channel = supabase
      .channel('pedidos-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        (_payload) => {
          // Invalida e sincroniza imediatamente o cache de pedidos e resumos
          queryClient.invalidateQueries({ queryKey: PEDIDOS_QUERY_KEY });
          queryClient.invalidateQueries({ queryKey: ['dashboard-resumo'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return pedidosQuery;
}

/**
 * Mutation para alteração de status com invalidação
 */
export function useUpdatePedidoStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pedidoId, novoStatus }: { pedidoId: string; novoStatus: StatusPedido }) => {
      const { data, error } = await supabase
        .from('pedidos')
        .update({ status: novoStatus })
        .eq('id', pedidoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PEDIDOS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard-resumo'] });
    },
  });
}
