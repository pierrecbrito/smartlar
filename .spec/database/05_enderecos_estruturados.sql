-- =====================================================================
-- SmartLar — Migração: Endereços Estruturados e Snapshot no Pedido
-- Rodar no SQL Editor do Supabase se o banco já foi inicializado.
-- =====================================================================

-- 1. Adicionar campos estruturados na tabela 'clientes'
alter table clientes
  add column if not exists cep               varchar(9),
  add column if not exists logradouro        text,
  add column if not exists numero            text,
  add column if not exists complemento       text,
  add column if not exists bairro            text,
  add column if not exists cidade            text default 'Recife',
  add column if not exists estado            varchar(2) default 'PE',
  add column if not exists ponto_referencia  text;

-- 2. Adicionar campos de snapshot de instalação na tabela 'pedidos'
alter table pedidos
  add column if not exists endereco_instalacao text,
  add column if not exists ponto_referencia    text;

-- 3. Atualizar pedidos existentes com o snapshot do endereço atual do cliente
update pedidos p
   set endereco_instalacao = coalesce(p.endereco_instalacao, c.endereco),
       ponto_referencia    = coalesce(p.ponto_referencia, c.ponto_referencia)
  from clientes c
 where c.id = p.cliente_id
   and p.endereco_instalacao is null;

-- 4. Função e trigger para manter 'endereco' formatado e sincronizado caso campos estruturados sejam informados
create or replace function trg_formatar_endereco_cliente()
returns trigger
language plpgsql as $$
begin
  -- Se foram fornecidos logradouro ou número, e 'endereco' estiver vazio/nulo ou for igual ao antigo, recalcula:
  if (NEW.logradouro is not null and trim(NEW.logradouro) <> '') then
    if (NEW.endereco is null or trim(NEW.endereco) = '' or (TG_OP = 'UPDATE' and NEW.endereco = OLD.endereco)) then
      NEW.endereco := concat_ws(', ',
        trim(NEW.logradouro) || case when NEW.numero is not null and trim(NEW.numero) <> '' then ', ' || trim(NEW.numero) else '' end,
        nullif(trim(NEW.complemento), ''),
        nullif(trim(NEW.bairro), ''),
        case when NEW.cidade is not null and trim(NEW.cidade) <> '' then
          trim(NEW.cidade) || case when NEW.estado is not null and trim(NEW.estado) <> '' then ' - ' || trim(NEW.estado) else '' end
        else null end,
        case when NEW.cep is not null and trim(NEW.cep) <> '' then 'CEP: ' || trim(NEW.cep) else null end
      );
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists clientes_formatar_endereco on clientes;
create trigger clientes_formatar_endereco
  before insert or update on clientes
  for each row execute function trg_formatar_endereco_cliente();

-- 5. Atualizar a RPC criar_pedido para congelar o endereço do cliente no pedido automaticamente
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

  -- 1. Pré-calcula o valor_total
  select coalesce(sum((i->>'quantidade')::int * pr.preco_unitario), 0)
    into v_total
    from jsonb_array_elements(p_itens) as i
    join produtos pr on pr.id = (i->>'produto_id')::uuid;

  -- 2. Insere o pedido congelando o endereço da instalação e o ponto de referência do cliente
  insert into pedidos (cliente_id, observacoes, valor_total, endereco_instalacao, ponto_referencia)
  select p_cliente_id, nullif(trim(p_observacoes), ''), v_total, c.endereco, c.ponto_referencia
    from clientes c where c.id = p_cliente_id
  returning id into v_id;

  -- 3. Insere os itens_pedido agrupados
  insert into itens_pedido (pedido_id, produto_id, quantidade)
  select v_id, (i->>'produto_id')::uuid, sum((i->>'quantidade')::int)
    from jsonb_array_elements(p_itens) as i
   group by (i->>'produto_id')::uuid;

  return v_id;
end $$;

-- 6. Atualizar a view v_instalacoes para priorizar o endereco_instalacao do pedido
drop view if exists v_instalacoes cascade;

create view v_instalacoes with (security_invoker = true) as
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
