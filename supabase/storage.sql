-- CircularTech Supabase Storage scaffold (Step 3)
-- Run after `schema.sql`.
--
-- Creates the `waste-photos` bucket and applies RLS policies:
-- - Admins can read/write.
-- - Collectors can read objects they "own" (storage `owner`) and upload their own.
--
-- IMPORTANT PATH CONVENTION (recommended)
-- Store objects under a path that includes the auth user id or waste entry id, e.g.:
--   <collector_uid>/<waste_entry_id>.jpg
-- This keeps audit/debugging simple. The policies below use storage `owner`.

-- Create bucket (private by default).
insert into storage.buckets (id, name, public)
values ('waste-photos', 'waste-photos', false)
on conflict (id) do nothing;

-- NOTE:
-- In Supabase hosted projects, `storage.objects` is owned by an internal role.
-- Running `alter table ... enable/force row level security` from SQL editor can fail
-- with "must be owner of table objects".
-- Storage tables already run with RLS; we only manage per-bucket policies here.

-- Admin read access.
drop policy if exists "waste_photos_select_admin" on storage.objects;
create policy "waste_photos_select_admin"
on storage.objects
for select
using (
  bucket_id = 'waste-photos'
  and public.is_admin()
);

-- Collector read access (only their own uploaded objects).
drop policy if exists "waste_photos_select_own" on storage.objects;
create policy "waste_photos_select_own"
on storage.objects
for select
using (
  bucket_id = 'waste-photos'
  and owner = auth.uid()
);

-- Collector upload access.
drop policy if exists "waste_photos_insert_own" on storage.objects;
create policy "waste_photos_insert_own"
on storage.objects
for insert
with check (
  bucket_id = 'waste-photos'
  and owner = auth.uid()
);

-- Admin update/delete (keep modification restricted).
drop policy if exists "waste_photos_update_admin" on storage.objects;
create policy "waste_photos_update_admin"
on storage.objects
for update
using (bucket_id = 'waste-photos' and public.is_admin())
with check (bucket_id = 'waste-photos' and public.is_admin());

drop policy if exists "waste_photos_delete_admin" on storage.objects;
create policy "waste_photos_delete_admin"
on storage.objects
for delete
using (bucket_id = 'waste-photos' and public.is_admin());

