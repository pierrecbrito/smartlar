# PLANO DE EXECUÇÃO — SMARTLAR (48H)

Plano tático e cronograma para o desenvolvimento, validação e entrega do projeto técnico **SmartLar**.

---

## 1. Distribuição de Nota e Critérios de Avaliação

- **Frontend:** 30%
- **Banco de Dados:** 20%
- **Lógica de Negócio:** 15%
- **Automações (n8n):** 15%
- **Integração:** 10%
- **Documentação:** 10%

> **Estratégia Principal:** Banco forte (regras no banco), Front fino, n8n robusto e Documentação transparente.

### Fatores Eliminatórios (Checklist de Risco Zero):
- [ ] Link quebrado ou indisponível
- [ ] Dados hardcoded / mockados
- [ ] Nenhuma automação funcionando
- [ ] Total do pedido incorreto ou divergente do banco
- [ ] Não conseguir adicionar itens ao pedido
- [ ] Repositório vazio ou sem histórico
- [ ] Incapacidade de explicar o código ou as decisões na entrevista

---

## 2. Cronograma de 48 Horas

| Janela | Foco Principal | Entregáveis |
|---|---|---|
| **0–1h** | Setup, repositório, documentação base | Git init, `README.md`, `DECISIONS.md`, `IA-LOG.md` |
| **1–3h** | Banco de dados | Validação dos scripts SQL, triggers, views, conferência de R$ 1.080 |
| **3–20h** | Frontend | Telas: Produtos, Clientes, Novo Pedido, Gestão de Pedidos, Agenda, Dashboard |
| **20–24h** | Descanso e Commits | Validação de checkpoints e commits atômicos |
| **24–34h** | n8n | Automação 1 (Novo Pedido), Automação 2 (Alerta Diário), Automação 3 (Bônus Concluído) |
| **34–40h** | Login, RLS e Deploy | Supabase Auth, ativação do `03_rls.sql`, deploy na Vercel/Netlify |
| **40–46h** | Teste E2E e Documentação | Teste completo do fluxo, screenshots, revisão dos 6 entregáveis |
| **46–48h** | Buffer de segurança | Validação final de links e formulários |

---

## 3. Matriz de Defesa para a Entrevista

1. **Regras no banco, não no front:** A máquina de estados e constraints impedem que falhas de cliente corrompam a consistência dos dados.
2. **Preço congelado (`itens_pedido.preco_unitario`):** Snapshot de preço garante histórico imutável após a venda.
3. **Cálculo automático:** `subtotal` é gerado e `valor_total` mantido por trigger no Postgres.
4. **RPC atômica (`criar_pedido`):** Criação de pedido e itens em uma única transação atômica.
5. **Fuso Horário (`timestamptz` com `America/Sao_Paulo`):** Garante precisão no fechamento do faturamento mensal e nos alertas do n8n.
6. **Views Especializadas:** `v_dashboard_resumo` e `v_instalacoes` simplificam as requisições de front e automações.
7. **Trilha de Auditoria:** `historico_status` preenchido de forma transparente por triggers.
