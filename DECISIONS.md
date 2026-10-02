# DECISIONS.md — Registro de Decisões Técnicas e Arquiteturais

Este documento registra todas as decisões técnicas tomadas na concepção e implementação do **SmartLar**, detalhando as motivações, trade-offs, justificativas e pontos de defesa para a entrevista técnica.

---

## 1. Banco de Dados e Regras de Negócio (PostgreSQL 16 / Supabase)

### 1.1 Regras de Negócio no Banco em vez do Frontend
- **Decisão:** Validação de transições de status, integridade dos itens, exigência de técnico/data no agendamento e recálculo de valores foram implementados estritamente via constraints, triggers e funções PL/pgSQL.
- **Motivação:** O frontend é uma camada volátil e manipulável pelo usuário (inspeção de rede, chamadas diretas via cURL/Postman). Ao centralizar as regras no PostgreSQL, qualquer agente consumidor (interface web, aplicativo mobile, automações n8n ou webhooks) é obrigado a respeitar as restrições de integridade.
- **Trade-off:** Exige testes automatizados em nível de banco e mapeamento adequado das exceções (`RAISE EXCEPTION`) para que o frontend exiba mensagens humanas via toasts.

### 1.2 Snapshot de Preço em `itens_pedido.preco_unitario`
- **Decisão:** O preço unitário do produto é capturado no momento da criação do item (`preco_unitario numeric(10,2) not null`) e congelado.
- **Motivação:** Se a empresa reajustar o preço de uma câmera de R$ 450 para R$ 520, pedidos e orçamentos anteriores não podem sofrer alteração retrospectiva.
- **Implementação:** Coluna `subtotal` gerada automaticamente (`generated always as (quantidade * preco_unitario) stored`), eliminando qualquer discrepância de arredondamento.

### 1.3 Criação Atômica de Pedidos via RPC (`criar_pedido`)
- **Decisão:** Implementação de uma stored procedure com transação implícita (`criar_pedido`) que recebe o `cliente_id`, `observacoes` e a lista de itens (`jsonb`).
- **Motivação:** O método tradicional de fazer um `INSERT` em `pedidos` seguido de `INSERT`s em loop na tabela `itens_pedido` é vulnerável a falhas de conexão no meio do processo, deixando pedidos órfãos, com total zerado ou itens pela metade. A RPC garante ACID: ou o pedido nasce completo com seus itens consolidados, ou nada é gravado. Além disso, a função agrupa itens duplicados somando as quantidades.

### 1.4 Máquina de Estados Blindada com Trilha de Auditoria Automática
- **Decisão:** A trigger `pedidos_bu` valida rigorosamente a máquina de estados, impedindo pulos ou retrocessos. A trigger `pedidos_ai` popula a tabela `historico_status` a cada mutação de forma assíncrona para o cliente.
- **Fluxo Autorizado:**
  - `orcamento` ➔ `aprovado` | `cancelado`
  - `aprovado` ➔ `agendado` | `cancelado` (exige obrigatoriamente `tecnico_id` e `data_instalacao`)
  - `agendado` ➔ `em_andamento`
  - `em_andamento` ➔ `concluido` (preenche automaticamente `concluido_em = now()`)
- **Defesa na Entrevista:** Tentativas de mudar diretamente de `orcamento` para `em_andamento` ou agendar sem técnico disparam `400 Bad Request` com código de erro amigável.

### 1.5 Tratamento Temporal e Fuso Horário (`America/Sao_Paulo`)
- **Decisão:** Utilização de `timestamptz` para todas as colunas de data/hora (`data_instalacao`, `concluido_em`, `created_at`, `updated_at`) e conversão explícita para o fuso `'America/Sao_Paulo'` nas views agregadoras.
- **Motivação:** O indicador "Faturado no mês" e os agendamentos matinais dependem do calendário civil brasileiro. Armazenar em UTC sem tratamento de fuso causaria distorções em viradas de mês e nos disparos do cron do n8n.

### 1.6 Views Especializadas (`v_dashboard_resumo` e `v_instalacoes`)
- **Decisão:** Views com `security_invoker = true` centralizam consultas complexas.
- **Motivação:** Reduzem o tráfego de rede e a complexidade do frontend e do n8n, eliminando múltiplos `JOIN`s no client-side e respeitando o RLS do usuário conectado.

---

## 2. Frontend e Experiência do Usuário (UI/UX)

