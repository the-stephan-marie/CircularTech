-- Seed the three collector rows used by the UI into public.collectors.
-- This script requires the matching collector profiles to exist first.
--
-- If these names are not present in public.profiles yet, first set them on
-- the collector accounts in Supabase Auth/profiles.

with desired(name, phone) as (
  values
    ('Kojo Annan', '0555555550'),
    ('Akosua Sarpong', '0555555559'),
    ('Yaw Danquah', '0555555558')
),
matched_profiles as (
  select p.id, d.name, d.phone
  from public.profiles p
  join desired d on lower(p.display_name) = lower(d.name)
  where p.role = 'collector'
)
update public.profiles p
set phone_number = mp.phone
from matched_profiles mp
where p.id = mp.id;

insert into public.collectors (user_id, status, phone_number)
select mp.id, 'active', mp.phone
from (
  select p.id, d.phone
  from public.profiles p
  join (
    values
      ('Kojo Annan', '0555555550'),
      ('Akosua Sarpong', '0555555559'),
      ('Yaw Danquah', '0555555558')
  ) as d(name, phone) on lower(p.display_name) = lower(d.name)
  where p.role = 'collector'
) as mp
on conflict (user_id)
do update set
  status = excluded.status,
  phone_number = excluded.phone_number;

