# Phase 4 — Review Workflow & Staff/Roles/RLS

> **Owner:** Arshia
> **Branch:** `arshia-docgen`
> **Case-study tasks:** T4.1 (draft review workflow), T4.2 (staff, roles & permissions with RLS)
> **Depends on:** Phase 3 merged to main (documents exist with status `draft`)
> **Est. effort:** ~1.5 days
> **DoD:** drafts can be commented on and moved through the full status flow; users have roles; RLS (policies.sql) enforces them — a paralegal cannot approve a draft while an attorney can.

**For agentic workers:** execute task-by-task with superpowers:executing-plans. Checkboxes for tracking.

## 0. Setup (do once)

```bash
git checkout main && git pull
git checkout -b arshia-docgen
cd meridian-docgen-alihaiderbajwa && npm install && npm run dev
```

Handoff check (from Phase 3, must all be true):
- [ ] Wizard generates drafts with status `draft` against real clients
- [ ] `src/app/(dashboard)/documents/[docId]/page.tsx` exists as a stub showing merged content
- [ ] Staff rows are linked to auth users (admin/attorney/paralegal)

## 1. Review queue

**Files:**
- Create: `src/components/review/queue-list.tsx` (`"use client"`)
- Modify: `src/app/(dashboard)/review/page.tsx` (replace stub)

- [ ] Query: `supabase.from('generated_documents').select('id, status, created_at, template_id(name), client_id(name), created_by(name)').in('status', ['draft','under_review','changes_requested']).order('created_at', { ascending: false })`
- [ ] Render table: Template, Client, Status badge (color per status: draft=gray, under_review=blue, changes_requested=amber), Created, Open → `/documents/[id]`.
- [ ] Filter chips: All / Draft / Under review / Changes requested (`.eq('status', ...)`).
- [ ] Verify: documents from Phase 3 appear; chips filter correctly.

## 2. Document detail + review actions

**Files:**
- Modify: `src/app/(dashboard)/documents/[docId]/page.tsx` (fill the stub)

- [ ] Load document with joins: `select('*, template_id(*), client_id(*), created_by(name), review_comments(*, staff_id(name))').eq('id', id).single()`
- [ ] Render: status badge, template/client metadata, `field_values` as a read-only Q/A list, the merged `content` in a scrollable "draft" panel (monospace-ish, bordered).
- [ ] Actions (visible per role — enforced client-side **and** by RLS in step 5):
  - **Start review** (attorney): sets status `draft → under_review`
  - **Approve** (attorney): `under_review → approved`
  - **Finalize** (attorney): `approved → finalized` + `finalized_at = now()`
  - **Request changes** (attorney): `under_review → changes_requested` (must have ≥1 comment)
  - **Resubmit** (author/any staff): `changes_requested → draft`
- [ ] Comment box (all staff): insert into `review_comments` (`generated_document_id, staff_id, comment`); mark comments `resolved` (checkbox) by the attorney who resolved them.
- [ ] Verify: full cycle works as admin — start review → comment → request changes → resubmit → start review → approve → finalize. Status badge and client-facing status update at each step.

## 3. Staff management UI

**Files:**
- Create: `src/components/staff/staff-list.tsx` (`"use client"`)
- Modify: `src/app/(dashboard)/staff/page.tsx` (replace stub)

- [ ] Table of staff: `select('*, role_id(name)')` → Name, Email, Role, Active, Created.
- [ ] Create staff: form (name, email, role select from `roles`, active) — inserts into `staff`; if the email has an auth user, sets `user_id` (lookup via a `select user_id from auth.users` — note: this may require an RPC; if unavailable, leave `user_id` null and document in README that the user links via `scripts/create-demo-users.mjs` or manual SQL).
- [ ] Edit: change role / toggle active (`update().eq('id', id)`).
- [ ] Roles page (or tab): read-only list of `roles` with descriptions, plus a note that new roles must be added in SQL (keeps RLS predictable).
- [ ] Verify: create a second attorney, change a paralegal's role, toggle active — all persist.

