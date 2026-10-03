# IA-LOG.md — Registro de Transparência e Uso de Inteligência Artificial

Este documento cumpre o requisito de transparência do processo seletivo da IAplicada, detalhando com total honestidade como a Inteligência Artificial (Google Antigravity / Gemini) foi empregada em cada etapa do projeto **SmartLar**.

---

## 1. Concepção do Banco de Dados e Modelagem SQL

- **O que foi solicitado à IA:**
  - Projeto completo do esquema relacional (`01_schema.sql`), dados de carga (`02_seed.sql`) e políticas de segurança (`03_rls.sql`).
  - Imposição de restrições estritas de negócio: impedimento de pular etapas, coluna de preço unitário congelado, subtotal gerado pelo banco e stored procedure (`criar_pedido`) para criação atômica.
  - Cenários de teste que reproduzissem o enunciado (exemplo: Marina Costa comprando 2 câmeras + 1 sensor = R$ 1.080,00).

- **O que foi aceito:**
  - A arquitetura de triggers em PL/pgSQL (`pedidos_bi`, `pedidos_bu`, `pedidos_ai`, `itens_bi`, `itens_ai`).
  - A coluna gerada `subtotal numeric(12,2) generated always as (quantidade * preco_unitario) stored`.
  - A RPC `criar_pedido` que trata agrupamento de produtos repetidos e inserção em transação única.
  - A tabela de auditoria `historico_status` preenchida de forma automática.

- **O que foi alterado/rejeitado manualmente:**
  - **Fuso Horário:** A IA havia gerado views com cálculo padrão UTC. Corrigimos para explicitamente converter com `at time zone 'America/Sao_Paulo'`, assegurando que o faturamento mensal e os filtros do n8n correspondam ao horário comercial do Brasil.
  - **Datas Relativas no Seed:** Em vez de datas estáticas (que ficariam defasadas conforme os dias passassem), ajustamos o seed para usar expressões relativas como `current_date`, `current_date + interval '1 day'`, garantindo dados frescos no momento em que o avaliador inspecionar o sistema.

---

## 2. Frontend e Arquitetura de Interface

- **O que foi solicitado à IA:**
  - Setup do projeto com Vite, React, TypeScript e Tailwind CSS.
  - Estruturação de componentes reutilizáveis e páginas cobrindo as 6 visões do enunciado:
    1. Dashboard Geral
    2. Catálogo de Produtos
    3. Gestão de Clientes e Contatos
    4. Criação de Novo Pedido (POS / Carrinho)
    5. Gestão de Pedidos (Máquina de Estados)
    6. Agenda Técnica com detecção de sobreposição
  - Reformulação completa da experiência visual baseando-se no layout de um tablet POS (Point of Sale): barra lateral slim dark (`#0e131f`) com notch ativo, fundo cool light (`#f4f5f9`), cartões brancos com cantos suaves `rounded-3xl`, filtros em pílula e drawer lateral dinâmico de detalhes do pedido.

- **O que foi aceito:**
  - O design system inspirado no POS corporativo, que oferece máxima produtividade para o operador de loja/despacho.
  - A integração transparente com `@supabase/supabase-js` com tipagem forte TypeScript.
  - A gestão de conflitos de horário na agenda calculando intervalos menores que 2 horas entre instalações do mesmo técnico.
  - A modalidade de "Ver Pedidos" do cliente diretamente da lista de clientes.

- **O que foi alterado/rejeitado manualmente:**
  - **Rejeição de Mock Data:** Qualquer sugestão inicial da IA de simular dados com arrays estáticos no frontend foi sumariamente rejeitada. Todas as listas, indicadores, buscas e formulários comunicam-se em tempo real com o PostgreSQL hospedado no Supabase.
  - **Cálculos de Totais:** O front foi instruído a nunca enviar `valor_total` para o banco. O cálculo exibido na tela é puramente reativo para prévia do operador; o valor gravado é sempre o computado pelo banco via RPC.
  - **Redesenho Mobile First & PWA:** A proposta original de tabelas da IA quebrava a largura em telas de celular. Reescrevemos a navegação com bottom nav flutuante, foco diário na agenda, combobox com busca de produtos e eliminação de overflow horizontal.
  - **Posicionamento de Ações no Card:** O botão de cancelamento foi movido da linha inferior para o topo do card para evitar que o "X" vazasse da moldura branca na visualização mobile.
  - **Quebra Dinâmica de Endereço no PDF:** A IA gerou um corte arbitrário de 52 caracteres (`slice(0, 52)`). Refatoramos com `splitTextToSize` e altura dinâmica no jsPDF para garantir que endereços longos quebrem em múltiplas linhas e nunca fiquem truncados.
  - **Correção de Views UNRESTRICTED:** Identificamos que a view `v_agenda_pedidos` gerada sem `security_invoker = true` bypassava o RLS no Supabase. Criamos a migração `07_fix_security_invoker_views.sql` para garantir conformidade de segurança.

---

## 3. Automações n8n

- **O que foi solicitado à IA:**
  - Criação dos 3 fluxos em formato JSON para importação direta no n8n:
    1. Webhook de Novo Pedido (disparado via Database Webhook do Supabase).
    2. Alerta do Dia Seguinte (disparado via Cron diário às 07:00).
    3. Registro de Pedido Concluído (bônus no Google Sheets / Notificação).
  - Padrões de resiliência e tratamento de timezone.

- **O que foi aceito:**
  - O fluxo com nó HTTP Request intermediário para re-busca do pedido consolidado.
  - O uso de nós Code no n8n para formatação limpa das mensagens de WhatsApp/E-mail.

- **O que foi alterado/rejeitado manualmente:**
  - **Segurança da Chave Service Role:** Foi garantido que a chave privilegiada do Supabase fique restrita aos nós HTTP do n8n, jamais sendo enviada ao repositório ou ao bundle do frontend.

---

## 4. Roteiro para Defesa Técnica na Entrevista

A transparência no uso da IA é parte da avaliação. Ao ser questionado sobre como o código foi produzido:
1. Explique que a IA acelerou a geração de boilerplate (estruturas de componentes React, schemas de banco e nós do n8n).
2. Destaque que a **arquitetura de regras e a supervisão técnica** foram conduzidas por você: a decisão de proteger o preço com snapshot, de travar transições inválidas no PL/pgSQL com triggers, de usar RPC para atomicidade e de alinhar a UI ao conceito visual de tablet POS.
3. Demonstre ao vivo no Supabase Studio as triggers disparando e rejeitando requisições inválidas.
