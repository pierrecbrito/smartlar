# 07 — Casos de Teste e Roteiro de Validação

## 1. Teste de Conformidade Canônico (Enunciado)

### Caso de Teste CT-01: Cálculo de Pedido com 2 Câmeras + 1 Sensor
- **Objetivo:** Garantir que o cálculo automático do banco produz exatamente R$ 1.080,00 sem arredondamento discrepante.
- **Entrada:**
  - Cliente: Marina Costa
  - Itens:
    - 2x Câmera Wi-Fi Externa (R$ 450,00 un) = R$ 900,00
    - 1x Sensor de Presença Smart (R$ 180,00 un) = R$ 180,00
- **Resultado Esperado:**
  - `itens_pedido` com subtotais R$ 900,00 e R$ 180,00.
  - `pedidos.valor_total` = R$ 1.080,00.
  - Status inicial = `orcamento`.

---

## 2. Testes da Máquina de Estados e Integridade

### Caso de Teste CT-02: Tentativa de Pular Etapa de Status
- **Ação:** Tentar atualizar diretamente de `orcamento` para `em_andamento` ou `concluido`.
- **Resultado Esperado:** O PostgreSQL rejeita a transação com `RAISE EXCEPTION` e o frontend exibe toast de erro.

### Caso de Teste CT-03: Agendamento sem Técnico ou Data
- **Ação:** Tentar transicionar de `aprovado` para `agendado` enviando `tecnico_id = null` ou `data_instalacao = null`.
- **Resultado Esperado:** O banco recusa a operação com mensagem de erro informando a obrigatoriedade dos dados técnicos.

### Caso de Teste CT-04: Conclusão Automática com Timestamp
- **Ação:** Transicionar de `em_andamento` para `concluido`.
- **Resultado Esperado:** O status muda para `concluido` e a coluna `concluido_em` é preenchida automaticamente pelo banco com `now()`.

### Caso de Teste CT-05: Criação Atômica com Produtos Duplicados no Payload
- **Ação:** Chamar `criar_pedido` passando duas linhas para o mesmo `produto_id`.
- **Resultado Esperado:** A RPC agrupa as quantidades somando-as e gera apenas uma linha em `itens_pedido`.

---

## 3. Testes de Interface e UX

### Caso de Teste CT-06: Prevenção de Botões Inválidos
- **Ação:** Acessar a tela de Gestão de Pedidos e inspecionar os botões de ação de cada card.
- **Resultado Esperado:** Um pedido com status `orcamento` só exibe os botões "Aprovar" e "Cancelar"; não exibe "Concluir" nem "Agendar".

### Caso de Teste CT-07: Detecção de Conflito de Horário na Agenda
- **Ação:** Agendar duas instalações para o mesmo técnico no mesmo dia com diferença de apenas 30 minutos.
- **Resultado Esperado:** A tela de Agenda destaca o badge de alerta de sobreposição de horário.
