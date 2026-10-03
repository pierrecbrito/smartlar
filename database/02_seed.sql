-- =====================================================================
-- SmartLar — Dados de exemplo
-- Rodar DEPOIS do 01_schema.sql.
-- Os pedidos são criados via criar_pedido() e avançados status por status,
-- então os triggers, o valor_total e o historico_status são exercitados de verdade.
-- Datas de agendamento são relativas a "hoje": o dashboard e a automação 2
-- sempre terão o que mostrar (rode o seed de novo, em banco limpo, antes de entregar).
-- =====================================================================

insert into tecnicos (nome, telefone, especialidade) values
  ('Lucas Almeida', '81999990001', 'Câmeras e sensores'),
  ('Pedro Santos',  '81999990002', 'Fechaduras e iluminação');

insert into produtos (nome, categoria, preco_unitario, descricao) values
  ('Câmera IP Wi-Fi Full HD',         'Segurança',   450.00, 'Câmera interna/externa com visão noturna e app no celular'),
  ('Fechadura Digital Biométrica',    'Segurança',  1290.00, 'Abre por digital, senha, cartão ou app'),
  ('Sensor de Abertura Porta/Janela', 'Segurança',    95.00, 'Alerta no celular quando porta ou janela abre'),
  ('Sensor de Presença',              'Automação',   180.00, 'Detecta movimento e aciona cenas de automação'),
  ('Assistente de Voz Smart Speaker', 'Automação',   350.00, 'Controle da casa por comando de voz'),
  ('Central de Automação (Hub)',      'Automação',   520.00, 'Integra todos os dispositivos em um único app'),
  ('Lâmpada Inteligente RGB',         'Iluminação',   65.00, 'Lâmpada Wi-Fi com 16 milhões de cores'),
  ('Fita de LED Inteligente 5m',      'Iluminação',  140.00, 'Fita de LED endereçável com controle por app'),
  ('Interruptor Inteligente Wi-Fi',   'Iluminação',  110.00, 'Substitui o interruptor comum, sem trocar a fiação');

insert into clientes (nome, telefone, email, endereco) values
  ('Marina Costa',          '81988880001', 'marina.costa@email.com',   'Rua das Flores, 120, Apto 302 - Centro'),
  ('Carlos Eduardo Ribeiro','81988880002', 'carlos.ribeiro@email.com', 'Av. Brasil, 845 - Jardim Primavera'),
  ('Fernanda Lima',         '81988880003', 'fernanda.lima@email.com',  'Rua do Sol, 77 - Boa Vista'),
  ('Roberto Nunes',         '81988880004', null,                       'Rua Pernambuco, 1500 - São José'),
  ('Ana Paula Souza',       '81988880005', 'ana.souza@email.com',      'Travessa das Palmeiras, 33 - Cidade Nova');