## 4. RLS policy matrix (`supabase/sql/policies.sql`)

**Files:**
- Modify: `supabase/sql/policies.sql` — this file must remain **drop-and-rerun safe** (idempotent): start with `drop policy if exists ... on ...;` for every policy you define.

**Helper (already exists from Phase 1):** `public.current_role()` returns the caller's role name from `staff` joined to `roles` via `auth.uid()`. Role names: `admin`, `attorney`, `paralegal`.

- [ ] **document_templates / template_fields**: `select` for authenticated; `insert/update/delete` only for `admin` or `attorney`.
- [ ] **clients**: `select/insert/update` for all authenticated staff; `delete` admin only.
- [ ] **generated_documents**: `select` all authenticated; `insert` all authenticated; `update` — admin/attorney any status change, paralegal only `draft → under_review`/`changes_requested → draft` (i.e. **paralegal can never set `approved` or `finalized`**; enforce with a `with check` clause: `not (status in ('approved','finalized'))`); `delete` admin only.
- [ ] **review_comments**: `select/insert` all authenticated; `update` (resolved flag) attorney/admin only; `delete` admin only.
- [ ] **staff / roles / firm_settings**: `select` all authenticated; write ops admin only.
- [ ] Commit the final matrix to `supabase/sql/policies.sql` — this is the **required Phase 4 deliverable** per the case study.

## 5. Verify RLS end-to-end (critical test)

**Files:**
- Create: `src/lib/permissions.ts` — `canApprove(role)`, `canManageTemplates(role)`, `canManageStaff(role)` helpers mapping the matrix above (used to hide UI buttons; RLS is the real gate).

- [ ] Test with the **paralegal** account (paralegal@meridian.demo / password123):
  - [ ] Review queue loads (select allowed)
  - [ ] Comment box visible; can comment
  - [ ] Approve/Finalize buttons hidden; if forced via SQL/console, the `update` fails with RLS error 42501
- [ ] Test with **attorney** account (attorney@meridian.demo / password123):
  - [ ] Approve + Finalize buttons visible; approval succeeds
- [ ] Test with **admin**: everything works; staff page shows all rows; can create staff.
- [ ] SQL sanity check (SQL Editor, signed out / anon): `select * from clients;` returns 0 rows (RLS blocks unauthenticated).

## 6. Manual test script (must all pass)

1. Paralegal logs in → generates a new draft via Wizard → status `draft`.
2. Attorney logs in → opens Review Queue → sees it → Start review → status `under_review`.
3. Attorney adds comment → Request changes (needs ≥1 comment — enforced) → status `changes_requested`.
4. Paralegal resubmits → status `draft`.
5. Attorney approves → `approved` → Finalize → `finalized`, `finalized_at` set.
6. Paralegal attempts to update a document status to `approved` from the SQL editor with their session token → RLS rejects (or via UI if you add a debug button — SQL test is sufficient proof).
7. Staff page: create/edit staff, role change persists.
8. `policies.sql` rerun from scratch (drop + recreate) on a fresh copy of the DB → same behavior.

## 7. Commit & merge

```bash
git add -A && git commit -m "feat: review workflow with comments and status flow"
git commit -m "feat: staff management and rls permission matrix"
git push -u origin arshia-docgen
```

- [ ] Click-test Section 6 once more (both role accounts).
- [ ] Open PR `arshia-docgen → main`, ask Ali to review, fix feedback, merge.

## 8. Handoff to Phase 5 (Ali)

- [ ] Message Ali: Phase 4 merged. Next: `docs/phases/phase-5-reports-settings-demo.md` — branch `alihaiderbajwa-docgen` from updated main.
- [ ] Note: finalized documents now exist in the data — reports in Phase 5 aggregate exactly these.
