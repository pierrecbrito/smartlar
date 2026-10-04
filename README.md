# SmartLar — Sistema de Gestão de Vendas e Instalações

Sistema completo para gestão de orçamentos, vendas e agendamento de instalações de automação residencial e segurança eletrônica.

Desenvolvido para o teste técnico da **IAplicada** (Junior No-Code Dev), com foco em **arquitetura resiliente**: regras de negócio e integridade garantidas no banco de dados (PostgreSQL 16 / Supabase), frontend com design de ponta inspirado em tablet POS (React + TypeScript + Tailwind CSS) estruturado com princípios SOLID, e automações orientadas a eventos (n8n).

---

## Arquitetura & Stack Tecnológica

```
┌──────────────────────────────────────────────────────────────┐
│                   Frontend Tablet POS (SPA)                  │
│     Vite + React + TypeScript + Tailwind CSS + Lucide Icons   │
│                 @supabase/supabase-js Client                 │
│   - Slim dark icon rail com notch visual ativo               │
│   - Painel lateral fixo (Order Details Drawer) com stepper   │
│   - Filtros de categoria e status em pílulas (Pills)         │
│   - Arquitetura modular: páginas orquestradoras (< 200 linhas)│
│     e componentes especialistas desacoplados (SOLID)         │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    Supabase / PostgreSQL                     │
│  - Constraints de Domínio & Validação de Telefone/Email       │
│  - Triggers PL/pgSQL:                                        │
│    * pedidos_bi: nascimento obrigatório como 'orcamento'     │
│    * pedidos_bu: máquina de estados estrita (não volta/pula) │
│    * pedidos_ai: auditoria automática em historico_status    │
│    * itens_bi / itens_ai: snapshot de preço e recálculo total│
│  - RPC criar_pedido(): transação atômica pedido + itens      │
│  - Views: v_dashboard_resumo, v_instalacoes (security invoker)│
│  - Row Level Security (RLS) com políticas por perfil         │
└──────────────────────────────────────────────────────────────┘
```

---

## Regras de Negócio Implementadas no Banco

1. **Ciclo de Vida do Pedido (Máquina de Estados):**
   - Todo pedido nasce impreterivelmente como `orcamento`.
   - Transições permitidas:
     - `orcamento` -> `aprovado` ou `cancelado`
     - `aprovado` -> `agendado` (exige obrigatoriamente `tecnico_id` e `data_instalacao`) ou `cancelado`
     - `agendado` -> `em_andamento`
     - `em_andamento` -> `concluido` (marca automaticamente `concluido_em = now()`)
   - Qualquer tentativa de pular etapas ou regredir status é rejeitada pelo Postgres com exceção explícita (`400 Bad Request`).

2. **Snapshot de Preço e Subtotal Imutável:**
   - O preço unitário é copiado para `itens_pedido.preco_unitario` no momento da inserção. Reajustes futuros no catálogo de produtos não alteram vendas passadas.
   - O `subtotal` é uma coluna computada no banco (`generated always as (quantidade * preco_unitario) stored`).

3. **Cálculo de Total Automatizado:**
   - O `valor_total` de `pedidos` é mantido exclusivamente pela trigger `itens_ai`. O cliente nunca envia o total manual.

4. **Operação Atômica (`criar_pedido`):**
   - Criação de pedido e associação de múltiplos itens executados em uma única transação PL/pgSQL. Caso haja itens duplicados, as quantidades são somadas automaticamente.

---

## Estrutura do Projeto

O código do frontend segue estritamente os princípios SOLID (especialmente Responsabilidade Única - SRP), com páginas atuando apenas como orquestradoras e componentes visuais e modais isolados em subpastas dedicadas:

