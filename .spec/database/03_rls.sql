-- =====================================================================
-- SmartLar — 03_rls.sql
-- Ativação de Row Level Security (RLS) Estrito no Supabase
--
-- Modelo: Qualquer usuário autenticado (authenticated) tem acesso total
-- de leitura e escrita às tabelas do sistema.
-- Usuários anônimos (sem login) têm acesso bloqueado pelo RLS.
-- =====================================================================

do $$
declare
  t text;
begin
  foreach t in array array['clientes', 'tecnicos', 'produtos', 'pedidos', 'itens_pedido', 'historico_status']
  loop
    -- 1. Habilita RLS na tabela
    execute format('alter table public.%I enable row level security', t);

    -- 2. Remove política anterior caso já exista para evitar erro de duplicidade
    execute format('drop policy if exists "autenticados_acesso_total" on public.%I', t);

    -- 3. Cria a política de acesso total para usuários autenticados
    execute format(
      'create policy "autenticados_acesso_total" on public.%I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

-- =====================================================================
-- Script de Rollback / Desativar RLS (caso precise reverter):
-- =====================================================================
-- do $$
-- declare
--   t text;
-- begin
--   foreach t in array array['clientes', 'tecnicos', 'produtos', 'pedidos', 'itens_pedido', 'historico_status']
--   loop
--     execute format('drop policy if exists "autenticados_acesso_total" on public.%I', t);
--     execute format('alter table public.%I disable row level security', t);
--   end loop;
-- end $$;