-- ---------- helper temporário (removido no final) ----------
create or replace function seed_pedido(
  p_cliente text, p_itens jsonb, p_final status_pedido,
  p_tecnico text default null, p_data timestamptz default null,
  p_pgto tipo_pagamento default null, p_obs text default null
) returns uuid
language plpgsql as $$
declare
  v_id    uuid;
  v_mes   timestamptz := date_trunc('month', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';
  v_itens jsonb;
  s       status_pedido;
begin
  select jsonb_agg(jsonb_build_object('produto_id', pr.id, 'quantidade', (i->>'qtd')::int))
    into v_itens
    from jsonb_array_elements(p_itens) i
    join produtos pr on lower(pr.nome) = lower(i->>'produto');

  if v_itens is null or jsonb_array_length(v_itens) <> jsonb_array_length(p_itens) then
    raise exception 'Seed: produto não encontrado em %', p_itens;
  end if;

  v_id := criar_pedido((select id from clientes where nome = p_cliente), p_obs, v_itens);

  if p_pgto is not null then
    update pedidos set forma_pagamento = p_pgto where id = v_id;
  end if;

  if p_final = 'cancelado' then
    update pedidos set status = 'cancelado' where id = v_id;
  elsif p_final <> 'orcamento' then
    foreach s in array array['aprovado','agendado','em_andamento','concluido']::status_pedido[] loop
      if s = 'agendado' then
        update pedidos
           set status = s,
               tecnico_id = (select id from tecnicos where nome = p_tecnico),
               data_instalacao = coalesce(p_data, v_mes + interval '9 hours')
         where id = v_id;
      else
        update pedidos set status = s where id = v_id;
      end if;
      exit when s = p_final;
    end loop;

    if p_final = 'concluido' then  -- pedidos concluídos "no passado recente", dentro do mês corrente
      update pedidos
         set created_at = v_mes,
             data_instalacao = v_mes + interval '9 hours',
             concluido_em = v_mes + interval '15 hours'
       where id = v_id;
    end if;
  end if;

  return v_id;
end $$;

-- ---------- 9 pedidos: 2 concluídos, 1 em andamento, 2 agendados, 1 aprovado, 2 orçamentos, 1 cancelado ----------

-- Caso de teste do enunciado: 2x Câmera (450) + 1x Sensor de presença (180) = 1.080
select seed_pedido('Marina Costa',
  '[{"produto":"Câmera IP Wi-Fi Full HD","qtd":2},{"produto":"Sensor de Presença","qtd":1}]',
  'concluido', 'Lucas Almeida', null, 'pix', 'Apartamento: 2 câmeras na varanda e sensor na sala');

select seed_pedido('Carlos Eduardo Ribeiro',
  '[{"produto":"Fechadura Digital Biométrica","qtd":1},{"produto":"Lâmpada Inteligente RGB","qtd":4}]',
  'concluido', 'Pedro Santos', null, 'cartao_credito', null);

select seed_pedido('Fernanda Lima',
  '[{"produto":"Central de Automação (Hub)","qtd":1},{"produto":"Assistente de Voz Smart Speaker","qtd":1}]',
  'em_andamento', 'Lucas Almeida',
  ((current_date + time '08:00') at time zone 'America/Sao_Paulo'), 'pix', null);

select seed_pedido('Roberto Nunes',   -- agendado para AMANHÃ (alimenta a automação 2)
  '[{"produto":"Câmera IP Wi-Fi Full HD","qtd":3},{"produto":"Sensor de Abertura Porta/Janela","qtd":2}]',
  'agendado', 'Lucas Almeida',
  (((current_date + 1) + time '09:00') at time zone 'America/Sao_Paulo'), 'boleto', 'Casa com muro alto, levar escada');

select seed_pedido('Ana Paula Souza',
  '[{"produto":"Fechadura Digital Biométrica","qtd":1},{"produto":"Interruptor Inteligente Wi-Fi","qtd":2}]',
  'agendado', 'Pedro Santos',
  (((current_date + 3) + time '14:00') at time zone 'America/Sao_Paulo'), 'cartao_debito', null);

select seed_pedido('Carlos Eduardo Ribeiro',   -- aprovado, ainda sem técnico/data
  '[{"produto":"Lâmpada Inteligente RGB","qtd":6},{"produto":"Fita de LED Inteligente 5m","qtd":2}]',
  'aprovado', null, null, 'pix', null);

select seed_pedido('Fernanda Lima',
  '[{"produto":"Câmera IP Wi-Fi Full HD","qtd":1},{"produto":"Sensor de Presença","qtd":1}]',
  'orcamento', null, null, null, 'Cliente quer comparar com outro orçamento');

select seed_pedido('Roberto Nunes',
  '[{"produto":"Central de Automação (Hub)","qtd":1},{"produto":"Interruptor Inteligente Wi-Fi","qtd":4}]',
  'orcamento', null, null, null, 'Portão eletrônico antigo, verificar compatibilidade');

select seed_pedido('Ana Paula Souza',
  '[{"produto":"Câmera IP Wi-Fi Full HD","qtd":2},{"produto":"Assistente de Voz Smart Speaker","qtd":1}]',
  'cancelado', null, null, null, 'Cliente desistiu após o orçamento');

drop function seed_pedido(text, jsonb, status_pedido, text, timestamptz, tipo_pagamento, text);

-- ---------- conferência (rode e compare) ----------
-- 1) O caso do enunciado precisa dar 1080.00:
--    select valor_total from pedidos p join clientes c on c.id = p.cliente_id
--     where c.nome = 'Marina Costa' and p.status = 'concluido';
-- 2) Indicadores:        select * from v_dashboard_resumo;
-- 3) Histórico gerado:   select * from historico_status order by alterado_em;
-- 4) Testes de recusa (devem dar ERRO):
--    update pedidos set status = 'em_andamento' where status = 'orcamento';   -- pulou etapa
--    update pedidos set status = 'orcamento'    where status = 'aprovado';    -- voltou etapa
--    update pedidos set status = 'agendado'     where status = 'aprovado';    -- sem técnico/data
