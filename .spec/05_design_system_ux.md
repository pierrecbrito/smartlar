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

### 3.1 Sidebar Rail Slim
- Barra lateral vertical fixa de 80px (`w-20`).
- Ícones centralizados com tooltip no hover.
- Botão inferior de status de conexão com o Supabase e atalho para configurações.

### 3.2 Drawer de Pedido Fixo (Order Details Drawer)
- Posicionado à direita na tela de **Novo Pedido**.
- Permite que o operador navegue pelo catálogo sem perder a visão do carrinho atual.
- Steppers azuis responsivos `[- qtd +]` e totalizadores calculados em tempo real.

### 3.3 Filtros em Pílulas (Pill Chips)
- Filtros horizontais com cantos totalmente arredondados (`rounded-full`).
- Alternância rápida com feedback de estado ativo (fundo escuro ou azul, texto branco).

### 3.4 Modais Portais
- Modais renderizados via `ModalPortal` no root do DOM para evitar problemas de stacking context (`z-index`).
- Fundo translúcido com `backdrop-blur-sm` e animação suave de fade-in.

### 3.5 Sistema de Toasts Notificadores
- Central de notificações flutuantes no canto inferior direito.
- Tipos: `success`, `error`, `warning`, `info`.
- Descarte automático após 5 segundos ou via botão de fechar.
- Mensagens de erro do PostgreSQL são interceptadas e apresentadas com títulos claros.
