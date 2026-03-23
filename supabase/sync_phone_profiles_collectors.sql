-- Keep phone_number synchronized between:
-- - public.profiles.phone_number
-- - public.collectors.phone_number
--
-- This script:
-- 1) backfills existing rows
-- 2) adds triggers for ongoing sync in both directions

-- 1) Backfill collectors from profiles where collectors.phone_number is missing.
update public.collectors c
set phone_number = p.phone_number
from public.profiles p
where p.id = c.user_id
  and c.phone_number is null
  and p.phone_number is not null;

-- 2) Backfill profiles from collectors where profiles.phone_number is missing.
update public.profiles p
set phone_number = c.phone_number
from public.collectors c
where c.user_id = p.id
  and p.phone_number is null
  and c.phone_number is not null;

-- 3) Sync collectors when profiles changes.
create or replace function public.sync_collector_phone_from_profile()
returns trigger
language plpgsql
as $$
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  update public.collectors
  set phone_number = new.phone_number
  where user_id = new.id
    and phone_number is distinct from new.phone_number;

  return new;
end;
$$;

drop trigger if exists trg_sync_collector_phone_from_profile on public.profiles;
create trigger trg_sync_collector_phone_from_profile
after insert or update of phone_number on public.profiles
for each row
execute procedure public.sync_collector_phone_from_profile();

-- 4) Sync profiles when collectors changes.
create or replace function public.sync_profile_phone_from_collector()
returns trigger
language plpgsql
as $$
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  update public.profiles
  set phone_number = new.phone_number
  where id = new.user_id
    and phone_number is distinct from new.phone_number;

  return new;
end;
$$;

drop trigger if exists trg_sync_profile_phone_from_collector on public.collectors;
create trigger trg_sync_profile_phone_from_collector
after insert or update of phone_number on public.collectors
for each row
execute procedure public.sync_profile_phone_from_collector();

