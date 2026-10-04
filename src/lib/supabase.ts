import { createClient } from '@supabase/supabase-js';

// Credenciais vêm exclusivamente das variáveis de ambiente (.env).
// Nenhuma chave é lida/gravada em localStorage.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseUrl.startsWith('https://') && supabaseAnonKey && supabaseAnonKey.length > 20
);

if (!isSupabaseConfigured) {
  console.error(
    'Supabase não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env (veja .env.example).'
  );
}

// Fallback seguro apenas para evitar crash na inicialização quando o .env está ausente.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
