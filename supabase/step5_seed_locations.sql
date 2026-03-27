-- Step 5 migration: create and seed canonical locations list

create table if not exists public.locations (
  id bigserial primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

insert into public.locations (name)
values
  ('GSL'),
  ('Rawlings Park'),
  ('Ako Adjei Park'),
  ('Cantonements'),
  ('Heavy Industrial Area'),
  ('Mile 7'),
  ('Timber Market')
on conflict (name) do nothing;
