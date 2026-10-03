# SmartLar — Documento de Entrega do Projeto Técnico

**Candidato:** Pierre Brito  
**Link da Aplicação em Produção:** [https://smartlar-lac.vercel.app/](https://smartlar-lac.vercel.app/)  
**Repositório GitHub:** [https://github.com/pierrecbrito/smartlar](https://github.com/pierrecbrito/smartlar)  
**Banco de Dados & Autenticação:** Supabase (PostgreSQL 16)  
**Hospedagem & CI/CD:** Vercel  

---

## 1. Link do Projeto Funcionando

- **URL de Produção:** [https://smartlar-lac.vercel.app/](https://smartlar-lac.vercel.app/)
- **Credenciais de Acesso (Administrador):**
  - **E-mail:** `admin@smartlar.com.br`
  - **Senha:** `adminsmartlar2026`

### Roteiro de Teste dos Fluxos Principais:
1. **Autenticação Segura & RLS:** Acesso restrito via Supabase Auth com Row Level Security (RLS) habilitado em todas as tabelas. Usuários não autenticados não têm acesso a dados sensíveis.
2. **Dashboard Geral:** Indicadores em tempo real de pedidos do mês, faturamento mensal, valores a receber e pendências de agendamento calculados com fuso horário oficial (`America/Sao_Paulo`).
3. **Catálogo de Produtos:** Consulta de equipamentos com filtros por categoria, busca instantânea e controle de estoque.
4. **Gestão de Clientes & Integração ViaCEP:** Cadastro completo com consulta de CEP automática (ViaCEP), preenchimento inteligente de logradouro/bairro/cidade e coordenadas GPS integradas.
5. **Criação de Orçamento / Novo Pedido (POS):** Busca ágil de cliente, combobox de seleção de produtos com pesquisa em tempo real, ajuste de quantidade por steppers, cálculo de subtotal com preço congelado no momento da venda e geração atômica via Stored Procedure (`criar_pedido`).
6. **Gestão de Pedidos (Kanban com Máquina de Estados):**
   - Transições de status permitidas: `Orçamento` ➔ `Aprovado` ➔ `Agendado` ➔ `Em Andamento` ➔ `Concluído` (ou `Cancelado`).
   - Drag & drop validado pelo banco; bloqueio preventivo de saltos de etapa inválidos.
   - Modal de agendamento obrigatório com seleção de técnico e data/horário de instalação.
   - Geração e download imediato de **Proposta Comercial em PDF** profissional, com layout customizado e botão de compartilhamento via WhatsApp.
   - Trilha de auditoria por pedido consultável em tempo real (`historico_status`).
7. **Agenda Técnica (Google Calendar Style):** Visualização por Dia / Semana / Mês, com detecção e alerta visual de sobreposição de horários (intervalos menores que 2 horas para o mesmo técnico) e atalhos para rota GPS e contato do cliente.
8. **Responsividade Mobile:** Menu horizontal inferior estilo aplicativo nativo (`BottomNav`), cards verticais otimizados, formulários responsivos e notificações flutuantes tipo Dynamic Island.

---

## 2. Link ou Prints do Supabase

- **Instância Supabase:** `https://eyjfofrwjixirbuvvlmk.supabase.co`
- **Stack do Banco:** PostgreSQL 16 com extensões nativas e RLS estrito.

### Estrutura Relacional do Banco de Dados:
- **`clientes`**: Cadastro completo de pessoas físicas/jurídicas com endereço estruturado (`cep`, `logradouro`, `numero`, `bairro`, `cidade`, `estado`, `ponto_referencia`).
- **`tecnicos`**: Equipe técnica de instalação e manutenção, incluindo especialidades e telefone.
- **`produtos`**: Catálogo de equipamentos (câmeras, sensores, fechaduras, lâmpadas) com preço unitário e estoque.
- **`pedidos`**: Orçamentos e pedidos com máquina de estados (`status_pedido`), número sequencial incremental gerado por sequence, endereço de instalação congelado e valor total mantido por triggers.
- **`itens_pedido`**: Produtos vinculados ao pedido com congelamento de preço (`preco_unitario numeric(10,2)`), quantidade e subtotal computado automaticamente (`generated always as (quantidade * preco_unitario) stored`).
- **`historico_status`**: Tabela de auditoria imutável alimentada de forma assíncrona via trigger a cada mudança de fase do pedido.

### Segurança e Views:
- **Row Level Security (RLS):** Ativo em todas as 6 tabelas com políticas `autenticados_acesso_total` para a role `authenticated`.
- **Views com Security Invoker:** Views `v_dashboard_resumo`, `v_instalacoes` e `v_agenda_pedidos` configuradas com `WITH (security_invoker = true)` para respeitar rigorosamente o RLS do usuário conectado, eliminando riscos de privilégios de superusuário (`UNRESTRICTED`).

> 📷 **[Espaço para Inserir Prints do Supabase no Google Docs]:**
> - *Print 1 (Table Editor):* Visão das tabelas com dados populados (conferência do cenário Marina Costa = R$ 1.080,00).
> - *Print 2 (Database > Schema Visualizer):* Diagrama ER exibindo as chaves primárias e relacionamentos (FKs).
> - *Print 3 (Authentication > Users):* Registro do usuário `admin@smartlar.com.br` ativo e verificado.

---

## 3. Prints dos Workflows n8n + Evidências de Execução

As automações foram construídas no n8n seguindo padrões corporativos de resiliência, idempotência e tratamento de timezone.

### Workflow 1: Notificação e Disparo de Novo Pedido (Database Webhook)
- **Gatilho:** Webhook disparado pelo PostgreSQL no evento `INSERT` da tabela `pedidos`.
- **Padrão Re-Fetch:** Para evitar condições de corrida (triggers de itens ainda em execução), o workflow recebe o `id` e executa um `GET /rest/v1/pedidos` autenticado, obtendo os itens e os dados do cliente 100% consolidados.
- **Ação:** Formata os dados via nó Code e envia a notificação imediata com resumo de itens e valor total.

### Workflow 2: Alerta Diário da Agenda de Instalações (Cron Job)
- **Gatilho:** Agendador cron diário configurado para rodar todas as manhãs às 07:00 (fuso de Brasília).
- **Consulta:** Filtra a view `v_instalacoes` buscando serviços com `data_instalacao` agendada para o dia seguinte.
- **Ação:** Agrupa os serviços por técnico responsável e envia a lista com cliente, horário, endereço completo e requisitos de equipamento (ex: escada alta para câmeras externas).

### Workflow 3 (Bônus): Registro de Pedido Concluído e Pós-Venda
- **Gatilho:** Webhook na transição para o status `concluido`.
- **Ação:** Atualização de base de controle de comissões/faturamento e disparo de mensagem pós-venda.

> 📷 **[Espaço para Inserir Prints do n8n no Google Docs]:**
> - *Print 1:* Canvas do Workflow 1 no n8n com nós conectados e organizados.
> - *Print 2:* Painel de **Executions** do n8n mostrando status `Success` (verde) com log de execução e dados de entrada/saída expandidos.
> - *Print 3:* Canvas e execução do Workflow 2 (Alerta Diário).

---

## 4. Explicação das Decisões Técnicas e Arquiteturais

### 4.1 Por que modelou o banco assim?
- **Regras no Banco, não no Front:** A máquina de estados, a exigência de técnico/data para agendamento e o recálculo de valores foram centralizados em triggers e constraints PL/pgSQL. O frontend é uma camada volátil e inspecionável; centralizar a integridade no PostgreSQL garante que nenhum usuário (ou automação externa) corrompa a base.
- **Snapshot de Preço Unitário:** Em `itens_pedido`, o `preco_unitario` é capturado e congelado no ato da compra. Se o catálogo sofrer reajustes futuros, pedidos passados mantêm fidelidade fiscal e contratual imutável.
- **Subtotal Computado no Banco:** A coluna gerada `subtotal numeric(12,2) generated always as (quantidade * preco_unitario) stored` elimina qualquer discrepância de arredondamento entre frontend, backend e relatórios.
- **Atomicidade via Stored Procedure (`criar_pedido`):** Criar pedidos inserindo o cabeçalho e depois iterando itens em loop deixa o sistema vulnerável a falhas de conexão intermediárias (criando pedidos órfãos com valor zerado). A procedure garante atomicidade ACID: ou o pedido é criado completo com todos os itens agrupados, ou a transação sofre rollback.

### 4.2 Como resolveu os cálculos?
- O front-end utiliza reatividade em memória (React state) estritamente para fornecer feedback visual imediato ao operador enquanto os produtos são adicionados ao carrinho.
- Nenhum valor financeiro enviado pelo front-end é aceito como verdade final: ao gravar o pedido, a trigger `itens_ai` recalcula a soma dos subtotais no banco e grava o `valor_total` oficial. O front lê a resposta do banco pós-mutação.

### 4.3 Como conectou n8n com Supabase?
- **Separação Rigorosa de Privilégios:** O front-end utiliza exclusivamente a chave pública `anon` protegida por RLS. O n8n utiliza a chave administrativa `service_role` armazenada em seu cofre seguro de credenciais.
- **Webhooks Assíncronos & Padrão Re-Fetch:** O Supabase notifica o webhook do n8n apenas com o identificador do evento. O n8n então realiza uma requisição autenticada de re-busca, garantindo que lê dados íntegros e já persistidos.

### 4.4 O que faria diferente com mais tempo?
1. **Perfis de Acesso Granulares (RBAC):** Criar roles separadas no Supabase Auth para "Administradores" e "Técnicos de Campo", aplicando políticas RLS para que técnicos enxerguem apenas as ordens de serviço atribuídas a eles.
2. **Roteirização Inteligente com Google Maps API:** Agrupar as ordens de serviço do dia por proximidade geográfica e calcular a rota ideal de deslocamento, minimizando tempo de trânsito e combustível da equipe técnica.
3. **Fila com Dead Letter Queue (DLQ) no n8n:** Implementar retentativas com backoff exponencial e webhook de contingência para o caso de indisponibilidade de serviços de terceiros (WhatsApp/Sheets).
4. **Assinatura Digital do Cliente no PWA:** Componente de canvas para coleta de assinatura digital do cliente na tela do celular ao concluir a instalação, gerando comprovante assinado anexado ao pedido.

---

## 5. Onde Usou IA e Pra Quê (Transparência Total)

A Inteligência Artificial (Google Antigravity / Gemini) foi empregada como **ferramenta de aceleração e pair programming**, com arquitetura, refinamento e validação conduzidos pelo desenvolvedor:

### O que foi acelerado via IA:
- Geração de código boilerplate para componentes React, tabelas TypeScript a partir do schema relacional e nós de fluxo do n8n.
- Estruturação preliminar das tabelas e criação de massa de dados de teste (seeds).

### Onde houve intervenção e decisão crítica do desenvolvedor (o que a IA errou ou não previu):
1. **Fuso Horário Brasileiro:** A IA inicialmente gerou queries e views em UTC padrão. Foi necessária correção manual aplicando conversão explícita para `at time zone 'America/Sao_Paulo'`, evitando distorções no fechamento de faturamento mensal e no agendamento matinal do cron.
2. **Rejeição de Mock Data:** Qualquer sugestão da IA de utilizar dados simulados ou arrays estáticos no front-end foi descartada; toda a aplicação foi conectada em tempo real ao Supabase.
3. **Segurança de Validações no Banco:** A IA propôs validações de transição de status apenas no front-end React. Transferimos todas as restrições para triggers PL/pgSQL e procedures no PostgreSQL para garantir integridade absoluta.
4. **Refinamento Mobile First:** Os layouts desktop propostos pela IA foram retrabalhados manualmente para criar um bottom nav flutuante, visão de dia único na agenda, combobox com busca de produtos e remoção de rolagem horizontal em telas pequenas.
5. **Quebra Dinâmica de Endereço no PDF:** A IA gerou truncamento rígido de 52 caracteres no PDF. Refatoramos a rotina usando `doc.splitTextToSize` e altura dinâmica dos cards no jsPDF para garantir que endereços extensos quebrem em múltiplas linhas e nunca fiquem cortados.

---

## 6. Link do Repositório GitHub

- **Repositório Público:** [https://github.com/pierrecbrito/smartlar](https://github.com/pierrecbrito/smartlar)

### Destaques da Organização do Repositório:
- **Histórico Semântico de Commits:** Commits atômicos documentando a evolução do projeto (`feat`, `fix`, `refactor`, `style`, `docs`).
- **Suíte de Especificações em `.spec/`:**
  - `.spec/database/`: Scripts SQL idempotentes e versionados (`01_schema.sql`, `02_seed.sql`, `03_rls.sql`, `04_storage_orcamentos.sql`, `05_enderecos_estruturados.sql`, `06_confirm_admin.sql`, `07_fix_security_invoker_views.sql`).
  - `.spec/docs/`: `DECISIONS.md`, `IA-LOG.md`, `PLANO_PROJETO.md`.
- **Configuração de Deploy Contínuo:** `vercel.json` configurado para SPA routing com deploy automatizado a cada `git push`.
- **Qualidade de Código:** TypeScript estrito com zero erros de compilação no build de produção.
