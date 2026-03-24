-- Restore admin ability to read all profiles (for User Management).
-- fix_rls_stack_depth.sql removed this to avoid recursion; now that is_admin()
-- is SECURITY DEFINER, we can safely add it back.
--
-- Run this in Supabase SQL Editor after fix_rls_stack_depth.sql.

create policy "profiles_select_admin"
on public.profiles
for select
using (public.is_admin());
