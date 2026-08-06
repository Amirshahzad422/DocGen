# Phase 1 — Foundation: Repo, Scaffold, Schema & Seed

> **Owner:** Ali Haider Bajwa (with AI assistant)
> **Branch:** `alihaiderbajwa-docgen`
> **Case-study tasks:** T1.1 (interface scaffold + Supabase connect), T1.2 (database schema + SQL scripts)
> **Est. effort:** ~1 day
> **DoD:** app boots connected to live Supabase, nav shows all 8 sections, schema + seed + baseline policies loaded, initial commit pushed, PR merged to main.

**For agentic workers:** execute this plan task-by-task with superpowers:executing-plans. Steps use `- [ ]` checkboxes for tracking.

## 0. Prerequisites

- [ ] Free Supabase project created at https://supabase.com (Project URL + anon key + service_role key + DB password saved).
- [ ] `gh auth login` done (or git credentials configured) with push access to https://github.com/verxeon-ai/DocGen.git.
- [ ] Node.js 20+ and npm installed.

## 1. Repo setup

- [ ] **Connect the local folder to the remote repo** (the remote starts empty, so init in place):
  ```bash
  git init -b alihaiderbajwa-docgen
  git remote add origin https://github.com/verxeon-ai/DocGen.git
  ```
- [ ] Verify: `git remote -v` shows origin, branch is `alihaiderbajwa-docgen`.
- [ ] **Commit the case study** (spec lives with the code):
  ```bash
  git add DocGen.pdf && git commit -m "docs: add case study spec"
  ```

## 2. Scaffold the Next.js app

- [ ] Scaffold (run from repo root — creates `meridian-docgen-alihaiderbajwa/`):
  ```bash
  npx create-next-app@latest meridian-docgen-alihaiderbajwa \
    --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm --yes
  ```
  > If asked interactively: TypeScript ✓, ESLint ✓, Tailwind ✓, src/ ✓, App Router ✓, import alias `@/*` ✓, Turbopack ✓.
- [ ] Install dependencies:
  ```bash
  cd meridian-docgen-alihaiderbajwa
  npm install @supabase/supabase-js @supabase/ssr recharts
  npx shadcn@latest init -y
  npx shadcn@latest add button input label card badge select textarea table
  ```
- [ ] Verify: `npm run dev` boots at http://localhost:3000 with no errors, then stop it.

## 3. Environment variables

- [ ] Create `meridian-docgen-alihaiderbajwa/.env.local`:
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon/publishable key>
  SUPABASE_SERVICE_ROLE_KEY=<service_role key>
  ```
- [ ] Create `meridian-docgen-alihaiderbajwa/.env.example` with the same keys but **empty values** (this one gets committed).
- [ ] Add `.env.local` to `.gitignore` (create-next-app does this by default — verify).

## 4. Database schema (`supabase/sql/schema.sql`)

- [ ] Create `supabase/sql/schema.sql` at the **repo root** (sibling of the app folder) with all 8 tables:

| Table | Columns |
|---|---|
| `roles` | id uuid pk, name text unique, description text, created_at |
| `staff` | id uuid pk, user_id uuid null FK auth.users, name text, email text unique, role_id uuid FK roles, active bool default true, created_at |
| `document_templates` | id uuid pk, name text, category text, description text, body text, status text default 'active', created_at |
| `template_fields` | id uuid pk, template_id uuid FK cascade, label text, field_type text, options text[], required bool default false, sort_order int default 0 |
| `clients` | id uuid pk, name text, email text, phone text, address text, notes text, created_at |
| `generated_documents` | id uuid pk, template_id uuid FK, client_id uuid FK, created_by uuid null FK staff, field_values jsonb, content text, status text default 'draft', created_at, finalized_at timestamptz null |
| `review_comments` | id uuid pk, generated_document_id uuid FK cascade, staff_id uuid FK, comment text, resolved bool default false, created_at |
| `firm_settings` | id int pk check (id = 1), firm_name text, tagline text, address text, phone text, email text, logo_url text, updated_at |

Key details: every table gets `created_at timestamptz default now()`; add `status` CHECK constraints (templates: `in ('active','archived')`; documents: `in ('draft','under_review','changes_requested','approved','finalized')`); FKs `on delete cascade` for template_fields/review_comments, `set null` for staff links; indexes on `generated_documents(status)`, `generated_documents(created_at)`, `clients(name)`.
- [ ] Verify file parses (paste into SQL Editor → Run — must show no errors).

**Applying the SQL to the project** (verified working, Aug 2026): direct DB hosts can be IPv6-only, so use the **pooler** connection string (Project Settings → Database, `aws-0-<region>.pooler.supabase.com:6543`) and the repo's runner:
```bash
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres" \
  node scripts/run-sql.mjs
