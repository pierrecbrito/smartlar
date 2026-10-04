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

### 2.5 Ergonomia Mobile First & PWA-Like Experience
- **Decisão:** O layout foi otimizado para celulares eliminando a necessidade de menu hambúrguer tradicional:
  - **Barra de Navegação Inferior Flutuante (`BottomNav`):** Navegação horizontal centrada com ícones, bordas arredondadas e margens de respiro, imitando a pegada de um aplicativo móvel nativo.
  - **Agenda Diária no Celular:** Ao invés da grade semanal completa (que fica truncada no smartphone), o mobile exibe o dia corrente com controles laterais para avançar/retroceder.
  - **Combobox de Produtos no PDV:** No mobile, tabelas densas de catálogo foram substituídas por um seletor inteligente com busca, agilizando o fechamento de pedidos no balcão.
  - **Cards Verticais sem Estouro:** Informações de clientes e produtos foram redistribuídas verticalmente, prevenindo rolagem horizontal indesejada.
  - **Botão Cancelar (`X`) no Cabeçalho do Card:** Movido para o topo do card junto à data, evitando a sobrecarga do rodapé e prevenindo que botões de ação vazem para fora da moldura do card.
  - **Quebra Dinâmica de Endereço no PDF:** O gerador de propostas comerciais (jsPDF) utiliza `splitTextToSize` com altura dinâmica nos cards, permitindo que endereços extensos quebrem em múltiplas linhas sem corte ou perda de legibilidade.

### 2.6 Hardening do Front-end e Ocultação de Detalhes Técnicos
- **Decisão:** Remoção de qualquer botão ou modal de "Configurar DB" da interface do usuário. As credenciais são gerenciadas exclusivamente pelo arquivo de ambiente e pela plataforma de hospedagem (Vercel).
- **Tela de Login Restrita:** Acesso protegido por sessão Supabase Auth com login obrigatório para o usuário administrador (`admin@smartlar.com.br`) e sem opção pública de auto-cadastro.

---

## 3. Automações e Integrações (n8n)

### 3.1 Idempotência e Padrão Re-Fetch (Workflow 01 — Novo Pedido)
- **Decisão:** Na Automação 1 (Novo Pedido via Database Webhook), o payload inicial enviado pelo Supabase captura o evento de `INSERT` na tabela `pedidos`. Como a criação atômica insere o cabeçalho antes dos itens (`itens_pedido`), o payload cru do webhook chega com `valor_total: 0`. Em vez de gravar dados incompletos ou criar nós complexos de parsing, o n8n utiliza o nó oficial do Supabase para realizar um **Re-Fetch atômico** consultando a view especializada `v_agenda_pedidos` filtrada por `id = body.record.id`. Em seguida, o nó do Google Sheets adiciona a linha na planilha *Orçamentos - SmartLar* com `numero_pedido`, `cliente.nome`, `valor_total` e data/hora formatada no fuso de Brasília (`America/Sao_Paulo`).
- **Motivação:** Garante 100% de consistência e idempotência. Evita que condições de corrida (race conditions) entre a trigger de cálculo e a emissão do webhook gravem orçamentos com valor zerado na planilha da empresa.


### 3.2 Alerta Diário com Schedule, Tratamento de Agenda Vazia e WhatsApp (Workflow 02)
- **Decisão:** A Automação 2 dispara diariamente às **18:00 (horário de Brasília)** via `scheduleTrigger`, no fechamento do expediente comercial. Ela consulta o Supabase na view `v_agenda_pedidos` com filtro estrito de intervalo temporal utilizando Luxon:
  - `data_instalacao >= $now.setZone('America/Sao_Paulo').plus({ days: 1 }).startOf('day').toISO()`
  - `data_instalacao <= $now.setZone('America/Sao_Paulo').plus({ days: 1 }).endOf('day').toISO()`
- **Tratamento de Cenário Sem Agendamentos (Critério do Teste):** O nó do Supabase possui `alwaysOutputData: true`, conectado a um nó condicional `IF (Existem Instalacoes Amanha?)`. Caso não haja agendamentos, o fluxo não quebra nem silencia: desvia para um nó HTTP que dispara uma notificação no WhatsApp informando que a agenda de amanhã está livre.
- **Formatação Rica & Notificação Real (WhatsApp via CallMeBot):** Havendo agendamentos, um nó JavaScript Code agrega e formata o itinerário completo (hora, técnico, cliente, telefone de contato, endereço e valor total) e realiza o disparo automatizado via API do WhatsApp, garantindo que o gestor e os técnicos recebam o plano de ação no bolso sem precisar abrir o sistema.


### 3.3 Registro de Faturamento de Pedido Concluído (Workflow 03 — Bônus)
- **Decisão:** A Automação 3 atua como o elo financeiro do negócio. Um Database Webhook escuta eventos de `UPDATE` na tabela `pedidos` (endpoint `/smartlar-pedido-atualizado`). O nó do Supabase busca na view `v_agenda_pedidos` aplicando filtro duplo (`id = body.record.id` e `status = 'concluido'`), assegurando que apenas a conclusão efetiva do serviço dispare o registro financeiro.
- **Normalização de Formas de Pagamento & Google Sheets:** O nó do Google Sheets mapeia os enums do banco (`pix`, `cartao_credito`, `cartao_debito`, `boleto`, `dinheiro`) para rótulos legíveis (*"PIX"*, *"Cartão de Crédito"*, *"Boleto Bancário"*) e adiciona uma nova linha na planilha dedicada *Orçamentos Concluídos - SmartLar* com número do orçamento, data/hora formatada no fuso de Brasília, valor total, forma de pagamento e nome do cliente.
- **Motivação:** Cumpre o bônus de controle financeiro automático sugerido pelo enunciado, separando orçamentos abertos de faturamento realizado em planilhas distintas.


### 3.4 Separação de Credenciais e Segurança
- **Decisão:** A chave `service_role` (que possui privilégios de superusuário) fica restrita ao cofre de credenciais do n8n. O frontend consome exclusivamente a chave pública `anon`.


---

## 4. Limitações Identificadas e Próximos Passos (Evolução Futura)

Caso houvesse mais tempo de desenvolvimento no cronograma, as seguintes melhorias seriam priorizadas:
1. **Perfil Específico para Técnicos com RLS Restritivo:** Criar política onde técnicos só visualizam seus próprios agendamentos e só podem alterar status de `agendado` para `em_andamento` e `concluido`.
2. **Otimização de Rota com API do Google Maps:** Agrupar instalações do mesmo dia por proximidade geográfica para reduzir tempo de deslocamento da equipe técnica.
3. **Fila com Dead Letter Queue (DLQ) no n8n:** Implementar retentativas automáticas exponenciais com webhook de erro caso serviços de terceiros (Google Sheets, Gmail) fiquem temporariamente fora do ar.
4. **Assinatura Digital do Cliente na Conclusão:** Captura de assinatura digital na tela 6 via canvas ao concluir a instalação para fins de garantia e conformidade.
