# CircularTech web (Step 1)

Next.js App Router + Tailwind. **Light theme only** for v1 (`DESIGN.md` tokens in `tailwind.config.ts`).

## Scripts

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/dashboard`.

## Routes

| Path | Screen |
|------|--------|
| `/dashboard` | Waste Management Engine |
| `/users` | User Management |
| `/data` | Data Entries |
| `/settings` | Settings placeholder |

## Structure

- `app/(main)/` — shell layout + feature pages
- `components/` — `Sidebar`, `PageHeader`, `AppChrome`
- `components/views/*` — page bodies ported from `../code.html`

The static prototype remains at the repo root as `code.html` for reference.

## Netlify + Supabase Auth

When deployed to Netlify, you **must** sign in to see data. RLS requires authenticated users:

1. **Admin**: Sign in at `/login` with an admin account → you'll be redirected to `/dashboard`.
2. **Collector**: Sign in at `/login` with a collector account → you'll be redirected to `/collector`.

**Create an admin**: In Supabase, create a user via Auth (or use existing), then in SQL:  
`update public.profiles set role = 'admin' where id = '<user-uuid>';`  
See `supabase/README.md` for details.

In [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication** → **URL Configuration**, add your Netlify URL:

- **Site URL**: `https://your-site.netlify.app`
- **Redirect URLs**: Add `https://your-site.netlify.app/**` (and `http://localhost:3000/**` for local dev)

Without this, auth sessions may not persist on the deployed domain.

## Troubleshooting

If `npm install` fails with **EPERM** / `operation not permitted` on Windows, close editors or antivirus locks on `web/node_modules`, delete `web/node_modules` (and `package-lock.json` if present), then run `npm install` again. A broken install may show errors like `Cannot find module 'next/dist/compiled/zod'` until dependencies are reinstalled cleanly.
