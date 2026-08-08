# Meridian DocGen

Legal document generator for Meridian Legal Group — a full-stack, Supabase-powered wizard that turns template + client answers into lawyer-reviewable document drafts.

Built by VERXEON interns as a case-study deliverable. Property of VERXEON Technologies.

## Features

- **Dashboard** — live totals (templates, documents generated this month, drafts pending), activity feed, charts
- **Templates** — CRUD, dynamic field builder, placeholder-token body (`{{client_name}}`)
- **Clients** — CRUD, document history, search
- **Wizard** — multi-step form generated from a template's fields; merges answers into a draft
- **Review Queue** — attorneys comment, approve, or request changes
- **Staff & Roles** — users with admin/attorney/paralegal roles, RLS-enforced permissions
- **Reports** — documents per month, top templates, review times, outstanding queue
- **Settings** — firm info, roles, profile

## Tech Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Recharts · Supabase (Postgres + Auth + RLS)

## Project layout

```
├── PLAN.md                 # master implementation plan
├── docs/phases/            # per-phase instructions (phase-1..5)
├── src/                    # Next.js app
├── supabase/sql/           # schema.sql, seed.sql, policies.sql (DB is fully rebuildable from these)
└── scripts/create-demo-users.mjs
```

## Rebuild the entire database from scratch

1. Create a free Supabase project at https://supabase.com (Project name anything, save the DB password).
2. Apply the committed SQL **in order** — easiest via the SQL Editor, or the included runner:
   ```bash
   DATABASE_URL=postgresql://postgres.<ref>:<password>@<host>:5432/postgres \
     node scripts/run-sql.mjs      # schema.sql -> seed.sql -> policies.sql
   ```
   > If the direct DB host is IPv6-only (common), use the session/transaction **pooler** connection string from Project Settings → Database (`aws-0-<region>.pooler.supabase.com:6543`) — `run-sql.mjs` resolves IPv4 automatically.
3. Create the demo users and link them to staff rows:
   ```bash
   SUPABASE_URL=<project url> SUPABASE_SERVICE_ROLE_KEY=<service_role key> \
     node scripts/create-demo-users.mjs
   ```
   (Service role key: Project Settings → API. It is only used by this script, never by the app — the app runs on the anon key + RLS.)

> **Verified: full rebuild works from committed SQL on 8 Aug 2026.** The three files were run in order against a fresh Postgres 16 instance (with a minimal stub of the Supabase `auth` schema) and produced: 3 roles, 3 templates, 17 template fields, 3 clients, 5 staff, 1 firm_settings row, RLS enabled on every table, and all 24 policies — including the `generated_documents_update_paralegal` policy that stops paralegals from approving/finalizing documents.

## Run the app locally

```bash
npm install
cp .env.example .env      # fill in your Supabase URL + anon key + service_role key
npm run dev               # http://localhost:3000
```

Sign in with a demo user (all use **password123**):
- `admin@meridian.demo` — full access
- `attorney@meridian.demo` — review & approve
- `paralegal@meridian.demo` — create clients & drafts

## Environment variables (.env — never committed)

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API (anon/publishable) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (service_role) — only used by `scripts/` |

`.env` is gitignored. Any clone must create its own from `.env.example`.

## Optional: deploy to Vercel

Live demo: **https://meridian-docgen.vercel.app** (deployed 8 Aug 2026).

1. Push to GitHub, import the repo at vercel.com.
2. Add the two `NEXT_PUBLIC_*` env vars only (never `SUPABASE_SERVICE_ROLE_KEY`).
3. Deploy. No other config required.