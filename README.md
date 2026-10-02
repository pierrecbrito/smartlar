# 🏠 SmartLar — Sistema de Gestão de Vendas e Instalações

Sistema completo para gestão de orçamentos, vendas e agendamento de instalações de automação residencial e segurança eletrônica.

Desenvolvido com foco em **arquitetura resiliente**: regras de negócio e integridade garantidas no banco de dados (PostgreSQL / Supabase), frontend moderno e performático (React + TypeScript + Tailwind CSS), e automações orientadas a eventos (n8n).

---

## 🚀 Arquitetura & Stack Tecnológica

```
┌──────────────────────────────────────────────────────────────┐
│                      Frontend (SPA)                          │
│     Vite + React + TypeScript + Tailwind CSS + Lucide Icons   │
│                 @supabase/supabase-js Client                 │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    Supabase / PostgreSQL                     │
│  • Constraints de Domínio & Validação de Telefone/Email       │
│  • Triggers PL/pgSQL:                                        │
│    - pedidos_bi: nascimento obrigatório como 'orcamento'     │
│    - pedidos_bu: máquina de estados estrita (não volta/pula) │
│    - pedidos_ai: auditoria automática em historico_status    │
│    - itens_bi / itens_ai: snapshot de preço e recálculo total│
│  • RPC criar_pedido(): transação atômica pedido + itens      │
│  • Views: v_dashboard_resumo, v_instalacoes (security invoker)│
│  • Row Level Security (RLS) com políticas por usuário        │
└──────────────────────────────┬───────────────────────────────┘
                               │ Database Webhooks / Cron
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                     Automações (n8n)                         │
│  • Workflow 1: Notificação de Novo Pedido (Webhook + Re-busca)│
│  • Workflow 2: Alerta diário de instalações de amanhã (Cron) │
│  • Workflow 3: Registro consolidado de vendas concluídas     │
└──────────────────────────────────────────────────────────────┘
```

---

## 📋 Regras de Negócio Implementadas no Banco

1. **Ciclo de Vida do Pedido (Máquina de Estados):**
   - Todo pedido nasce impreterivelmente como `orcamento`.
   - Transições permitidas:
     - `orcamento` ➔ `aprovado` ou `cancelado`
     - `aprovado` ➔ `agendado` (exige `tecnico_id` e `data_instalacao`) ou `cancelado`
     - `agendado` ➔ `em_andamento`
     - `em_andamento` ➔ `concluido` (marca automaticamente `concluido_em = now()`)
   - Qualquer tentativa de pular etapas ou regredir status é rejeitada pelo Postgres com exceção explícita.

2. **Snapshot de Preço e Subtotal Imutável:**
   - O preço unitário é copiado para `itens_pedido.preco_unitario` no momento da inserção. Reajustes futuros no catálogo de produtos não alteram vendas passadas.
   - O `subtotal` é uma coluna computada no banco (`generated always as (quantidade * preco_unitario) stored`).

3. **Cálculo de Total Automatizado:**
   - O `valor_total` de `pedidos` é mantido exclusivamente pela trigger `itens_ai`. O cliente nunca envia o total manual.

4. **Operação Atômica (`criar_pedido`):**
   - Criação de pedido e associação de múltiplos itens executados em uma única transação PL/pgSQL. Caso haja itens duplicados, as quantidades são somadas automaticamente.

---

## 🛠️ Estrutura do Projeto

```
smartlar/
├── 01_schema.sql         # Definição de tabelas, enums, triggers, views e RPC
├── 02_seed.sql           # Carga inicial com cenários de teste realistas
├── 03_rls.sql            # Políticas de Row Level Security (ativar após login)
├── DECISIONS.md          # Registro detalhado das decisões arquiteturais
├── IA-LOG.md             # Registro de transparência do uso de Inteligência Artificial
├── PLANO_PROJETO.md      # Cronograma tático, checklist e matriz de defesa
├── n8n/                  # Workflows exportados em JSON para o n8n
│   ├── workflow_1_novo_pedido.json
│   ├── workflow_2_alerta_diario.json
│   └── workflow_3_pedido_concluido.json
└── src/                  # Aplicação Frontend (React + Vite + TypeScript)
    ├── components/       # Componentes de UI modulares e responsivos
    ├── pages/            # Dashboard, Clientes, Produtos, Pedidos, Agenda
    ├── lib/              # Cliente Supabase, utilitários de formatação e moeda
    └── types/            # Tipagens TypeScript derivadas do schema
```

---

## 🧪 Roteiro de Validação e Testes no Banco

Após rodar `01_schema.sql` e `02_seed.sql` no Supabase SQL Editor:

### 1. Teste do Enunciado (2 Câmeras + 1 Sensor = R$ 1.080,00)
```sql
select p.id, c.nome, p.valor_total, p.status
  from pedidos p
  join clientes c on c.id = p.cliente_id
 where c.nome = 'Marina Costa' and p.status = 'concluido';
-- Resultado esperado: valor_total = 1080.00
```

### 2. Validação da View de Indicadores do Dashboard
```sql
select * from v_dashboard_resumo;
-- Retorna pedidos_mes, faturado_mes, a_receber e pendentes_agendamento
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

## ⚡ Como Rodar o Frontend Localmente

1. **Instalar Dependências:**
   ```bash
   npm install
   ```

2. **Configurar Variáveis de Ambiente:**
   Crie um arquivo `.env` baseado no `.env.example`:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
   ```

3. **Iniciar Servidor de Desenvolvimento:**
   ```bash
   npm run dev
   ```

---

## 📦 Automações no n8n

1. **Automação 1 — Notificação de Novo Pedido:**
   - Gatilho: Database Webhook no Supabase disparado no `INSERT` da tabela `pedidos`.
   - Node HTTP: Re-busca os dados completos (`id`, `valor_total`, `cliente(nome, telefone)`).
   - Envio de notificação imediata (Slack/Discord/Email ou Google Sheets).

2. **Automação 2 — Alerta Diário de Instalações:**
   - Gatilho: Schedule diário às 07:00 (Timezone `America/Sao_Paulo`).
   - Node HTTP: Consulta na view `v_instalacoes` filtrando agendamentos do dia seguinte.
   - Envio de briefing aos técnicos com rotas e observações de instalação.

3. **Automação 3 (Bônus) — Registro de Pedidos Concluídos:**
   - Gatilho: Database Webhook disparado no `UPDATE` de `pedidos` quando `status = 'concluido'`.
   - Atualiza planilha financeira e confirma faturamento do mês.

---

## 📄 Documentação & Governança

- [DECISIONS.md](DECISIONS.md) — Racional técnico e justificativa de arquitetura.
- [IA-LOG.md](IA-LOG.md) — Relatório de transparência do uso de Inteligência Artificial.
- [PLANO_PROJETO.md](PLANO_PROJETO.md) — Planejamento estratégico e matriz de avaliação.
