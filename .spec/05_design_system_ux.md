# 05 — Design System & Especificações de Interface (UI/UX)

## 1. Conceito Visual: Tablet POS (Point of Sale)

O SmartLar foi desenhado para simular a ergonomia de um **terminal de ponto de venda em tablet de alto padrão corporativo**, garantindo rapidez na digitação de pedidos e clareza visual para operadores de balcão e técnicos de campo.

---

## 2. Paleta de Cores e Tokens

| Token / Elemento | Valor Hex / Tailwind | Aplicação |
| :--- | :--- | :--- |
| **Background Principal** | `#f4f5f9` (`bg-slate-100/70`) | Fundo geral descansado, alto contraste com cards brancos |
| **Sidebar Rail Slim** | `#0e131f` (`bg-[#0e131f]`) | Barra vertical escura de navegação fixa (`w-20`) |
| **Notch Ativo** | `#3b82f6` (`bg-blue-600`) | Indicador curvo com brilho azul na aba ativa da sidebar |
| **Cards de Conteúdo** | `#ffffff` (`bg-white`) | Superfícies elevadas com `rounded-3xl` e `border border-slate-200/80` |
| **Acentos Primários** | `#2563eb` (`bg-blue-600`, `text-blue-600`) | Botões de ação, links, steppers de carrinho e ícones ativos |
| **Status Orçamento** | `#64748b` (`slate`) | Badges de pedidos recém-criados |
| **Status Aprovado** | `#2563eb` (`blue`) | Pedido validado comercialmente |
| **Status Agendado** | `#8b5cf6` (`purple`) | Pedido com data e técnico vinculados |
| **Status Em Andamento**| `#f59e0b` (`amber`) | Técnico em execução na residência |
| **Status Concluído** | `#10b981` (`emerald`) | Instalação validada e faturada |
| **Status Cancelado** | `#ef4444` (`red`) | Pedido abortado |

---

## 3. Padrões de Componentes

### 3.1 Sidebar Rail (Desktop)
- Barra lateral vertical fixa de 64px (`lg:w-64`).
- Ícones e rótulos tipográficos com destaque visual para a aba ativa.
- Experiência limpa e profissional para operadores de escritório e despachantes, sem exposição de configurações técnicas de infraestrutura.

### 3.2 Drawer de Pedido Fixo (Order Details Drawer)
- Posicionado à direita na tela de **Novo Pedido**.
- Permite que o operador navegue pelo catálogo sem perder a visão do carrinho atual.
- Steppers azuis responsivos `[- qtd +]` e totalizadores calculados em tempo real.
- Combobox com pesquisa em tempo real para seleção rápida de produtos sem necessidade de tabelas poluídas.

### 3.3 Filtros em Pílulas (Pill Chips)
- Filtros horizontais com cantos totalmente arredondados (`rounded-full`).
- Alternância rápida com feedback de estado ativo (fundo escuro ou azul, texto branco).

### 3.4 Modais Portais
- Modais renderizados via `ModalPortal` no root do DOM para evitar problemas de stacking context (`z-index`).
- Fundo translúcido com `backdrop-blur-sm` e animação suave de fade-in.

### 3.5 Sistema de Toasts Notificadores (Mobile & Desktop)
- Notificações compactas em estilo card flutuante translúcido (`backdrop-blur-md bg-white/95`) com cantos arredondados (`rounded-2xl`) e sombra suave.
- **Mobile First:** Centralizado horizontalmente no **topo da tela** (`top-3.5 left-0 right-0 items-center`), estilo notificação nativa (Dynamic Island / iOS), sem colidir com o menu inferior.
- **Desktop:** Fixado discretamente no canto inferior direito.
- Tipos: `success`, `error`, `warning`, `info` com micro-badges coloridos.
- Descarte automático ou via botão sutil de fechamento.

---

## 4. Ergonomia e Otimizações Mobile (App-Like Experience)

O SmartLar foi otimizado para operadores em campo com smartphones:
1. **Navegação Inferior Flutuante (`BottomNav`):** Barra horizontal inferior com cantos arredondados (`rounded-2xl`), ícones centralizados e espaçamento das bordas, simulando a experiência fluida de um app nativo. O menu hambúrguer foi removido no mobile para economizar espaço de tela.
2. **Agenda Técnica com Foco Diário:** No celular, a visualização padrão foca em **1 dia por vez** (com navegação ágil dia a dia), prevenindo que a grade semanal fique apertada ou ilegível.
3. **Cards Verticais e Responsivos:** Em Clientes e Produtos, as informações são distribuídas verticalmente para nunca estourar a largura da tela do celular nem exigir rolagem horizontal indesejada.
4. **Cards do Kanban com Ações Seguras:** O botão de cancelamento (`X`) fica posicionado no cabeçalho superior do card, ao lado da data, permitindo que a linha inferior (Total + Ver Itens + Histórico + PDF + Aprovar) caiba com folga sem empurrar botões para fora do card.
5. **Proposta Comercial em PDF com Quebra de Linha:** O gerador de PDF calcula a largura útil e quebra endereços longos dinamicamente (`splitTextToSize`), expandindo harmonicamente a altura dos blocos para que nenhuma informação seja cortada.
6. **Tela de Login Restrita:** Interface focada exclusivamente no acesso de usuários cadastrados (`admin@smartlar.com.br`), com cabeçalho centralizado e sem detalhes técnicos de banco de dados visíveis ao operador.
