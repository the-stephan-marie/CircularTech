-- Clear all waste submissions so the dashboard / data views start empty.
-- Run this in the Supabase Dashboard → SQL Editor (uses elevated privileges; bypasses RLS).
--
-- 1) Deletes every row in public.waste_entries
-- 2) Optionally removes objects in the waste-photos bucket (uncomment if you want storage cleared too)

-- All table rows
delete from public.waste_entries;

-- Optional: remove uploaded evidence files (same bucket as collector uploads).
-- Uncomment the next line if you also want an empty waste-photos bucket:
-- delete from storage.objects where bucket_id = 'waste-photos';
