# 02 — Regras de Negócio e Máquina de Estados

## 1. Ciclo de Vida do Pedido (Máquina de Estados)

Todo pedido no SmartLar segue uma máquina de estados finita e determinística controlada pela trigger `pedidos_bu` no PostgreSQL.

```
       [ Criar Pedido ]
              │
              ▼
        ┌───────────┐
        │ orcamento │ ────── (Cancelar) ─────┐
        └─────┬─────┘                        │
              │ (Aprovar)                    │
              ▼                              │
        ┌───────────┐                        │
        │  aprovado │ ────── (Cancelar) ─────┤
        └─────┬─────┘                        │
              │ (Agendar: exige              │
              │  tecnico_id + data)          │
              ▼                              │
        ┌───────────┐                        ▼
        │  agendado │                 ┌───────────┐
        └─────┬─────┘                 │ cancelado │
              │ (Iniciar)             └───────────┘
              ▼                              ▲
      ┌───────────────┐                      │
      │ em_andamento  │                      │
      └───────┬───────┘                      │
              │ (Concluir: grava             │
              │  concluido_em = now())       │
              ▼                              │
        ┌───────────┐                        │
        │ concluido │ ───────────────────────┘ (Bloqueado)
        └───────────┘
```

### 1.1 Regras de Transição
1. **Nascimento Obrigatório:** Todo pedido é criado obrigatoriamente no status `orcamento` (garantido por trigger `pedidos_bi`).
2. **Aprovação:**
   - Origem: `orcamento`
   - Destino: `aprovado` ou `cancelado`
3. **Agendamento:**
   - Origem: `aprovado`
   - Destino: `agendado` ou `cancelado`
   - **Restrição Crítica:** É **obrigatório** fornecer `tecnico_id` (UUID existente) e `data_instalacao` (timestamptz válido). Tentativas de agendar sem técnico ou data disparam exceção no banco.
4. **Execução:**
   - Origem: `agendado`
   - Destino: `em_andamento`
5. **Conclusão:**
   - Origem: `em_andamento`
   - Destino: `concluido`
   - **Ação Automática:** A coluna `concluido_em` é preenchida automaticamente com `clock_timestamp()`.
6. **Cancelamento:**
   - Permitido a partir de `orcamento` ou `aprovado`.
   - Pedidos `em_andamento` ou `concluido` **não podem** ser cancelados.
7. **Impedimento de Pulos e Retrocessos:**
   - É estritamente proibido passar direto de `orcamento` para `em_andamento` ou `concluido`.
   - É estritamente proibido retroceder de `concluido` para qualquer outro status.

---

## 2. Snapshot de Preço e Subtotal Imutável

1. **Preço Congelado:**
   - No momento da inclusão de um item no pedido (`itens_pedido`), o preço unitário do produto é lido e gravado na coluna `itens_pedido.preco_unitario numeric(10,2)`.
   - Caso o produto tenha seu preço reajustado posteriormente no catálogo, pedidos antigos **não** sofrem alteração retrospectiva.
2. **Subtotal Calculado pelo Banco:**
   - O campo `subtotal` é uma coluna gerada computada pelo PostgreSQL:
     ```sql
     subtotal numeric(12,2) generated always as (quantidade * preco_unitario) stored
     ```
   - Elimina divergências de arredondamento entre navegadores e clientes.
3. **Total do Pedido:**
   - O campo `pedidos.valor_total` é recalculado automaticamente pelas triggers `itens_bi` e `itens_ai`.
   - O frontend nunca envia o total como campo gravável, garantindo imunidade contra adulteração.

---

## 3. Criação Atômica de Pedidos (RPC `criar_pedido`)

- A criação do pedido e dos seus itens é executada por uma stored procedure PostgreSQL:
  ```sql
  criar_pedido(p_cliente_id uuid, p_observacoes text, p_itens jsonb)
  ```
- **Benefícios:**
  - **Atomicidade (ACID):** Se qualquer item falhar (ex: produto inativo), a transação inteira sofre rollback. O sistema nunca terá pedidos órfãos ou incompletos.
  - **Agrupamento Automático:** Caso o payload JSON contenha o mesmo produto repetido, as quantidades são somadas automaticamente antes da inserção.
  - **Retorno Imediato:** Retorna o ID gerado, permitindo que a interface redirecione imediatamente para os detalhes do pedido recém-criado.

---

## 4. Prevenção de Conflitos na Agenda Técnica

1. **Duração Padrão de Instalação:**
   - Uma instalação típica de automação tem janela mínima estimada de 2 horas.
2. **Detecção de Conflitos:**
   - A interface e a query de validação verificam se o mesmo `tecnico_id` possui outro agendamento dentro do intervalo de `+/- 2 horas`.
   - Em caso de conflito, a interface exibe alerta visual de sobreposição para o operador.

---

## 5. Fuso Horário Padronizado (`America/Sao_Paulo`)

- Todas as colunas de data/hora utilizam `timestamptz`.
- As agregações de faturamento mensal e listagem de instalações convertem explicitamente para `'America/Sao_Paulo'`, assegurando que fechamentos mensais e filtros de calendário correspondam ao horário comercial brasileiro.
