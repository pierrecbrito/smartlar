-- ============================================================================
-- 04_storage_orcamentos.sql
-- Configuração do Supabase Storage para armazenamento de propostas em PDF
-- ============================================================================

-- 1. Criação do bucket 'orcamentos' com acesso público de leitura
insert into storage.buckets (id, name, public)
values ('orcamentos', 'orcamentos', true)
on conflict (id) do update set public = true;

-- 2. Políticas de Acesso para o Bucket 'orcamentos'

-- Permite que qualquer cliente com o link acesse o PDF público gerado
drop policy if exists "Leitura pública de propostas e orçamentos" on storage.objects;
create policy "Leitura pública de propostas e orçamentos"
on storage.objects for select
using (bucket_id = 'orcamentos');

-- Permite upload de propostas pelo frontend (anon ou authenticated)
drop policy if exists "Upload de propostas e orçamentos" on storage.objects;
create policy "Upload de propostas e orçamentos"
on storage.objects for insert
with check (bucket_id = 'orcamentos');

-- Permite sobrescrever o PDF caso o orçamento seja reemitido
drop policy if exists "Atualização de propostas e orçamentos" on storage.objects;
create policy "Atualização de propostas e orçamentos"
on storage.objects for update
using (bucket_id = 'orcamentos');
