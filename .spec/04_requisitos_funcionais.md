# 04 — Requisitos Funcionais do Frontend

O sistema SmartLar é composto por 6 módulos principais na interface de usuário:

---

## 1. Módulo 1: Dashboard Geral (`/` ou `/dashboard`)

- **RF-01.1 (KPIs de Alto Nível):**
  - Exibir o **Faturamento do Mês** consolidado (somente pedidos concluídos no mês).
  - Exibir contadores de status: Orçamentos, Aprovados, Agendados, Em Andamento, Concluídos, Cancelados.
  - Exibir total de instalações previstas para hoje.
- **RF-01.2 (Próximas Instalações):**
  - Card/Tabela com as próximas 5 instalações ordenadas cronologicamente, exibindo cliente, endereço, técnico e horário.
- **RF-01.3 (Distribuição por Status):**
  - Gráfico ou barras visuais de progresso indicando o percentual de pedidos em cada estágio do funil.

---

## 2. Módulo 2: Catálogo de Produtos (`/produtos`)

- **RF-02.1 (Listagem e Cards):**
  - Renderizar os produtos com foto, nome, categoria, preço formatado (R$) e descrição resumida.
- **RF-02.2 (Filtros por Categoria em Pílulas):**
  - Permitir filtrar por *Todas, Automação, Segurança, Câmeras, Energia, Áudio & Vídeo, Redes*.
- **RF-02.3 (Busca Textual em Tempo Real):**
  - Campo de busca filtrando por nome ou descrição do equipamento sem recarregar a página.
- **RF-02.4 (Status de Disponibilidade):**
  - Indicação visual se o produto está ativo/inativo para venda.

---

## 3. Módulo 3: Gestão de Clientes (`/clientes`)

- **RF-03.1 (Listagem de Clientes):**
  - Tabela ou lista em cards com Nome, E-mail, Telefone/WhatsApp, Endereço completo e data de cadastro.
- **RF-03.2 (Busca e Filtro):**
  - Filtrar por nome, telefone ou e-mail.
- **RF-03.3 (Histórico do Cliente):**
  - Ação "Ver Pedidos" que abre modal listando todos os pedidos daquele cliente, seus status e valores.
- **RF-03.4 (Novo Cliente):**
  - Modal com formulário de cadastro com validação de formato de e-mail e telefone.

---

## 4. Módulo 4: Novo Pedido / PDV (`/novo-pedido`)

- **RF-04.1 (Seleção Rápida de Cliente):**
  - Seletor com autocomplete ou dropdown exibindo nome e telefone do cliente.
- **RF-04.2 (Catálogo Integrado & Adição ao Carrinho):**
  - Clique único para adicionar item ao carrinho.
  - Se o item já estiver no carrinho, incrementa a quantidade.
- **RF-04.3 (Drawer Lateral de Pedido / Order Summary):**
  - Painel fixo lateral estilo Tablet POS listando os itens adicionados.
  - Steppers de quantidade `[ - ] [ qtd ] [ + ]`.
  - Botão de remoção de item.
  - Campo de Observações do pedido.
- **RF-04.4 (Cálculo Reativo de Prévia):**
  - Exibir subtotal por item e total estimado antes da finalização.
- **RF-04.5 (Gravação Atômica):**
  - Botão "Criar Orçamento" dispara a RPC `criar_pedido` no Supabase.
  - Feedback imediato via toast e redirecionamento para a tela de Pedidos.
- **RF-04.6 (Proposta Estilizada em PDF & Envio via WhatsApp):**
  - Imediatamente após a gravação do orçamento, gera uma proposta comercial vetorial em PDF estilizada com identidade visual corporativa da SmartLar.
  - Faz o upload automático do arquivo PDF para o Supabase Storage no bucket `orcamentos`.
  - Disponibiliza botão direto de envio via WhatsApp (`wa.me`) com mensagem amigável, valores consolidados e link do PDF hospedado em nuvem.
  - Fornece botões para visualização prévia, download direto do arquivo e cópia rápida do link.

---

## 5. Módulo 5: Gestão de Pedidos (`/pedidos`)

- **RF-05.1 (Listagem e Filtros por Status):**
  - Chips/Pills para alternar entre *Todos, Orçamento, Aprovado, Agendado, Em Andamento, Concluído, Cancelado*.
- **RF-05.2 (Card de Pedido):**
  - Exibe ID do pedido, cliente, data de criação, valor total e itens resumidos.
- **RF-05.3 (Ações de Próximo Passo Permitidas):**
  - A interface renderiza apenas os botões de ação permitidos pelo status atual:
    - `orcamento`: [Aprovar] e [Cancelar]
    - `aprovado`: [Agendar Instalação] e [Cancelar]
    - `agendado`: [Iniciar Instalação]
    - `em_andamento`: [Concluir Instalação]
- **RF-05.4 (Modal de Agendamento):**
  - Ao clicar em "Agendar", abre modal exigindo a escolha do técnico e data/hora da instalação.
- **RF-05.5 (Trilha de Auditoria):**
  - Botão para visualizar o histórico de mutações do pedido gerado por `historico_status`.
- **RF-05.6 (Reemissão de Proposta Comercial e Envio via WhatsApp):**
  - Botão dedicado nos cards (Kanban e Lista) e no modal de detalhes dos itens para gerar a proposta em PDF atualizada, reenviar via WhatsApp e baixar a qualquer momento.

---

## 6. Módulo 6: Agenda Técnica (`/agenda`)

- **RF-06.1 (Visualização de Instalações):**
  - Visualização em lista/calendário das instalações agendadas e em andamento.
- **RF-06.2 (Filtro por Técnico e Data):**
  - Seleção de técnico para inspecionar sua escala diária e semanal.
- **RF-06.3 (Detecção de Conflitos):**
  - Destaque visual (badge de alerta vermelho/amarelo) quando um técnico tiver mais de uma instalação com intervalo inferior a 2 horas.
- **RF-06.4 (Detalhes Técnicos da Instalação):**
  - Endereço completo, link rápido para abrir no Google Maps / Waze, telefone do cliente e lista dos produtos a serem instalados.
