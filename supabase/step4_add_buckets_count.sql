-- Step 4 migration: add buckets_count to waste_entries
-- Run this after `schema.sql`.
-- This enables deriving quantity_kg and metrics from bucket counts.

alter table public.waste_entries
add column if not exists buckets_count integer not null default 0;

-- Backfill existing rows that were inserted before buckets_count existed.
-- Coefficients come from the collector demo:
-- - plastic: 0.5 kg/bucket
-- - organic: 0.4 kg/bucket
update public.waste_entries
set buckets_count = case
  when waste_type = 'plastic' then greatest(0, round(quantity_kg / 0.5))
  when waste_type = 'organic' then greatest(0, round(quantity_kg / 0.4))
  else buckets_count
end
where buckets_count = 0 and quantity_kg is not null;

