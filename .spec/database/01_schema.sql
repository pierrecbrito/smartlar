-- =====================================================================
-- SmartLar — Schema (Supabase / PostgreSQL)
-- Rodar no SQL Editor do Supabase, nesta ordem:
--   01_schema.sql  ->  02_seed.sql  ->  (só com login pronto) 03_rls.sql
--
-- Ideia central: as REGRAS DE NEGÓCIO vivem no banco (constraints + triggers).
-- O front só mostra e pede; se o front errar, o banco recusa.
-- =====================================================================

-- ---------- TIPOS ----------
create type status_pedido as enum
  ('orcamento', 'aprovado', 'agendado', 'em_andamento', 'concluido', 'cancelado');

create type tipo_pagamento as enum
  ('pix', 'cartao_credito', 'cartao_debito', 'boleto', 'dinheiro');

-- ---------- TABELAS ----------
create table clientes (
  id                uuid primary key default gen_random_uuid(),
  nome              text not null check (length(trim(nome)) > 0),
  telefone          text not null check (length(regexp_replace(telefone, '\D', '', 'g')) between 10 and 13),
  email             text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  -- Endereço Estruturado
  cep               varchar(9),
  logradouro        text,
  numero            text,
  complemento       text,
  bairro            text,
  cidade            text default 'Recife',
  estado            varchar(2) default 'PE',
  ponto_referencia  text,
  endereco          text not null check (length(trim(endereco)) > 0),  -- endereço completo formatado
  created_at        timestamptz not null default now()
);

create table tecnicos (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  telefone      text not null,
  especialidade text not null,
  ativo         boolean not null default true,
  created_at    timestamptz not null default now()
);

create table produtos (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  categoria      text not null,
  preco_unitario numeric(10,2) not null check (preco_unitario >= 0),
  descricao      text,
  ativo          boolean not null default true,   -- "apagar" produto = desativar (histórico preservado)
  created_at     timestamptz not null default now()
);
create unique index produtos_nome_uk on produtos (lower(nome));

create table pedidos (
  id                  uuid primary key default gen_random_uuid(),
  numero_pedido       serial unique,
  cliente_id          uuid not null references clientes(id) on delete restrict,
  tecnico_id          uuid references tecnicos(id) on delete restrict,
  status              status_pedido not null default 'orcamento',
  data_instalacao     timestamptz,                 -- timestamptz (e não date) porque a automação precisa do horário
  valor_total         numeric(12,2) not null default 0 check (valor_total >= 0),  -- derivado: mantido por trigger
  forma_pagamento     tipo_pagamento,
  observacoes         text,
  endereco_instalacao text,                        -- snapshot do endereço da instalação no momento do pedido
  ponto_referencia    text,                        -- orientações ou referência para a equipe técnica
  concluido_em        timestamptz,                 -- base do "faturado no mês" (created_at não serve pra isso)
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  -- agendado / em andamento / concluído exigem técnico e data
  constraint pedido_agendamento_completo check (
    status not in ('agendado', 'em_andamento', 'concluido')
    or (tecnico_id is not null and data_instalacao is not null)
  )
);

create table itens_pedido (
  id              uuid primary key default gen_random_uuid(),
  pedido_id       uuid not null references pedidos(id) on delete cascade,
  produto_id      uuid not null references produtos(id) on delete restrict,
  quantidade      integer not null check (quantidade > 0),
  preco_unitario  numeric(10,2) not null check (preco_unitario >= 0),  -- SNAPSHOT do preço na hora da venda
  subtotal        numeric(12,2) generated always as (quantidade * preco_unitario) stored,
  created_at      timestamptz not null default now(),
  unique (pedido_id, produto_id)
);

-- Bônus: trilha de auditoria das mudanças de status
create table historico_status (
  id              uuid primary key default gen_random_uuid(),
  pedido_id       uuid not null references pedidos(id) on delete cascade,
  status_anterior status_pedido,
  status_novo     status_pedido not null,
  alterado_por    uuid,                          -- auth.uid() quando houver login
  alterado_em     timestamptz not null default now()
);

-- ---------- ÍNDICES ----------
create index pedidos_status_idx     on pedidos (status);
create index pedidos_instalacao_idx on pedidos (data_instalacao) where data_instalacao is not null;
create index pedidos_cliente_idx    on pedidos (cliente_id);
create index pedidos_tecnico_idx    on pedidos (tecnico_id);
create index itens_pedido_idx       on itens_pedido (pedido_id);
create index historico_pedido_idx   on historico_status (pedido_id);

-- ---------- REGRA: todo pedido nasce como orçamento ----------
create or replace function trg_pedidos_before_insert() returns trigger
language plpgsql as $$
begin
  if new.status <> 'orcamento' then
    raise exception 'Todo pedido nasce como orçamento (recebido: %)', new.status;
  end if;
  new.valor_total := 0;  -- o total vem dos itens
  return new;
end $$;

create trigger pedidos_bi before insert on pedidos
  for each row execute function trg_pedidos_before_insert();

-- ---------- REGRA: fluxo de status (não volta, não pula) ----------
create or replace function trg_pedidos_before_update() returns trigger
language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if not (
         (old.status = 'orcamento'     and new.status in ('aprovado', 'cancelado'))
      or (old.status = 'aprovado'      and new.status in ('agendado', 'cancelado'))
      or (old.status = 'agendado'      and new.status = 'em_andamento')
      or (old.status = 'em_andamento'  and new.status = 'concluido')
    ) then
      raise exception 'Transição de status inválida: % -> %', old.status, new.status;
    end if;
    if new.status = 'concluido' then
      new.concluido_em := now();
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger pedidos_bu before update on pedidos
  for each row execute function trg_pedidos_before_update();

