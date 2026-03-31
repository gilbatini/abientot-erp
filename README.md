# AlgoriOffice — À Bientôt Instance

**AlgoriOffice** is a product by [Algorivia](https://algorivia.com).
This deployment serves **À Bientôt Tour & Travels Ltd** — Kampala, Uganda.

Stack: Next.js 15 · Supabase · Tailwind CSS v4 · Resend · @react-pdf/renderer

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in your keys
cp .env.example .env.local

# 3. Run the Supabase migration
# Paste supabase/migrations/001_initial_schema.sql into Supabase SQL Editor

# 4. Generate TypeScript types from your live schema
npm run types

# 5. Start dev server
npm run dev
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — mark Sensitive in Vercel |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | e.g. `AlgoriOffice <noreply@algorivia.com>` |
| `NEXT_PUBLIC_APP_URL` | e.g. `https://abientot-erp.vercel.app` |

---

## First User Setup

After running the SQL migration, create Remmy in Supabase Auth then run:

```sql
update auth.users
set raw_user_meta_data = '{"role": "admin", "name": "Remmy Ssekanjako"}'
where email = 'remmy@abientottravels.com';
```

For agents (e.g. Rida): `"role": "agent"`
For read-only staff: `"role": "viewer"`

---

## Supabase Storage

Create a private bucket called **`passports`** in Supabase Dashboard → Storage.

Bucket policies:
- SELECT: `auth.role() = 'authenticated'`
- INSERT: `auth.role() = 'authenticated'` AND `auth_role() IN ('admin','agent')`
- DELETE: `auth_role() = 'admin'`

---

## Build Phases

| Phase | Scope | Status |
|---|---|---|
| 1 | Foundation: auth, app shell, Supabase clients, middleware | ✅ Scaffolded |
| 2 | Travellers: list, create, edit, passport upload | 🔲 Build next |
| 3 | Invoices: list, create, PDF generation, email sending | 🔲 |
| 4 | Receipts, Proformas, Quotations, convert-to-invoice | 🔲 |
| 5 | Dashboard stats, Settings, Vercel deploy, seed data | 🔲 |

---

## Key Files

| File | Purpose |
|---|---|
| `CLAUDE.md` | AI coding instructions — Claude Code reads this automatically |
| `SKILL.md` | Design system: tokens, components, PDF styles |
| `supabase/migrations/001_initial_schema.sql` | Full DB schema + RLS policies |
| `src/types/app.ts` | Role, status, service type enums + BRAND constants |
| `src/middleware.ts` | Route protection: auth check + role guard |

---

## Product

Built by [Algorivia](https://algorivia.com) · Deployed for À Bientôt Tour & Travels Ltd
