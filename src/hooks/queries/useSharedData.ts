import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Cliente, Tecnico, Produto } from '../../types/database';

export const TECNICOS_KEY = ['tecnicos'];
export const CLIENTES_KEY = ['clientes'];
export const PRODUTOS_KEY = ['produtos'];

export function useTecnicosQuery() {
  return useQuery<Tecnico[]>({
    queryKey: TECNICOS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tecnicos')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true });
      if (error) throw error;
      return (data || []) as Tecnico[];
    },
  });
}

export function useClientesQuery() {
  return useQuery<Cliente[]>({
    queryKey: CLIENTES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });
      if (error) throw error;
      return (data || []) as Cliente[];
    },
  });
}

export function useProdutosQuery() {
  return useQuery<Produto[]>({
    queryKey: PRODUTOS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('nome', { ascending: true });
      if (error) throw error;
      return (data || []) as Produto[];
    },
  });
}
