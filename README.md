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

## Troubleshooting

If `npm install` fails with **EPERM** / `operation not permitted` on Windows, close editors or antivirus locks on `web/node_modules`, delete `web/node_modules` (and `package-lock.json` if present), then run `npm install` again. A broken install may show errors like `Cannot find module 'next/dist/compiled/zod'` until dependencies are reinstalled cleanly.
