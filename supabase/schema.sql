-- CircularTech Supabase schema + RLS scaffold (Step 2)
-- Run this in your Supabase project SQL editor (or via Supabase CLI migrations).

-- Enable UUID helpers used by gen_random_uuid()
create extension if not exists "pgcrypto";

-- Profiles: one row per auth user, holds role and basic identity.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'collector' check (role in ('admin', 'collector')),
  phone_number text,
  created_at timestamptz not null default now()
);

-- Collectors: additional attributes for users that submit waste.
create table if not exists public.collectors (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'inactive')),
  phone_number text,
  created_at timestamptz not null default now()
);

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- Trigger: whenever a new auth user is created, create a profile row.
-- Collectors are created by default (role defaults to 'collector').
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data->>'role', 'collector');
begin
  insert into public.profiles (id, display_name, role, phone_number)
  values (
    new.id,
    new.raw_user_meta_data->>'display_name',
    v_role,
    new.raw_user_meta_data->>'phone_number'
  )
  on conflict (id) do nothing;

  -- Only create collector record if the user is a collector.
  if v_role = 'collector' then
    insert into public.collectors (user_id, status, phone_number)
    values (
      new.id,
      'active',
      new.raw_user_meta_data->>'phone_number'
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- RLS: profiles
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

create policy "profiles_select_own_or_admin"
on public.profiles
for select
using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own_or_admin"
on public.profiles
for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- Allow inserts by the trigger path (service role) and self (rare).
create policy "profiles_insert_own"
on public.profiles
for insert
with check (id = auth.uid());

-- Waste entries: what collectors submit for a given zone/location.
create table if not exists public.waste_entries (
  id uuid primary key default gen_random_uuid(),
  collector_id uuid not null references auth.users(id) on delete restrict,

  -- Matches your UI: Data Entries uses a "Zone" column.
  zone text not null,
  waste_type text not null check (waste_type in ('organic', 'plastic')),
  quantity_kg numeric(12,3) not null check (quantity_kg >= 0),

  status text not null default 'pending' check (status in ('pending', 'verified')),
  photo_path text,

  submitted_at timestamptz not null default now(),

  validated_at timestamptz,
  validated_by uuid references auth.users(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists waste_entries_submitted_at_idx on public.waste_entries(submitted_at desc);
create index if not exists waste_entries_collector_idx on public.waste_entries(collector_id);
create index if not exists waste_entries_zone_idx on public.waste_entries(zone);
create index if not exists waste_entries_waste_type_idx on public.waste_entries(waste_type);
create index if not exists waste_entries_status_idx on public.waste_entries(status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_waste_entries_updated_at on public.waste_entries;
create trigger set_waste_entries_updated_at
before update on public.waste_entries
for each row
execute procedure public.set_updated_at();

-- RLS: waste_entries
alter table public.waste_entries enable row level security;
alter table public.waste_entries force row level security;

create policy "waste_entries_select_own_or_admin"
on public.waste_entries
for select
using (collector_id = auth.uid() or public.is_admin());

create policy "waste_entries_insert_own"
on public.waste_entries
for insert
with check (collector_id = auth.uid());

create policy "waste_entries_update_admin_only"
on public.waste_entries
for update
using (public.is_admin())
with check (public.is_admin());

create policy "waste_entries_delete_admin_only"
on public.waste_entries
for delete
using (public.is_admin());

-- RLS: collectors
alter table public.collectors enable row level security;
alter table public.collectors force row level security;

create policy "collectors_select_own_or_admin"
on public.collectors
for select
using (user_id = auth.uid() or public.is_admin());

create policy "collectors_update_admin_only"
on public.collectors
for update
using (public.is_admin())
with check (public.is_admin());

create policy "collectors_insert_admin_only"
on public.collectors
for insert
with check (public.is_admin());