### 2.1 Stack Tecnológica
- **Vite 6 + React 18 + TypeScript 5 + Tailwind CSS 3 + Lucide Icons + Supabase JS.**
- **Motivação:** Tempo de carregamento quase instantâneo, tipagem estrita com TypeScript espelhando as tabelas do banco e facilidade de deploy estático em CDNs globais (Vercel, Netlify).

### 2.2 Design System: Tablet POS (Point of Sale) & Clean Light Aesthetics
- **Decisão:** A interface foi projetada inspirando-se em aplicações modernas de PDV e tablets corporativos:
  - **Barra Lateral de Ícones Slim Dark (`#0e131f`, `w-20`):** Máximo aproveitamento horizontal para dados densos e catálogo, com indicador visual estilo "notch" na aba ativa.
  - **Fundo Cool Light (`#f4f5f9`):** Contraste suave e descanso visual para operadores que passam o dia alimentando pedidos.
  - **Cards Brancos em `rounded-3xl`:** Separação limpa com bordas sutis (`border-slate-200/80`), sombras suaves e badges de status expressivos.
  - **Painel Lateral Fixo de Pedido (Order Details Drawer):** Seleção ágil de cliente com badge dinâmico, steppers azuis `[- qtd +]` e totalizadores em tempo real antes da confirmação atômica.
  - **Filtros em Pílula (Pills):** Navegação instantânea por categorias de produtos e estados de pedidos com chips arredondados.

### 2.3 Consumo Fino e Leitura Pós-Mutação
- **Decisão:** O front não calcula totais finais para gravar no banco. Ele utiliza a reatividade local apenas para exibir a prévia de subtotal ao operador e, ao disparar `criar_pedido`, relê o registro retornado do banco com o `valor_total` oficial calculado pelo trigger.

### 2.4 Bloqueio Preventivo na UI + Toasts Informativos
- **Decisão:** Na tela de Gestão de Pedidos, apenas os botões válidos para o próximo passo são renderizados. Ao clicar em "Agendar", abre-se um modal dedicado que obriga o preenchimento de técnico e data. Qualquer recusa do PostgreSQL é capturada pelo bloco `catch` e exibida no toast de erro.

---

## 3. Automações e Integrações (n8n)

### 3.1 Idempotência e Padrão Re-Fetch
- **Decisão:** Na Automação 1 (Novo Pedido via Database Webhook), o payload inicial do PostgreSQL é usado apenas para obter o `id` do pedido. O workflow efetua imediatamente um `GET /rest/v1/pedidos?id=eq.{{id}}&select=*,cliente:clientes(*)` antes de notificar por e-mail ou planilha.
- **Motivação:** Triggers de itens rodam de forma concorrente. Buscar o pedido atualizado garante que o total esteja recalculado e os dados do cliente vinculados com 100% de consistência.

### 3.2 Alerta Diário com Expressão Luxon e Fuso de Brasília
- **Decisão:** A Automação 2 roda diariamente via cron (ex: 07:00 da manhã) filtrando a view `v_instalacoes` com `data_instalacao >= startOf('day') + 1 dia` e `< endOf('day') + 1 dia`.
- **Motivação:** Alerta os técnicos sobre os serviços do dia seguinte, avisando no corpo do e-mail/notificação requisitos especiais (ex: escada alta para instalação externa).

### 3.3 Separação de Credenciais e Segurança
- **Decisão:** A chave `service_role` (que possui privilégios de superusuário) fica restrita ao cofre de credenciais do n8n. O frontend consome exclusivamente a chave pública `anon`.

---

## 4. Limitações Identificadas e Próximos Passos (Evolução Futura)

Caso houvesse mais tempo de desenvolvimento no cronograma, as seguintes melhorias seriam priorizadas:
1. **Perfil Específico para Técnicos com RLS Restritivo:** Criar política onde técnicos só visualizam seus próprios agendamentos e só podem alterar status de `agendado` para `em_andamento` e `concluido`.
2. **Otimização de Rota com API do Google Maps:** Agrupar instalações do mesmo dia por proximidade geográfica para reduzir tempo de deslocamento da equipe técnica.
3. **Fila com Dead Letter Queue (DLQ) no n8n:** Implementar retentativas automáticas exponenciais com webhook de erro caso serviços de terceiros (Google Sheets, Gmail) fiquem temporariamente fora do ar.
4. **Assinatura Digital do Cliente na Conclusão:** Captura de assinatura digital na tela 6 via canvas ao concluir a instalação para fins de garantia e conformidade.
