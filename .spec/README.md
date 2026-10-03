# 📋 Especificação do Projeto SmartLar

Este diretório contém a especificação técnica, os modelos de dados, os scripts SQL e as documentações de arquitetura do sistema **SmartLar**.

---

## 🗂️ Estrutura da Especificação (`.spec/`)

### Documentos Normativos
1. [**01_visao_geral.md**](file:///c:/Users/Pierre%20Brito/Documents/smartlar/.spec/01_visao_geral.md)
   - Propósito do sistema, objetivos de negócio, personas e stack tecnológica.
2. [**02_regras_negocio.md**](file:///c:/Users/Pierre%20Brito/Documents/smartlar/.spec/02_regras_negocio.md)
   - Máquina de estados de pedidos, cálculo atômico, congelamento de preços e regras de agendamento.
3. [**03_modelo_dados.md**](file:///c:/Users/Pierre%20Brito/Documents/smartlar/.spec/03_modelo_dados.md)
   - Dicionário de dados, tabelas relacionais, views, triggers e stored procedures (RPC).
4. [**04_requisitos_funcionais.md**](file:///c:/Users/Pierre%20Brito/Documents/smartlar/.spec/04_requisitos_funcionais.md)
   - Requisitos funcionais (RF-01 a RF-06) tela a tela (Dashboard, Produtos, Clientes, PDV/Novo Pedido, Pedidos, Agenda).
5. [**05_design_system_ux.md**](file:///c:/Users/Pierre%20Brito/Documents/smartlar/.spec/05_design_system_ux.md)
   - Especificação visual Tablet POS, tokens, componentes, comportamentos de interface e feedback.
6. [**06_seguranca_auditoria.md**](file:///c:/Users/Pierre%20Brito/Documents/smartlar/.spec/06_seguranca_auditoria.md)
   - Políticas de Row Level Security (RLS), trilha de auditoria e proteção de dados.
7. [**07_casos_de_teste.md**](file:///c:/Users/Pierre%20Brito/Documents/smartlar/.spec/07_casos_de_teste.md)
   - Matriz de testes de conformidade, validação canônica de valores e casos de erro.

---

### 🗄️ Banco de Dados & Scripts SQL (`.spec/database/`)
- [**01_schema.sql**](file:///c:/Users/Pierre%20Brito/Documents/smartlar/.spec/database/01_schema.sql) — DDL de tabelas, triggers, views e RPC `criar_pedido`.
- [**02_seed.sql**](file:///c:/Users/Pierre%20Brito/Documents/smartlar/.spec/database/02_seed.sql) — Carga inicial com cenários realistas de teste.
- [**03_rls.sql**](file:///c:/Users/Pierre%20Brito/Documents/smartlar/.spec/database/03_rls.sql) — Políticas de Row Level Security por perfil.
- [**04_storage_orcamentos.sql**](file:///c:/Users/Pierre%20Brito/Documents/smartlar/.spec/database/04_storage_orcamentos.sql) — Configuração do bucket de Storage 'orcamentos' e políticas públicas de visualização.
- [**05_enderecos_estruturados.sql**](file:///c:/Users/Pierre%20Brito/Documents/smartlar/.spec/database/05_enderecos_estruturados.sql) — Migração para endereços estruturados (ViaCEP), snapshot no pedido e ponto de referência.

---

### 📄 Documentos de Governança & Histórico (`.spec/docs/`)
- [**DECISIONS.md**](file:///c:/Users/Pierre%20Brito/Documents/smartlar/.spec/docs/DECISIONS.md) — Racional técnico e justificativa de arquitetura para a entrevista.
- [**IA-LOG.md**](file:///c:/Users/Pierre%20Brito/Documents/smartlar/.spec/docs/IA-LOG.md) — Relatório de transparência do uso de Inteligência Artificial.
- [**PLANO_PROJETO.md**](file:///c:/Users/Pierre%20Brito/Documents/smartlar/.spec/docs/PLANO_PROJETO.md) — Planejamento estratégico, checklist de riscos e cronograma.
- [**teste-pratico-dev-nocode-junior.pdf**](file:///c:/Users/Pierre%20Brito/Documents/smartlar/.spec/docs/teste-pratico-dev-nocode-junior.pdf) — Documento de especificação original.
