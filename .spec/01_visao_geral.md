# 01 — Visão Geral do Sistema & Arquitetura

## 1. Contexto e Objetivo
O **SmartLar** é uma plataforma integrada de gestão comercial e operacional desenvolvida especificamente para empresas de **automação residencial e segurança eletrônica**.

O sistema cobre todo o ciclo de vida comercial da empresa:
1. **Catálogo de Equipamentos e Dispositivos:** visualização e controle de produtos (hubs, fechaduras, interruptores, sensores, câmeras, atuadores).
2. **Base de Clientes:** cadastro, contatos, endereços de instalação e histórico de compras.
3. **Ponto de Venda (PDV / Novo Pedido):** interface rápida e ágil para montagem de orçamentos e pedidos de venda com cálculo atômico de valores.
4. **Gestão de Pedidos & Máquina de Estados:** controle rigoroso de transições de status (`orcamento` ➔ `aprovado` ➔ `agendado` ➔ `em_andamento` ➔ `concluido` / `cancelado`).
5. **Agenda Técnica e Instalações:** alocação de técnicos especializados, controle de horários e prevenção visual de sobreposição de instalações.
6. **Dashboard Analítico:** indicadores de faturamento mensal consolidado, distribuição de pedidos por status e próximas instalações.

---

## 2. Personas do Sistema

- **Consultor Comercial / Vendedor:**
  - Monta orçamentos rapidamente junto ao cliente.
  - Consulta o catálogo com fotos, preços e categorias.
  - Transforma orçamentos em pedidos aprovados após aceite do cliente.

- **Operador de Despacho / Backoffice:**
  - Acompanha pedidos aprovados.
  - Aloca técnicos e define datas e horários de instalação.
  - Monitora o pipeline de status em tempo real.

- **Técnico Instalador:**
  - Consulta sua grade de instalações na agenda.
  - Confere endereço, itens a serem instalados e observações técnicas.
  - Atualiza o status para `em_andamento` e `concluido`.

- **Gestor / Gerente de Operações:**
  - Acompanha faturamento consolidado do mês, pedidos pendentes e carga horária técnica no Dashboard.

---

## 3. Stack Tecnológica

| Camada | Tecnologia | Justificativa |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 + TypeScript 5 | Tipagem estrita que espelha os schemas do banco, componentes reativos de alta performance. |
| **Build Tool** | Vite 6 | Inicialização instantânea, Hot Module Replacement (HMR) e build otimizado. |
| **Estilização** | Tailwind CSS 3 | Design System responsivo, utilitários elegantes, consistência de espaçamentos e cores. |
| **Ícones** | Lucide React | Biblioteca moderna, leve e completa de ícones em SVG. |
| **Banco de Dados** | PostgreSQL 16 (via Supabase) | Suporte a triggers PL/pgSQL, colunas geradas, stored procedures transacionais (RPC) e RLS. |
| **API Client** | `@supabase/supabase-js` | Cliente oficial com comunicação direta via PostgREST e chamadas RPC. |

---

## 4. Filosofia de Arquitetura

> **Princípio Central:** *"Banco Forte (Regras e Integridade no PostgreSQL), Frontend Rápido e Fino".*

- **O Frontend não impõe regras críticas sozinho:** Toda validação (pulos de status, exigência de técnico no agendamento, recálculo de subtotal e total) é garantida no nível do PostgreSQL.
- Se o cliente web falhar ou for manipulado, o banco recusa a mutação com erro explícito (`400 Bad Request` / `RAISE EXCEPTION`).
- O frontend atua como espelho amigável, fornecendo prévias visuais em tempo real e exibindo feedback humano via toasts.
