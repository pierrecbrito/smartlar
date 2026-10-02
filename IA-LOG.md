# IA-LOG.md — Registro de Transparência e Uso de Inteligência Artificial

Este documento cumpre o requisito de transparência do processo seletivo, detalhando como a IA (Google Antigravity / Gemini) foi utilizada na concepção, codificação, refatoração e testes do sistema **SmartLar**.

---

## 1. Concepção do Banco de Dados e Scripts SQL
- **O que foi solicitado à IA:**
  - Criação de uma modelagem relacional para a SmartLar contendo clientes, técnicos, produtos, pedidos, itens de pedidos e histórico de auditoria.
  - Implementação de regras de negócio em nível de banco de dados (constraints, triggers PL/pgSQL, views agregadas com security_invoker e RPC transacional).
  - Elaboração de dados de seed com cenários realistas de teste (ex: 2 câmeras + 1 sensor = R$ 1.080,00).
- **O que foi aceito:**
  - O uso de triggers `pedidos_bi`, `pedidos_bu`, `pedidos_ai`, `itens_bi` e `itens_ai`.
  - Coluna gerada `subtotal numeric(12,2) generated always as (quantidade * preco_unitario) stored`.
  - RPC atômica `criar_pedido` que agrupa itens repetidos e garante consistência em transação única.
  - Regra de snapshot de preço em `itens_pedido.preco_unitario`.
- **O que foi adaptado/rejeitado:**
  - **Ajuste de Fuso Horário:** Ajustadas as views para explicitamente converter para `'America/Sao_Paulo'` (`at time zone 'America/Sao_Paulo'`), garantindo que consultas em virada de mês reflitam o horário local de operação no Brasil.
  - **Datas Relativas no Seed:** Em vez de datas estáticas em 2024/2025, o seed foi adaptado para datas relativas a `now()` / `current_date + 1`, permitindo que os alertas do n8n e o dashboard sempre tenham dados vivos na data da avaliação.

---

## 2. Frontend (Arquitetura e Implementação de Telas)
- **O que foi solicitado à IA:**
  - Estruturação de SPA com Vite, React, TypeScript, Tailwind CSS e integração direta com `@supabase/supabase-js`.
  - Desenvolvimento das 6 telas essenciais:
    1. Dashboard com KPIs consolidados da view `v_dashboard_resumo`.
    2. Catálogo de Produtos com busca, filtros por categoria e status ativo/inativo.
    3. Gestão de Clientes com busca e cadastro rápido em modal.
    4. Criação de Novo Pedido (carrinho reativo, snapshot de preço, subtotal dinâmico e chamada da RPC `criar_pedido`).
    5. Gestão de Pedidos com máquina de estados visual (somente transições válidas), modal de agendamento e visualização de histórico.
    6. Agenda de Instalações (`v_instalacoes`) com ações para técnicos e detecção de conflitos de horário.
- **O que foi aceito:**
  - Layout limpo, responsivo e baseado em componentes reutilizáveis.
  - Tratamento preventivo de transições na UI e captura elegante de erros do Postgres via Toast.
  - Uso estrito de dados vindos do Supabase (zero mock data).
- **O que foi adaptado/rejeitado:**
  - Rejeitado qualquer cálculo de total do pedido no front como fonte de verdade — o front apenas exibe a prévia calculada reativamente e, ao gravar, confia no retorno do banco.

---

## 3. Automações n8n
- **O que foi solicitado à IA:**
  - Modelagem dos 3 fluxos de automação (Novo Pedido Webhook, Alerta do Dia Seguinte Cron, e Pedido Concluído Webhook).
  - Estruturação de payloads, headers de segurança e tratamento de idempotência.
- **O que foi aceito:**
  - Padrão de re-busca do pedido com `GET /rest/v1/pedidos?id=eq.{{id}}&select=...` para garantir integridade pós-trigger.
  - Expressão Luxon no n8n (`$now.plus({days:1}).startOf('day').toISO()`) com timezone configurado para `America/Sao_Paulo`.

---

## 4. Auditoria e RLS
- **O que foi solicitado à IA:**
  - Políticas de Row Level Security (RLS) seguras e que não quebrem a visualização pública caso o avaliador teste sem login.
- **Decisão tomada:**
  - O script `03_rls.sql` foi isolado para ser ativado com autenticação configurada, mantendo no documento instruções claras de credenciais de teste para o recrutador.
