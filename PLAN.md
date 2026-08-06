# Meridian DocGen — Team Implementation Plan

**Project:** Legal Document Generator for Meridian Legal Group
**Internship:** VERXEON Technologies — Week 1 case study (Project 3)
**Team:** Ali Haider Bajwa (Phases 1, 3, 5) + Warisha (Phases 2, 4)
**Repo:** https://github.com/verxeon-ai/DocGen.git
**Status:** In progress — Phase 1 (Foundation) active

---

## 1. Goal

Build a full-stack, Supabase-powered legal document generator: a template library with dynamic fields, a multi-step wizard that merges client answers into a draft, a lawyer review workflow, staff roles with row-level security, live dashboards, and reports — every screen wired to a real database, with all SQL committed to the repo so the entire backend is rebuildable by anyone who clones it.

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript | Matches case study ("e.g. Next.js"), modern, zero maintenance surprises |
| Styling | Tailwind CSS v4 + shadcn/ui | Fast, polished UI without writing 100 components from scratch |
| Charts | Recharts | Dashboard + reports graphs |
| Backend | Supabase (Postgres + Auth + RLS) | Single source of truth, free tier, SQL-versioned |
| Data access | `@supabase/supabase-js` v2 + `@supabase/ssr` | Official SDKs, direct client→DB with RLS, no custom API server |
| Package manager | npm | Zero extra setup on any machine |
| Hosting | Local `npm run dev` (Vercel deploy optional) | Demo runs anywhere; nothing billing-bound |

**Future-proofing rules (VERXEON ownership context):**
- No paid services, no accounts baked into code, no secrets committed (`.env` gitignored, `.env.example` committed).
- Entire database rebuildable from `/supabase/sql/` (schema.sql → seed.sql → policies.sql).
- README documents full setup so anyone at VERXEON can take over with zero questions.
- Project is the property of VERXEON; nothing in the code requires our future involvement.

## 3. Architecture

```
Interface (Next.js App Router)
  ├── Dashboard     → live metrics, activity, charts
  ├── Templates     → CRUD + dynamic field builder + body with {{placeholders}}
  ├── Clients       → CRUD + document history + search
  ├── Wizard        → steps rendered from template_fields, validates, saves answers
  ├── Review Queue  → comments, approve / request changes, status flow
  ├── Staff         → users, roles, permissions
  ├── Reports       → aggregates from live data
  └── Settings      → firm info, roles, profile
        │  supabase-js (anon key, RLS enforced)
        ▼
Supabase
  ├── Postgres     → document_templates, template_fields, clients,
  │                  generated_documents, review_comments, staff, roles,
  │                  firm_settings (source of truth)
  ├── Auth         → email/password staff login
  └── RLS          → role-based row-level security policies (policies.sql)
```

**Document journey:** login → dashboard reads live totals → admin builds template with dynamic fields → client registered → wizard answers only that template's fields → merge step produces draft (`generated_documents.content`) → draft enters review queue → attorney comments + approves or requests changes → resubmit loop → finalized.

**Status flow:** `draft → under_review → changes_requested → draft → under_review → approved → finalized`

## 4. Database Schema (supabase/sql/schema.sql)

| Table | Key columns |
|---|---|
| `roles` | name (unique), description |
| `staff` | user_id (FK → auth.users, nullable), name, email, role_id (FK → roles), active |
| `document_templates` | name, category, description, body (placeholder tokens), status (active/archived) |
| `template_fields` | template_id (FK), label, field_type (text/textarea/date/select/number), options, required, sort_order |
| `clients` | name, email, phone, address, notes |
| `generated_documents` | template_id (FK), client_id (FK), created_by (FK → staff), field_values (JSONB), content, status, finalized_at |
| `review_comments` | generated_document_id (FK), staff_id (FK), comment, resolved |
| `firm_settings` | single row: firm_name, tagline, address, phone, email, logo_url |

## 5. Phase Plan (strictly serial — next phase starts only after previous is merged to main)

| Phase | Title | Owner | Branch | Case-study tasks | Effort |
|---|---|---|---|---|---|
| **1** | Foundation: repo, scaffold, schema, seed | Ali | `alihaiderbajwa-docgen` | T1.1, T1.2 | ~1 day |
| **2** | Templates & Dashboard | Warisha | `warisha-docgen` | T2.1, T2.2 | ~1.5 days |
| **3** | Clients & Wizard | Ali | `alihaiderbajwa-docgen` | T3.1, T3.2 | ~1.5 days |
| **4** | Review & Staff / RLS | Warisha | `warisha-docgen` | T4.1, T4.2 | ~1.5 days |
| **5** | Reports, Settings & Delivery | Ali | `alihaiderbajwa-docgen` | T5.1 | ~1 day |

**Serial rule:** no overlap. The owner of phase N+1 branches from main only after phase N's PR is merged and tested. Full per-phase instructions live in `docs/phases/phase-N-*.md`.

## 6. Git Workflow

1. Every phase works on the owner's branch: `alihaiderbajwa-docgen` / `warisha-docgen`.
2. Small, frequent commits with clear messages (`feat:`, `fix:`, `docs:`).
3. After each phase: run the app, click through the test script in the phase doc, then open a PR to main.
4. Code reaches main only after it is tested. Golden rule.
5. Updating branch with latest main: `git checkout main && git pull && git checkout <branch> && git merge main`.

## 7. Deliverables (end of week)

- Live running app + working Supabase project, every page functional.
- All work pushed to https://github.com/verxeon-ai/DocGen.git, per-phase merges.
- `/supabase/sql/` with schema.sql, seed.sql, policies.sql committed.
- 4–5 minute demo recording of the full journey (wizard → finalized document).
- This PLAN.md + `docs/phases/*.md` + README for rebuild-from-scratch.

## 8. Checklists (case study §5) — tracked per phase

| # | Feature | Phase | Status |
|---|---|---|---|
| 1 | Interface built & connected | 1 | ☐ |
| 2 | Database schema & SQL scripts | 1 | ☐ |
| 3 | Live dashboard metrics | 2 | ☐ |
| 4 | Template management | 2 | ☐ |
| 5 | Dynamic template fields | 2 | ☐ |
| 6 | Client management | 3 | ☐ |
| 7 | Wizard & generation | 3 | ☐ |
| 8 | Review workflow | 4 | ☐ |
| 9 | Draft status tracking | 4 | ☐ |
| 10 | Staff, roles & RLS | 4 | ☐ |
| 11 | Reports | 5 | ☐ |
| 12 | Settings | 5 | ☐ |
