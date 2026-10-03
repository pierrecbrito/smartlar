# 06 — Segurança, Autenticação e Auditoria

## 1. Segurança no Banco (PostgreSQL Row Level Security)

O SmartLar utiliza o **Row Level Security (RLS)** estrito do PostgreSQL 16 para segregação de permissões de acesso:

1. **Tabelas Protegidas:**
   - `clientes`, `produtos`, `tecnicos`, `pedidos`, `itens_pedido`, `historico_status`.
2. **Políticas de Acesso (`03_rls.sql`):**
   - **Isolamento de Não-Autenticados:** Usuários anônimos têm acesso bloqueado pelo RLS em todas as tabelas.
   - **Operações para Usuários Autenticados:** Acesso de leitura e escrita condicionado a usuários autenticados (`auth.role() = 'authenticated'`).
   - **Imutabilidade do Histórico:** A tabela `historico_status` aceita apenas inserts executados internamente pela trigger `pedidos_ai`. Usuários diretos não possuem privilégio de `UPDATE` ou `DELETE` nessa tabela.
3. **Views com Security Invoker (`07_fix_security_invoker_views.sql`):**
   - As views do sistema (`v_dashboard_resumo`, `v_instalacoes`, `v_agenda_pedidos`) são criadas com `WITH (security_invoker = true)`.
   - Isso impede que as views executem como o owner `postgres` (Security Definer / UNRESTRICTED), forçando a validação das políticas RLS do usuário conectado.

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

## 3. Autenticação, Proteção de Sessão e Hardening do Front-end

1. **Guarda de Sessão (`LoginPage`):**
   - O aplicativo valida a sessão ativa no Supabase Auth antes de renderizar qualquer rota ou dado.
   - Usuários não logados têm acesso exclusivamente à tela de login dedicada.
2. **Controle de Contas:**
   - Criação de contas bloqueada pelo formulário público, evitando cadastros não autorizados.
   - Usuário oficial de administração: `admin@smartlar.com.br`, confirmado e ativado via script `06_confirm_admin.sql`.
3. **Ocultação de Detalhes Técnicos:**
   - Nenhum botão de "Configurar DB" ou modal de infraestrutura é exposto na interface do usuário. As credenciais de conexão são injetadas estritamente via variáveis de ambiente seguras (`.env` / Vercel Environment Variables).

---

## 4. Prevenção de Injeção e Manipulação de Dados

- **Chamadas Tipadas via PostgREST:** Todas as operações utilizam parâmetros preparados pelo driver `@supabase/supabase-js`, tornando injeções de SQL impossíveis.
- **Constraints de Integridade:** Validações de regex em e-mail e telefone no nível DDL impedem armazenamento de dados inconsistentes ou maliciosos.
- **Isolamento de Credenciais:** Variáveis de ambiente sensíveis (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) são mantidas em `.env` e nunca expostas em código versionado. A chave com privilégios de superusuário (`service_role`) permanece exclusiva do n8n em backend seguro.
