-- =====================================================================
-- SmartLar — 07_fix_security_invoker_views.sql
-- Correção de Views com status UNRESTRICTED (Security Definer -> Security Invoker)
--
-- No Supabase, views sem "security_invoker = true" rodam como o owner (postgres)
-- e ignoram as regras de RLS (Row Level Security), exibindo a tag vermelha UNRESTRICTED.
-- Este script ativa o modo Security Invoker em todas as views para que elas
-- respeitem as políticas de segurança do usuário autenticado.
-- =====================================================================

-- 1. Ativa security_invoker na view v_agenda_pedidos (remove o UNRESTRICTED)
ALTER VIEW public.v_agenda_pedidos SET (security_invoker = true);

-- 2. Garante o mesmo para as outras views do sistema
ALTER VIEW public.v_dashboard_resumo SET (security_invoker = true);
ALTER VIEW public.v_instalacoes SET (security_invoker = true);

-- =====================================================================
-- Caso a view v_agenda_pedidos não seja mais utilizada pelo sistema,
-- você também pode simplesmente removê-la com:
-- DROP VIEW IF EXISTS public.v_agenda_pedidos;
-- =====================================================================
