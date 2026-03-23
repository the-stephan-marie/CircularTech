-- Keep display_name synchronized between:
-- - public.profiles.display_name
-- - auth.users.raw_user_meta_data->>'display_name'
--
-- This script:
-- 1) backfills missing values in both directions
-- 2) adds triggers for ongoing sync

-- 1) Backfill profiles from auth.users metadata when profiles.display_name is empty.
update public.profiles p
set display_name = nullif(btrim(u.raw_user_meta_data->>'display_name'), '')
from auth.users u
where u.id = p.id
  and coalesce(btrim(p.display_name), '') = ''
  and coalesce(btrim(u.raw_user_meta_data->>'display_name'), '') <> '';

-- 2) Backfill auth.users metadata from profiles when metadata display_name is empty.
update auth.users u
set raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb) ||
  jsonb_build_object('display_name', p.display_name)
from public.profiles p
where p.id = u.id
  and coalesce(btrim(p.display_name), '') <> ''
  and coalesce(btrim(u.raw_user_meta_data->>'display_name'), '') = '';

-- 3) Sync auth.users metadata when profiles.display_name changes.
create or replace function public.sync_auth_display_name_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) ||
    jsonb_build_object('display_name', new.display_name)
  where id = new.id
    and coalesce(btrim(raw_user_meta_data->>'display_name'), '')
      is distinct from coalesce(btrim(new.display_name), '');

  return new;
end;
$$;

drop trigger if exists trg_sync_auth_display_name_from_profile on public.profiles;
create trigger trg_sync_auth_display_name_from_profile
after insert or update of display_name on public.profiles
for each row
execute procedure public.sync_auth_display_name_from_profile();

-- 4) Sync profiles.display_name when auth.users metadata changes.
create or replace function public.sync_profile_display_name_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text := nullif(btrim(new.raw_user_meta_data->>'display_name'), '');
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  update public.profiles
  set display_name = v_display_name
  where id = new.id
    and coalesce(btrim(display_name), '') is distinct from coalesce(v_display_name, '');

  return new;
end;
$$;

drop trigger if exists trg_sync_profile_display_name_from_auth on auth.users;
create trigger trg_sync_profile_display_name_from_auth
after insert or update of raw_user_meta_data on auth.users
for each row
execute procedure public.sync_profile_display_name_from_auth();