-- ---------- BÔNUS: histórico automático ----------
create or replace function trg_pedidos_historico() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    insert into historico_status (pedido_id, status_anterior, status_novo, alterado_por)
    values (new.id, null, new.status, auth.uid());
  elsif new.status is distinct from old.status then
    insert into historico_status (pedido_id, status_anterior, status_novo, alterado_por)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return null;
end $$;

create trigger pedidos_ai after insert or update on pedidos
  for each row execute function trg_pedidos_historico();

-- ---------- REGRA: itens (snapshot de preço + só editável em orçamento) ----------
create or replace function trg_itens_before() returns trigger
language plpgsql as $$
declare
  v_pedido uuid;
  v_status status_pedido;
begin
  if tg_op = 'DELETE' then v_pedido := old.pedido_id; else v_pedido := new.pedido_id; end if;

  select status into v_status from pedidos where id = v_pedido;
  if v_status is not null and v_status <> 'orcamento' then
    raise exception 'Itens só podem ser alterados enquanto o pedido é orçamento (status atual: %)', v_status;
  end if;

  if tg_op = 'INSERT' and new.preco_unitario is null then
    select preco_unitario into new.preco_unitario from produtos where id = new.produto_id;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

create trigger itens_bi before insert or update or delete on itens_pedido
  for each row execute function trg_itens_before();

-- ---------- REGRA: valor_total = soma dos subtotais ----------
create or replace function trg_itens_after() returns trigger
language plpgsql as $$
declare
  v_pedido uuid;
begin
  if tg_op = 'DELETE' then v_pedido := old.pedido_id; else v_pedido := new.pedido_id; end if;

  update pedidos
     set valor_total = coalesce((select sum(subtotal) from itens_pedido where pedido_id = v_pedido), 0)
   where id = v_pedido;
  return null;
end $$;

create trigger itens_ai after insert or update or delete on itens_pedido
  for each row execute function trg_itens_after();

-- ---------- RPC: criar pedido + itens de forma ATÔMICA ----------
-- Chamada no front: supabase.rpc('criar_pedido', { p_cliente_id, p_observacoes, p_itens })
-- p_itens = [{ "produto_id": "<uuid>", "quantidade": 2 }, ...]
create or replace function criar_pedido(p_cliente_id uuid, p_observacoes text, p_itens jsonb)
returns uuid
language plpgsql as $$
declare
  v_id uuid;
  v_total numeric(10,2) := 0;
begin
  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'O pedido precisa ter ao menos um item';
  end if;

  -- 1. Pré-calcula o valor_total para que o webhook no INSERT já receba o valor real
  select coalesce(sum((i->>'quantidade')::int * pr.preco_unitario), 0)
    into v_total
    from jsonb_array_elements(p_itens) as i
    join produtos pr on pr.id = (i->>'produto_id')::uuid;

  -- 2. Insere o pedido já com o valor_total preenchido e congelando o endereço de instalação
  insert into pedidos (cliente_id, observacoes, valor_total, endereco_instalacao, ponto_referencia)
  select p_cliente_id, nullif(trim(p_observacoes), ''), v_total, c.endereco, c.ponto_referencia
    from clientes c where c.id = p_cliente_id
  returning id into v_id;

  -- 3. Insere os itens_pedido (agrupando produtos repetidos se houver)
  insert into itens_pedido (pedido_id, produto_id, quantidade)
  select v_id, (i->>'produto_id')::uuid, sum((i->>'quantidade')::int)
    from jsonb_array_elements(p_itens) as i
   group by (i->>'produto_id')::uuid;

  return v_id;
end $$;

-- ---------- VIEWS (leitura simples pro front e pro n8n) ----------
-- Indicadores do dashboard (fuso de Brasília para "do mês")
create or replace view v_dashboard_resumo with (security_invoker = true) as
select
  count(*) filter (
    where date_trunc('month', created_at at time zone 'America/Sao_Paulo')
        = date_trunc('month', now() at time zone 'America/Sao_Paulo')
  ) as pedidos_mes,
  coalesce(sum(valor_total) filter (
    where status = 'concluido'
      and date_trunc('month', concluido_em at time zone 'America/Sao_Paulo')
        = date_trunc('month', now() at time zone 'America/Sao_Paulo')
  ), 0) as faturado_mes,
  coalesce(sum(valor_total) filter (
    where status in ('aprovado', 'agendado', 'em_andamento')
  ), 0) as a_receber,
  count(*) filter (where status = 'aprovado') as pendentes_agendamento
from pedidos;

-- Instalações (agendadas / em andamento) já "achatadas" com cliente e técnico.
-- Usada no dashboard, na agenda dos técnicos e nas automações.
create or replace view v_instalacoes with (security_invoker = true) as
select
  p.id              as pedido_id,
  p.status,
  p.data_instalacao,
  p.valor_total,
  c.nome            as cliente_nome,
  c.telefone        as cliente_telefone,
  coalesce(p.endereco_instalacao, c.endereco) as endereco,
  t.id              as tecnico_id,
  t.nome            as tecnico_nome,
  coalesce(p.ponto_referencia, c.ponto_referencia) as ponto_referencia
from pedidos p
join clientes c      on c.id = p.cliente_id
left join tecnicos t on t.id = p.tecnico_id
where p.status in ('agendado', 'em_andamento');