```
smartlar/
├── .spec/                # Especificação funcional, técnica, SQL e governança
│   ├── 01_visao_geral.md
│   ├── 02_regras_negocio.md
│   ├── 03_modelo_dados.md
│   ├── 04_requisitos_funcionais.md
│   ├── 05_design_system_ux.md
│   ├── 06_seguranca_auditoria.md
│   ├── 07_casos_de_teste.md
│   ├── database/         # Scripts SQL e migrações do banco
│   │   ├── 01_schema.sql # DDL de tabelas, enums, triggers, views e RPC
│   │   ├── 02_seed.sql   # Carga inicial com cenários de teste realistas
│   │   ├── 03_rls.sql    # Políticas de Row Level Security
│   │   └── 04_storage_orcamentos.sql # Setup do bucket 'orcamentos' e policies
│   └── docs/             # Documentos de apoio, decisões e histórico
│       ├── DECISIONS.md  # Registro detalhado das decisões arquiteturais
│       ├── IA-LOG.md     # Registro de transparência do uso de IA
│       ├── PLANO_PROJETO.md # Cronograma tático e matriz de avaliação
│       └── n8n/          # Workflows exportados do n8n para automações externas
│           ├── 01_novo_pedido.json # Automação 1: Webhook Supabase -> Re-Fetch View -> Google Sheets
│           ├── 02_alerta_diario_instalacoes.json # Automação 2: Cron diário -> Supabase -> WhatsApp (CallMeBot)
│           └── 03_pedido_concluido.json # Automação 3 (Bônus): Webhook Update -> Faturamento no Google Sheets
└── src/                  # Aplicação Frontend (React + Vite + TypeScript)
    ├── components/       # Componentes de UI modulares desacoplados
    │   ├── agenda/       # Agenda (Toolbar, Views Diária/Semanal/Mensal, Modais)
    │   ├── clientes/     # Clientes (ClientesList Mobile/Desktop, Modais de Pedidos e Novo Cliente)
    │   ├── dashboard/    # Dashboard (Métricas, Agenda, Pendentes de Aprovação, Técnicos)
    │   ├── novo-pedido/  # PDV (Catálogo, Carrinho Drawer, Modal de Sucesso)
    │   ├── pedidos/      # Pedidos (Filtros, Kanban D&D, Lista, Modais de Agendamento/Histórico/Itens)
    │   ├── produtos/     # Produtos (Filtros, Tabela/Cards, Modais de Preço e Novo Equipamento)
    │   ├── ErrorBoundary.tsx # Barreira global de erros de renderização
    │   ├── ModalPortal.tsx   # Portal React para renderização de modais no body
    │   ├── OrcamentoPdfModal.tsx # Geração de proposta comercial em PDF e envio WhatsApp
    │   ├── Skeleton.tsx  # Placeholders de carregamento progressivo
    │   └── Toast.tsx     # Contexto e renderizador de notificações toast
    ├── hooks/            # Custom Hooks desacoplados (useAgenda, useNovoPedido)
    ├── pages/            # 6 Páginas orquestradoras enxutas (< 200 linhas cada)
    ├── lib/              # Cliente Supabase, utilitários, formatações e integração ViaCEP
    └── types/            # Tipagens TypeScript derivadas do schema do banco
```

---

## Roteiro de Validação e Testes no Banco

O banco de dados de produção está configurado no Supabase:
- **URL:** `https://eyjfofrwjixirbuvvlmk.supabase.co`

### 1. Teste do Enunciado (2 Câmeras + 1 Sensor = R$ 1.080,00)
```sql
select p.id, c.nome, p.valor_total, p.status
  from pedidos p
  join clientes c on c.id = p.cliente_id
 where c.nome = 'Marina Costa' and p.status = 'concluido';
-- Resultado esperado: valor_total = 1080.00 (R$ 480 x 2 + R$ 120 x 1)
```

### 2. Validação da View de Indicadores do Dashboard
```sql
select * from v_dashboard_resumo;
-- Retorna: pedidos_mes, faturado_mes, a_receber e pendentes_agendamento
```

### 3. Validação das Recusas da Máquina de Estados (Devem falhar)
```sql
-- Erro 1: Pular etapa (orcamento -> em_andamento)
update pedidos set status = 'em_andamento' where status = 'orcamento';

-- Erro 2: Voltar etapa (aprovado -> orcamento)
update pedidos set status = 'orcamento' where status = 'aprovado';

-- Erro 3: Agendar sem definir técnico e data de instalação
update pedidos set status = 'agendado' where status = 'aprovado';
```

---

## Como Rodar o Frontend Localmente

1. **Instalar Dependências:**
   ```bash
   npm install
   ```

2. **Configurar Variáveis de Ambiente:**
   As variáveis já estão configuradas no arquivo `.env`:
   ```env
   VITE_SUPABASE_URL=https://eyjfofrwjixirbuvvlmk.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Iniciar Servidor de Desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse a interface no navegador em `http://localhost:5173`.

---

## Especificação do Projeto (`.spec/`)

A especificação completa do sistema encontra-se catalogada na pasta [`.spec/`](.spec/README.md):
- [01_visao_geral.md](.spec/01_visao_geral.md) — Visão geral, objetivos, personas e stack.
- [02_regras_negocio.md](.spec/02_regras_negocio.md) — Máquina de estados, congelamento de preço e RPC atômica.
- [03_modelo_dados.md](.spec/03_modelo_dados.md) — Dicionário de dados, tabelas, views e triggers.
- [04_requisitos_funcionais.md](.spec/04_requisitos_funcionais.md) — Requisitos funcionais das 6 telas da aplicação.
- [05_design_system_ux.md](.spec/05_design_system_ux.md) — Design system Tablet POS, paleta e componentes.
- [06_seguranca_auditoria.md](.spec/06_seguranca_auditoria.md) — RLS, auditoria e segurança.
- [07_casos_de_teste.md](.spec/07_casos_de_teste.md) — Roteiro de testes de conformidade.

---

## Histórico de Governança & Decisões (`.spec/docs/`)

- [DECISIONS.md](.spec/docs/DECISIONS.md) — Racional técnico e justificativa de arquitetura.
- [IA-LOG.md](.spec/docs/IA-LOG.md) — Relatório de transparência do uso de Inteligência Artificial.
- [PLANO_PROJETO.md](.spec/docs/PLANO_PROJETO.md) — Planejamento estratégico e matriz de avaliação.
- [teste-pratico-dev-nocode-junior.pdf](.spec/docs/teste-pratico-dev-nocode-junior.pdf) — Documento de especificação original.
