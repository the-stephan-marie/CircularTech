-- Fix for "stack depth limit exceeded" from recursive RLS checks.
--
-- Root cause:
-- - policies on public.profiles call public.is_admin()
-- - public.is_admin() queries public.profiles
-- => recursion during policy evaluation

-- 1) Replace is_admin with SECURITY DEFINER version.
-- This runs with function owner privileges and avoids recursive policy checks.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

-- 2) Remove recursive self-reference on profiles policies.
-- Profiles table should not need is_admin() to let users read/update themselves.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (id = auth.uid());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

-- Keep existing insert policy.
-- "profiles_insert_own" remains valid.