```
`run-sql.mjs` resolves IPv4 automatically and runs `schema.sql → seed.sql → policies.sql` in order (idempotent, safe to rerun). If the region is unknown, `scripts/probe-pooler.mjs` finds it (run with `SUPABASE_REF` + `SUPABASE_DB_PASSWORD`).

## 5. Seed data (`supabase/sql/seed.sql`)

- [ ] Insert 3 roles: `admin`, `attorney`, `paralegal`.
- [ ] Insert 5 staff: 1 admin (admin@meridian.demo), 2 attorneys (attorney@meridian.demo, k.adeel@meridian.demo), 2 paralegals (paralegal@meridian.demo, s.rizvi@meridian.demo) — `user_id` NULL (linked in step 7).
- [ ] Insert 3 templates with placeholder-token bodies:
  - **Simple Will** (category: Estate Planning) — body uses `{{client_name}}`, `{{date_of_birth}}`, `{{spouse_name}}`, `{{executor_name}}`, `{{assets_summary}}`.
  - **NDA** (category: Corporate) — `{{disclosing_party}}`, `{{receiving_party}}`, `{{effective_date}}`, `{{purpose}}`, `{{duration_years}}`.
  - **Commercial Lease** (category: Real Estate) — `{{landlord}}`, `{{tenant}}`, `{{property_address}}`, `{{monthly_rent}}`, `{{lease_term_years}}`, `{{start_date}}`.
- [ ] Insert `template_fields` for each template matching the tokens (label = human title, field_type: text/textarea/date/select/number, options for selects, required flags, sort_order).
- [ ] Insert 3 clients: e.g. Sarah Mitchell (sarah.mitchell@example.com), James Carter, Ayesha Khan — with phone/address/notes.
- [ ] Insert 1 row into `firm_settings` (firm_name = 'Meridian Legal Group', tagline, address, phone, email).
- [ ] **Verify** (SQL Editor): `select count(*) from document_templates;` → 3; `select count(*) from template_fields;` → ≥15; `select count(*) from clients;` → 3; `select count(*) from staff;` → 5; `select count(*) from roles;` → 3.

## 6. Baseline RLS (`supabase/sql/policies.sql`)

- [ ] `alter table ... enable row level security` for all 8 tables.
- [ ] Policies: authenticated users can read all rows of all tables; **only admins/attorneys can write** templates/fields; only admins can write staff/roles/firm_settings; staff can create clients/documents/comments. Use a helper:
  ```sql
  create or replace function public.current_role() returns text
  language sql stable security definer as
    $$ select r.name from public.staff s join public.roles r on r.id = s.role_id where s.user_id = auth.uid(); $$;
  ```
  Full role matrix (attorney-only approve etc.) is completed in **Phase 4** — do not build the entire matrix now.
- [ ] Verify: run file in SQL Editor with no errors; as anon (signed out) queries return nothing.

## 7. Demo auth users (`scripts/create-demo-users.mjs`)

> **Do NOT insert into `auth.users` via raw SQL** — it breaks GoTrue's schema handling ("Database error querying schema", 500 on login). Use the Auth Admin API:

- [ ] Write `scripts/create-demo-users.mjs` at repo root: reads `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (env or app `.env.local`) and uses `supabase.auth.admin.createUser({ email, password, email_confirm: true })` for:
  - admin@meridian.demo / admin123
  - attorney@meridian.demo / attorney123
  - paralegal@meridian.demo / paralegal123
  - then `update public.staff set user_id = <id> where email = <email>` per user (idempotent: deletes an existing user with the same email first).
- [ ] Run: `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/create-demo-users.mjs`
- [ ] Verify: `select name, email, user_id from staff where user_id is not null;` shows 3 linked rows; a password login returns 200 (not a 500).

## 8. App shell (sidebar + nav + stubs)

- [ ] `src/lib/supabase.ts` — browser client from `NEXT_PUBLIC_*` vars.
- [ ] `src/lib/supabase-server.ts` — SSR client (cookies) for server components.
- [ ] `src/app/login/page.tsx` — email/password form calling `signInWithPassword`, redirect to `/dashboard`; link to create account (enabled in Supabase Auth settings).
- [ ] `src/app/layout.tsx` — sidebar (fixed left, 260px) with links to: Dashboard, Templates, Clients, Wizard, Review Queue, Staff, Reports, Settings; top bar with current user email + Sign out; shadcn/ui styles.
- [ ] Page stubs `src/app/(dashboard)/dashboard|templates|clients|wizard|review|staff|reports|settings/page.tsx` — each a heading + one-line description + placeholder card reading one live count from the DB (proves connectivity).
- [ ] Root redirect `/` → `/login` (or `/dashboard` when authenticated).
- [ ] Verify: `npm run dev`, log in as admin, all 8 links navigate, each stub renders a live DB value, sign-out works.

## 9. Commit, push, PR

- [ ] Commit plan docs: `git add PLAN.md README.md docs/phases/ && git commit -m "docs: add master plan and phase instructions"` (do before scaffolding so docs exist in history).
- [ ] Commit scaffold + SQL + scripts with clear messages: `feat: scaffold nextjs app`, `feat: add supabase schema and seed`, `feat: add baseline rls policies`, `feat: add demo user script`, `feat: add app shell with sidebar and login`.
- [ ] `git push -u origin alihaiderbajwa-docgen`
- [ ] Click-test the app once more (run through Section 8 verification).
- [ ] Open PR to main (GitHub UI or `gh pr create`), self-review, merge.

## 10. Handoff to Phase 2 (Arshia)

- [ ] On main: `git checkout main && git pull` — confirm the merged Phase 1 code is there.
- [ ] Message to Arshia: create `arshia-docgen` from updated main, open `docs/phases/phase-2-templates-dashboard.md`, follow it task-by-task, PR to main when done.
