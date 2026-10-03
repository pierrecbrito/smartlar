# 06 — Segurança, Autenticação e Auditoria

## 1. Segurança no Banco (PostgreSQL Row Level Security)

O SmartLar utiliza o **Row Level Security (RLS)** do PostgreSQL 16 para segregação de permissões de acesso:

1. **Tabelas Protegidas:**
   - `clientes`, `produtos`, `tecnicos`, `pedidos`, `itens_pedido`, `historico_status`.
2. **Políticas de Acesso:**
   - **Leitura Pública Controlada:** Usuários autenticados podem consultar o catálogo de produtos e técnicos ativos.
   - **Operações Comerciais:** Inserção e atualização de pedidos e itens condicionadas a usuários autenticados (`auth.role() = 'authenticated'`).
   - **Imutabilidade do Histórico:** A tabela `historico_status` aceita apenas inserts executados internamente pela trigger `pedidos_ai`. Usuários diretos não possuem privilégio de `UPDATE` ou `DELETE` nessa tabela.

---

## 2. Trilha de Auditoria Automática

Toda alteração de status em `pedidos` aciona a trigger PL/pgSQL:
```sql
create trigger trg_pedidos_historico
after update of status on pedidos
for each row
execute function fn_registrar_historico_status();
```

- **Garantias:**
  - Registra o status anterior e o novo status.
  - Grava o timestamp exato da mutação.
  - Não pode ser contornada por chamadas diretas de API ou alterações no frontend.

---

## 3. Prevenção de Injeção e Manipulação de Dados

- **Chamadas Tipadas via PostgREST:** Todas as operações utilizam parâmetros preparados pelo driver `@supabase/supabase-js`, tornando injeções de SQL impossíveis.
- **Constraints de Integridade:** Validações de regex em e-mail e telefone no nível DDL impedem armazenamento de dados inconsistentes ou maliciosos.
- **Isolamento de Credenciais:** Variáveis de ambiente sensíveis (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) são mantidas em `.env` e nunca expostas em código versionado.
