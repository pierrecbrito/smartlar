# DECISIONS.md — Registro de Decisões Técnicas e Arquiteturais

Este documento registra todas as decisões técnicas tomadas na concepção e implementação do **SmartLar**, detalhando as motivações, trade-offs e justificativas para cada escolha.

---

## 1. Banco de Dados e Regras de Negócio

### 1.1 Regras de Negócio no Banco (PostgreSQL / Supabase) em vez do Frontend
- **Decisão:** Validação de transições de status, integridade dos itens, exigência de técnico/data no agendamento e recálculo de valores foram implementados estritamente via constraints, triggers e funções PL/pgSQL.
- **Motivação:** O frontend é volátil e pode ser burlado via requisições diretas à API (cURL, Postman) ou por falhas na UI. Concentrar as regras no PostgreSQL garante integridade absoluta dos dados independente de quem consuma a API (Front, automações n8n, integrações futuras).
- **Trade-off:** Lógica PL/pgSQL exige testes no banco e tratamento adequado das mensagens de erro na camada de apresentação (toasts na UI).

### 1.2 Snapshot de Preço em `itens_pedido.preco_unitario`
- **Decisão:** O preço unitário do produto é copiado no momento da criação do item (`preco_unitario numeric(10,2) not null`) e congelado.
- **Motivação:** Evita que reajustes cadastrais em `produtos` alterem retroativamente orçamentos e pedidos faturados no passado.
- **Implementação:** Coluna `subtotal` gerada automaticamente (`generated always as (quantidade * preco_unitario) stored`), eliminando divergências de arredondamento.

### 1.3 Criação Atômica de Pedidos via RPC (`criar_pedido`)
- **Decisão:** Implementação de uma stored procedure (`criar_pedido`) que recebe o `cliente_id`, `observacoes` e a lista de itens (`jsonb`) e executa em uma única transação no Postgres.
- **Motivação:** Se o front enviasse o `INSERT` em `pedidos` e depois os `INSERT` em `itens_pedido`, uma instabilidade de rede deixaria pedidos "órfãos" sem itens ou com total zerado. Além disso, a RPC agrupa produtos duplicados somando as quantidades automaticamente.

### 1.4 Máquina de Estados com Trilha de Auditoria Automática
- **Decisão:** Trigger `pedidos_bu` bloqueia transições inválidas (não permite voltar etapas nem pular estágios). Trigger `pedidos_ai` insere registros na tabela `historico_status` automaticamente a cada mudança.
- **Estados Permitidos:**
  - `orcamento` ➔ `aprovado` | `cancelado`
  - `aprovado` ➔ `agendado` | `cancelado` (exige `tecnico_id` e `data_instalacao`)
  - `agendado` ➔ `em_andamento`
  - `em_andamento` ➔ `concluido` (preenche automaticamente `concluido_em = now()`)

### 1.5 Tratamento Temporal e Fuso Horário (`America/Sao_Paulo`)
- **Decisão:** Utilização de `timestamptz` para todas as colunas de data/hora (`data_instalacao`, `concluido_em`, `created_at`, `updated_at`) e consultas agregadoras calculadas no timezone `'America/Sao_Paulo'`.
- **Motivação:** O indicador "Faturado no mês" e as rotinas do n8n (instalações do dia seguinte) dependem do calendário civil brasileiro, evitando viradas de mês incorretas causadas por UTC puro.

### 1.6 Views Especializadas para Reduzir Carga e Complexidade
- **Decisão:** Criação de `v_dashboard_resumo` e `v_instalacoes` com `security_invoker = true`.
- **Motivação:** Simplifica drasticamente o consumo pelo frontend e pelos workflows do n8n, evitando múltiplos `JOIN`s repetitivos no cliente e mantendo o RLS respeitado.

---

## 2. Frontend

### 2.1 Stack: Vite + React + TypeScript + Tailwind CSS + Lucide Icons + Supabase JS
- **Decisão:** SPA rápida, tipada e leve com Tailwind CSS para layout responsivo e moderno.
- **Motivação:** Alta produtividade, performance instantânea de carregamento e compatibilidade nativa com TypeScript para tipar o schema do Supabase.

### 2.2 Consumo Fino e Leitura Pós-Mutação
- **Decisão:** O front não calcula totais finais para envio ao banco. Ao criar o pedido via `criar_pedido`, a interface relê o registro retornado do banco (`valor_total`), exibindo o valor computado pela trigger oficial.

### 2.3 Bloqueio Visual Preventivo + Toasts de Erro do Banco
- **Decisão:** A UI exibe apenas os botões de transição permitidos para o status atual do pedido. Se ainda assim houver tentativa inválida ou erro inesperado, a exceção lançada pelo Postgres é capturada e exibida amigavelmente via notificação toast.

---

## 3. Automações e Integrações (n8n)

### 3.1 Idempotência e Re-busca de Payload
- **Decisão:** No webhook de novo pedido (Automação 1), o n8n não utiliza apenas o payload bruto do trigger (que chega com total zero ou dados parciais no momento exato do INSERT). Em vez disso, efetua um `GET /rest/v1/pedidos?id=eq.ID&select=...,cliente:clientes(...)` logo na sequência.
- **Motivação:** Garante dados consolidados após a execução das triggers de itens e evita race condition.

### 3.2 Segurança de Credenciais
- **Decisão:** A chave `service_role` é mantida estritamente dentro do n8n (ignora RLS com segurança de backend) e nunca exposta no cliente frontend (`VITE_SUPABASE_ANON_KEY`).
