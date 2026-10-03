-- =====================================================================
-- SmartLar — 06_confirm_admin.sql
-- Confirmação e Ativação Imediata do Usuário Admin no Supabase Auth
--
-- Execute este script no SQL Editor do Supabase para confirmar
-- o e-mail do admin@smartlar.com.br instantaneamente caso o
-- projeto esteja com "Confirm email" ativado.
-- =====================================================================

UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
    confirmed_at = COALESCE(confirmed_at, now())
WHERE email = 'admin@smartlar.com.br';

-- Verificar status do usuário:
SELECT id, email, email_confirmed_at, created_at, last_sign_in_at
FROM auth.users
WHERE email = 'admin@smartlar.com.br';
