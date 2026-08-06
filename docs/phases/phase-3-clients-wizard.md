# Phase 3 — Clients & Wizard

> **Owner:** Ali Haider Bajwa
> **Branch:** `alihaiderbajwa-docgen`
> **Case-study tasks:** T3.1 (client CRUD + history + search), T3.2 (dynamic wizard + document generation)
> **Depends on:** Phase 2 merged to main (template CRUD + field builder exist)
> **Est. effort:** ~1.5 days
> **DoD:** clients can be created/updated/viewed with accurate document history; the wizard renders any template's fields, validates required answers, and produces a correctly merged draft saved against a client with status `draft`.

**For agentic workers:** execute task-by-task with superpowers:executing-plans. Checkboxes for tracking.

## 0. Setup (do once)

```bash
git checkout main && git pull
git checkout -b alihaiderbajwa-docgen
cd meridian-docgen-alihaiderbajwa && npm install && npm run dev
```

Handoff check (from Phase 2, must all be true):
- [ ] Templates list/create/edit/delete works with field builder
- [ ] Dashboard cards/charts/feed read live data
- [ ] Template field builder lives in `templates/new` and `templates/[id]` pages

## 1. Client list + search

**Files:**
- Create: `src/components/clients/client-list.tsx` (`"use client"`)
- Modify: `src/app/(dashboard)/clients/page.tsx` (replace stub)

- [ ] On mount: `supabase.from('clients').select('id, name, email, phone, created_at, generated_documents(count)').order('created_at', { ascending: false })`
- [ ] Search input filters via `.ilike('name', %term%)` OR `.ilike('email', %term%)` (query the DB, never filter the loaded list).
- [ ] Table: Name, Email, Phone, Documents (count), Created; row click → `/clients/[id]`; "New Client" button → `/clients/new`.
- [ ] Verify: 3 seeded clients show with 0 documents; searching "sarah" narrows to Sarah Mitchell.

## 2. Client create + edit

**Files:**
- Create: `src/app/(dashboard)/clients/new/page.tsx`
- Create: `src/app/(dashboard)/clients/[id]/edit/page.tsx`

- [ ] Shared client form (name, email, phone, address, notes) — extract into `src/components/clients/client-form.tsx` and reuse in both.
- [ ] Create: insert → `router.push('/clients/[id]', { params })`.
- [ ] Edit: load client by id, pre-fill, `update().eq('id', id)`.
- [ ] Verify: create "Test Client", edit name, list reflects it.

## 3. Client detail + document history

**Files:**
- Create: `src/app/(dashboard)/clients/[id]/page.tsx`

- [ ] Load client: `select('*').eq('id', id).single()`.
- [ ] Load history: `supabase.from('generated_documents').select('id, status, created_at, content, template_id(name)').eq('client_id', id).order('created_at', { ascending: false })`
- [ ] Render: profile card (name/contact/address/notes + Edit button) + documents table (Template, Status badge, Created, View → `/documents/[docId]` — stub page for now, Phase 4 fills review).
- [ ] Empty state: "No documents yet — generate one via the Wizard."
- [ ] Verify: history is empty for seeds; after Section 6 creates documents, they appear here with correct status.

## 4. Wizard — step list page

**Files:**
- Create: `src/app/(dashboard)/wizard/page.tsx` (client component)
- Create: `src/lib/merge.ts` (pure function, unit-testable — see step 6)

- [ ] Query active templates: `select('*').eq('status', 'active').order('name')` → render as selectable cards (name, category, description, field count).
- [ ] Client picker: select box of clients (`select('id, name')`) + "New client" quick-link to `/clients/new`.
- [ ] "Start" button (disabled until template + client chosen) → `router.push('/wizard/[templateId]?client=<id>')`.
- [ ] Verify: all 3 seeded templates listed with their field counts.

## 5. Wizard — dynamic multi-step form

**Files:**
- Create: `src/app/(dashboard)/wizard/[templateId]/page.tsx` (`"use client"`)

- [ ] Load `template_fields` for the template: `select('*').eq('template_id', id).order('sort_order')`; load template body.
- [ ] **Steps:** split fields into steps of 3 (sorted by sort_order); show Step X of Y header, Back / Next buttons.
- [ ] Validate on Next: required fields must be non-empty (type-specific: date parses, number parses, select must match an option). Show inline error text, block advancing.
- [ ] Keep answers in `useState` (`Record<fieldId, string>`), persist across steps; on last step show a review summary (all Q/A pairs) before Submit.
- [ ] Submit → `router.push` to generation endpoint handled in step 6.
- [ ] Verify: NDA template (4 fields) = 2 steps; trying to skip a required field blocks with a message.

## 6. Generation & merge engine

**Files:**
- Create: `src/lib/merge.ts`
- Create: `src/app/(dashboard)/wizard/[templateId]/complete/page.tsx` (or a server action in the wizard page — your choice, keep consistent)

- [ ] `merge.ts` exports `mergeTemplate(body: string, values: Record<string, string>): string` that replaces every `{{token}}` in the body with `values[token]` (fallback: `[Not provided]` for missing tokens). Pure function, no I/O.
- [ ] Generation flow on submit:
  1. Build `field_values` as `Record<fieldLabel, answer>` (label → answer, human-readable).
  2. Build answers map for merge: `Record<token, answer>` where token = label lowercased/slugged — **important**: schema convention from Phase 1 is tokens like `{{client_name}}`, `{{disclosing_party}}` = field labels slugified (lowercase, spaces→underscores). Slugify labels before merge; if a label has no token in body, still store the answer in `field_values`.
  3. `supabase.from('generated_documents').insert({ template_id, client_id, created_by: <current staff id>, field_values, content: mergeTemplate(body, answers), status: 'draft' }).select().single()`
  4. `router.push('/documents/[id]')` — create stub page showing the merged content.
- [ ] **Verify merge correctness** (critical): generate a Simple Will for a seeded client; open the document — every answer appears in the right `{{token}}` slot; tokens without answers show `[Not provided]`.
- [ ] Unit-test the merge function (choose the simplest available runner — if none exists, add `vitest`):
  - `mergeTemplate('Hi {{name}}', { name: 'Ali' })` → `'Hi Ali'`
  - missing token → `[Not provided]`; unknown `{{token}}` left untouched; null body → ''.

## 7. Manual test script (must all pass)

1. Log in as paralegal → Clients shows 3 seeded clients.
2. Create client → appears; edit → saved; detail shows empty history.
3. Wizard: pick NDA + Sarah Mitchell → 2 steps; skip required field → blocked; fill all → summary shows answers.
4. Submit → redirected to document page; content contains `{{disclosing_party}}` replaced with the answer; all other tokens replaced or `[Not provided]`.
5. Client detail for Sarah now shows 1 document with status **draft**.
6. Dashboard "Docs this month" + activity feed now show the new document (live proof).
7. Run the merge unit tests: green.

## 8. Commit & merge

```bash
git add -A && git commit -m "feat: client management with search and history"
git commit -m "feat: dynamic wizard and template merge generation"
git push -u origin alihaiderbajwa-docgen
```

- [ ] Click-test Section 7 once more.
- [ ] Open PR `alihaiderbajwa-docgen → main`, ask Arshia to review, fix feedback, merge.

## 9. Handoff to Phase 4 (Arshia)

- [ ] Message Arshia: Phase 3 merged. Next: `docs/phases/phase-4-review-staff.md` — branch `arshia-docgen` from updated main.
- [ ] Note: documents now exist with status `draft` — the review queue will read exactly those rows.
