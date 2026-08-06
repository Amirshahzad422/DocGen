# Phase 5 — Reports, Settings & Final Delivery

> **Owner:** Ali Haider Bajwa
> **Branch:** `alihaiderbajwa-docgen`
> **Case-study tasks:** T5.1 (reports, settings, full SQL rebuild verification, demo)
> **Depends on:** Phase 4 merged to main (review flow + RLS + finalized documents exist)
> **Est. effort:** ~1 day
> **DoD:** reports aggregate live data; settings work; DB rebuilds from committed SQL; demo recorded; final merge; delivery handoff written.

**For agentic workers:** execute task-by-task with superpowers:executing-plans. Checkboxes for tracking.

## 0. Setup (do once)

```bash
git checkout main && git pull
git checkout -b alihaiderbajwa-docgen
cd meridian-docgen-alihaiderbajwa && npm install && npm run dev
```

Handoff check (from Phase 4, must all be true):
- [ ] Review workflow complete with comments + full status flow
- [ ] RLS matrix in `supabase/sql/policies.sql`, verified with paralegal/attorney accounts
- [ ] At least 3–4 documents in various statuses across templates/clients (generate if needed)

## 1. Reports page

**Files:**
- Create: `src/components/reports/report-cards.tsx`
- Modify: `src/app/(dashboard)/reports/page.tsx` (replace stub)

Aggregate **live** from the database (fetch rows, aggregate in JS — simple and readable):

- [ ] **Documents generated per month**: all `generated_documents.created_at` → group by `YYYY-MM` → Recharts `LineChart` (or `BarChart`), last 6 months.
- [ ] **Most-used templates**: group by `template_id(name)` → top 5 horizontal `BarChart`.
- [ ] **Average time in review**: for finalized docs: `avg(finalized_at - created_at)` → display as "Xh Ym" (fallback: "No finalized documents yet").
- [ ] **Outstanding review queue**: count where status in `('draft','under_review','changes_requested')` → big-number card + mini table of the 5 oldest.
- [ ] **Status distribution**: donut `PieChart` of draft / under_review / changes_requested / approved / finalized counts.
- [ ] Add "Refresh" button (re-queries on click) — like the dashboard focus-refresh.
- [ ] Verify: numbers match `select ... group by ...` in the SQL editor; inserting a doc changes the charts on refresh.

## 2. Settings page

**Files:**
- Create: `src/components/settings/firm-settings-form.tsx`
- Modify: `src/app/(dashboard)/settings/page.tsx` (replace stub)

- [ ] **Firm info tab**: load `firm_settings` row 1 → editable form (firm_name, tagline, address, phone, email, logo_url) → `update().eq('id', 1)`. Show "Meridian Legal Group" seed values.
- [ ] **Roles tab**: read-only `roles` list with descriptions + note ("new roles added via SQL — keeps RLS predictable").
- [ ] **Profile tab**: current staff row (`select * from staff where user_id = auth.uid()` single) → editable name/contact → update; show email (read-only, from auth).
- [ ] Verify: change firm name → persists; reload → new name; profile update persists.

## 3. Full rebuild-from-SQL verification (case-study §6 + §7)

- [ ] Open the **SQL Editor** in a fresh state (or a second throwaway Supabase project) and run in order: `schema.sql` → `seed.sql` → `policies.sql`.
- [ ] Run the verification SELECTs from Phase 1 §5 — all counts match (3/15+/3/5/3).
- [ ] Create demo auth users + link staff (README steps) → log in → app works identically.
- [ ] Record the result in README ("Verified: full rebuild works from committed SQL on <date>") or note any missing steps found and fix the files.
- [ ] `git add supabase/ README.md` and commit any fixes with `fix: ...`.

## 4. Polish pass (30 min — only what's needed for the demo)

- [ ] Empty states everywhere (no crash on empty tables).
- [ ] Consistent status badges (shared component if not already — extract into `src/components/ui/status-badge.tsx` if duplicated).
- [ ] Login page shows demo credentials hint (admin / attorney / paralegal) — makes the demo smooth.
- [ ] Quick sanity: `/` redirect works signed-in and signed-out.

## 5. Demo recording (4–5 minutes)

Script — record with your screen recorder (OBS / VSCode recorder / phone):
1. **00:00–00:20** — Login as admin; dashboard with live metrics.
2. **00:20–00:45** — Templates: show library, open NDA, show its fields + placeholder body.
3. **00:45–01:30** — Wizard: pick NDA + client, fill all fields, submit → draft opens with merged content.
4. **01:30–02:15** — Switch to attorney account: review queue → start review → comment → request changes.
5. **02:15–02:45** — Back as admin/paralegal: resubmit → attorney approves → finalize.
6. **02:45–03:15** — Client detail: document history shows the finalized doc with correct status.
7. **03:15–04:00** — Reports: charts updated with real data; Settings: edit firm name.
8. **04:00–04:30** — Close: show `supabase/sql/` in repo + README rebuild steps (the whole DB is reproducible).

- [ ] Upload to your drive/VERXEON-shared folder; add the link to the PR description and README (optional).

## 6. Final merge & delivery

```bash
git add -A && git commit -m "feat: reports and settings pages"
git commit -m "docs: demo recording and rebuild verification"
git push -u origin alihaiderbajwa-docgen
```

- [ ] Click through all 12 checklist items from PLAN.md §8 — every one must be demo-able.
- [ ] Open PR `alihaiderbajwa-docgen → main`; after merge, `git checkout main && git pull` and tag the delivery: `git tag v1.0.0 && git push --tags`.
- [ ] Post-delivery message to the lead: repo URL, branch history, demo link, rebuild steps, and confirmation that everything lives in the repo (VERXEON-owned, no ongoing involvement needed).

## 7. The story ends here

All code + SQL + docs live in the VERXEON repo. The database is rebuildable from `/supabase/sql/` by anyone. No personal accounts, no secrets, no ongoing maintenance — just run the README steps. Delivery complete.
