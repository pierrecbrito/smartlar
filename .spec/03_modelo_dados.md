# 03 — Modelo de Dados e Dicionário do Banco

## 1. Diagrama Entidade-Relacionamento (ERD)

```
 ┌──────────────┐             ┌──────────────┐
 │   clientes   │1           *│   pedidos    │*          1┌──────────────┐
 │──────────────│─────────────│──────────────│────────────│   tecnicos   │
 │ id (PK)      │             │ id (PK)      │            │──────────────│
 │ nome         │             │ cliente_id FK│            │ id (PK)      │
 │ email        │             │ tecnico_id FK│            │ nome         │
 │ telefone     │             │ status       │            │ email        │
 │ endereco     │             │ data_instal. │            │ telefone     │
 │ bairro       │             │ valor_total  │            │ especialidade│
 │ cidade       │             │ observacoes  │            │ ativo        │
 └──────────────┘             │ concluido_em │            └──────────────┘
                              └──────┬───────┘
                                     │1
                                     │
                                     │*
                              ┌──────┴───────┐            ┌──────────────┐
                              │ itens_pedido │*          1│   produtos   │
                              │──────────────│────────────│──────────────│
                              │ id (PK)      │            │ id (PK)      │
                              │ pedido_id FK │            │ nome         │
                              │ produto_id FK│            │ categoria    │
                              │ quantidade   │            │ preco        │
                              │ preco_unit.  │            │ descricao    │
                              │ subtotal     │            │ ativo        │
                              └──────────────┘            └──────────────┘
```

---

## 2. Tabelas Principais

### 2.1 `clientes`
Armazena a base de clientes físicos e jurídicos atendidos pela SmartLar com endereço estruturado e busca automática por CEP.

| Coluna | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Identificador único |
| `nome` | `text` | `not null` | Nome completo do cliente |
| `email` | `text` | `null`, `check (email ~* '^.+@.+\..+$')` | E-mail corporativo/pessoal |
| `telefone` | `text` | `not null`, `check (between 10 and 13 digits)` | Telefone celular / WhatsApp |
| `cep` | `varchar(9)` | `null` | CEP com máscara (ex: 51020-000) |
| `logradouro` | `text` | `null` | Rua, Avenida, etc. |
| `numero` | `text` | `null` | Número predial ou 'S/N' |
| `complemento` | `text` | `null` | Apto, Bloco, Sala |
| `bairro` | `text` | `null` | Bairro da instalação |
| `cidade` | `text` | default `'Recife'` | Município |
| `estado` | `varchar(2)` | default `'PE'` | UF |
| `ponto_referencia` | `text` | `null` | Orientações de localização para a equipe técnica |
| `endereco` | `text` | `not null` | Endereço completo consolidado |
| `created_at` | `timestamptz` | default `now()` | Timestamp de criação |

### 2.2 `produtos`
Catálogo de dispositivos, sensores e equipamentos de automação e segurança.

| Coluna | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Identificador único |
| `nome` | `varchar(150)` | `not null` | Nome comercial do produto |
| `categoria` | `varchar(50)` | `check (categoria in ('automacao', 'seguranca', 'cameras', 'energia', 'audio_video', 'redes'))` | Segmento |
| `preco` | `numeric(10,2)` | `not null`, `check (preco >= 0)` | Preço unitário corrente |
| `descricao` | `text` | `null` | Detalhes e especificações |
| `imagem_url` | `text` | `null` | URL da foto do produto |
| `ativo` | `boolean` | default `true` | Disponível para novos orçamentos |
| `created_at` | `timestamptz` | default `now()` | Data de cadastro |

### 2.3 `tecnicos`
Quadro de instaladores e técnicos de campo autorizados.

| Coluna | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Identificador único |
| `nome` | `varchar(150)` | `not null` | Nome do profissional |
| `email` | `varchar(150)` | `unique, not null` | E-mail institucional |
| `telefone` | `varchar(20)` | `not null` | Contato celular |
| `especialidade` | `varchar(80)` | `null` | Ex: Fechaduras, Cabeamento, Câmeras |
| `ativo` | `boolean` | default `true` | Disponível na agenda |

### 2.4 `pedidos`
Cabeçalho do pedido/orçamento e controle da máquina de estados, com snapshot do endereço e ponto de referência.

| Coluna | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Identificador do pedido |
| `cliente_id` | `uuid` | FK `clientes(id)`, `not null` | Cliente solicitante |
| `tecnico_id` | `uuid` | FK `tecnicos(id)`, `null` | Técnico alocado (obrigatório se agendado) |
| `status` | `varchar(20)` | `check (status in ('orcamento', 'aprovado', 'agendado', 'em_andamento', 'concluido', 'cancelado'))` | Status do ciclo de vida |
| `data_instalacao` | `timestamptz`| `null` | Data/hora da instalação |
| `valor_total` | `numeric(12,2)` | default `0.00` | Total consolidado dos itens |
| `forma_pagamento` | `tipo_pagamento` | `null` | Pix, Cartão, Boleto, etc. |
| `observacoes` | `text` | `null` | Notas comerciais ou técnicas |
| `endereco_instalacao` | `text` | `null` | Snapshot congelado do endereço no momento do pedido |
| `ponto_referencia` | `text` | `null` | Snapshot da referência para a equipe técnica |
| `concluido_em` | `timestamptz`| `null` | Data/hora de conclusão real |
| `created_at` | `timestamptz` | default `now()` | Criação do orçamento |
| `updated_at` | `timestamptz` | default `now()` | Última alteração |

### 2.5 `itens_pedido`
Produtos vinculados a cada pedido com preço congelado no momento da venda.

| Coluna | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Identificador do item |
| `pedido_id` | `uuid` | FK `pedidos(id)` on delete cascade | Pedido associado |
| `produto_id` | `uuid` | FK `produtos(id)` | Produto associado |
| `quantidade` | `integer` | `not null`, `check (quantidade > 0)` | Quantidade de unidades |
| `preco_unitario` | `numeric(10,2)` | `not null`, `check (preco_unitario >= 0)` | Preço unitário capturado |
| `subtotal` | `numeric(12,2)` | `generated always as (quantidade * preco_unitario) stored` | Subtotal imutável computado |

### 2.6 `historico_status`
Trilha de auditoria gerada automaticamente a cada alteração de status em `pedidos`.

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `pedido_id` | `uuid` | FK `pedidos(id)` |
| `status_anterior` | `varchar(20)` | Status antes da transição |
| `status_novo` | `varchar(20)` | Status após a transição |
| `alterado_em` | `timestamptz` | Timestamp exato da mutação |

---

## 3. Views Especializadas

### 3.1 `v_dashboard_resumo` (`security_invoker = true`)
Fornece métricas consolidadas em uma única requisição:
- `faturamento_mes_atual`: soma dos pedidos `concluido` no mês corrente (`America/Sao_Paulo`).
- `total_pedidos`: contagem total de pedidos.
- `pedidos_orcamento`, `pedidos_aprovados`, `pedidos_agendados`, `pedidos_em_andamento`, `pedidos_concluidos`, `pedidos_cancelados`.
- `instalacoes_hoje`: contagem de instalações previstas para hoje.

### 3.2 `v_instalacoes` (`security_invoker = true`)
Consolidação detalhada da agenda de instalações unindo:
- Dados do pedido (`id`, `data_instalacao`, `status`, `valor_total`).
- Dados do cliente (`nome`, `telefone`, `endereco`, `bairro`, `cidade`).
- Dados do técnico (`nome`, `especialidade`, `telefone`).
- Quantidade total de itens e resumo dos produtos.
