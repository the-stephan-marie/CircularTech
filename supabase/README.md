# CircularTech Supabase (Step 2)

This folder contains the database schema and Row Level Security (RLS) policy scaffold for the CircularTech Waste Management app.

## What to do in Supabase
1. Create a Supabase project.
2. Go to **SQL Editor** (or run via the Supabase CLI).
3. Run `schema.sql`.
4. Run `storage.sql`.

## Admin vs collectors
- By default, new authenticated users get `role = 'collector'` (via the trigger).
- To make a user an admin, run:

```sql
update public.profiles
set role = 'admin'
where id = '<USER_UUID>';
```

## Storage upload + read
`storage.sql` creates a private bucket named `waste-photos` and applies RLS policies for:
- Upload (`insert`)
- Read (`select`, including signed-url flows)
- Admin-only update/delete

The app should upload photos to paths under `waste-photos` (recommended convention: `<collector_uid>/<waste_entry_id>.jpg`).

## If you hit "stack depth limit exceeded"
Run `fix_rls_stack_depth.sql`.

This patches recursive RLS evaluation caused by `public.is_admin()` + profiles policies.

**Then run `restore_admin_profiles_select.sql`** so admins can read collector profiles for User Management.

## Seed default collector rows
Run `seed_three_collectors.sql` to insert/update the three collector entries shown in the User Management UI:
- Kojo Annan
- Akosua Sarpong
- Yaw Danquah

It upserts into `public.collectors` and syncs phone numbers on `public.profiles`.

## Sync phone numbers across tables
Run `sync_phone_profiles_collectors.sql` to keep `public.profiles.phone_number` and
`public.collectors.phone_number` synchronized (with backfill + triggers).

## Sync display names across profile/auth
Run `sync_display_name_profiles_auth.sql` to keep `public.profiles.display_name`
and `auth.users.raw_user_meta_data.display_name` synchronized (with backfill + triggers).

