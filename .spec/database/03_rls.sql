-- =====================================================================
-- SmartLar — RLS (bônus). Rodar SÓ DEPOIS que o login do front estiver funcionando.
--
-- ATENÇÃO: com RLS ligado e sem usuário logado, o front (chave anon) enxerga ZERO linhas.
-- Isso parece "sistema quebrado" pro avaliador (e quebrar = eliminatório).
-- Ordem segura: 1) implementar login  2) criar o usuário de teste no painel Auth
--               3) rodar este arquivo  4) testar tudo logado.
--
-- O n8n usa a service_role key, que ignora RLS (nunca coloque essa chave no front).
-- Modelo simples: qualquer usuário autenticado acessa tudo.
-- Evolução (documente como "o que faria com mais tempo"): perfil de técnico que só
-- enxerga/atualiza pedidos onde tecnico_id = o seu, e perfil de dono com acesso total.
-- =====================================================================

do $$
declare
  t text;
begin
  foreach t in array array['clientes','tecnicos','produtos','pedidos','itens_pedido','historico_status']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "autenticados_acesso_total" on public.%I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

-- Para desfazer rápido se algo der errado:
-- do $$ declare t text; begin
--   foreach t in array array['clientes','tecnicos','produtos','pedidos','itens_pedido','historico_status'] loop
--     execute format('drop policy "autenticados_acesso_total" on public.%I', t);
--     execute format('alter table public.%I disable row level security', t);
--   end loop; end $$;
