import { createClient } from '@supabase/supabase-js';

// Prioriza credenciais do .env ou salvas no localStorage para conveniência
const defaultUrl = import.meta.env.VITE_SUPABASE_URL || '';
const defaultKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const getSupabaseConfig = () => {
  const localUrl = localStorage.getItem('smartlar_supabase_url');
  const localKey = localStorage.getItem('smartlar_supabase_anon_key');

  const supabaseUrl = localUrl || defaultUrl;
  const supabaseAnonKey = localKey || defaultKey;

  const isConfigured = Boolean(
    supabaseUrl &&
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey &&
    supabaseAnonKey.length > 20
  );

  return { supabaseUrl, supabaseAnonKey, isConfigured };
};

export const setSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem('smartlar_supabase_url', url.trim());
  localStorage.setItem('smartlar_supabase_anon_key', key.trim());
  window.location.reload();
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem('smartlar_supabase_url');
  localStorage.removeItem('smartlar_supabase_anon_key');
  window.location.reload();
};

const config = getSupabaseConfig();

// Instância segura do cliente Supabase (usando fallback seguro caso ainda não configurado)
export const supabase = createClient(
  config.supabaseUrl || 'https://placeholder-url.supabase.co',
  config.supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
