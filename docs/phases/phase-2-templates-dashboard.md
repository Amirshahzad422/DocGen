# Phase 2 — Templates & Dashboard (Arshia)

> **Owner:** Arshia · **Branch:** `arshia-docgen` · **Base:** `main` (contains merged Phase 1)
> **Case-study tasks:** T2.1 Template management with dynamic fields · T2.2 Live dashboard metrics & charts
> **Est. effort:** 1.5 days · **Merge target:** `main` via PR (Ali reviews)

---

## ⚡ Quick brief for AI agents (read first)

If you (Arshia) are using an AI agent to implement this phase, paste this block to it:

> You are implementing **Phase 2 (Templates & Dashboard)** of a Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui + Supabase legal document generator. The repo is at the repo root; the app lives in `meridian-docgen-alihaiderbajwa/` and runs on port 3000. Read this file (`docs/phases/phase-2-templates-dashboard.md`) fully — it is the single source of truth, every task lists exact files, queries, and verification. Work in small commits after each verified task. Rules: never commit `.env.local`; only use `npm run build` + `npm run lint` to verify before committing; UI text is plain English, no emojis; follow the existing component conventions (PageHeader, Card, client components with `"use client"`). You may read any file in the repo. Do not touch files outside this phase's scope (`src/app/(dashboard)/templates/`, `src/app/(dashboard)/dashboard/`, `src/components/templates/`, `src/components/dashboard/`, `src/lib/template-types.ts`).

---

## 0. Goal & Definition of Done

**Goal:** The template library is fully manageable (add / edit / delete templates, each with its own dynamic fields that will later drive the wizard), and the dashboard shows live, database-backed metrics, an activity feed, and charts.

**Definition of Done (all must be demonstrable):**
- [ ] Templates can be **created, edited, deleted** against the real `document_templates` table
- [ ] Each template's **dynamic fields** (label, type, required, options, order) can be defined via a field builder and persist to `template_fields`
- [ ] Template list has **live search** (queries the database, not in-memory filtering)
- [ ] Dashboard cards (**total templates, docs this month, pending review**) read live counts
- [ ] Dashboard has a **recent activity feed** and **two charts** (docs over time, docs by template) built on aggregated data
- [ ] Inserting a row in the SQL editor changes the dashboard on refresh — nothing is hard-coded

## 1. Prerequisites (handoff from Phase 1 — verify before starting)

```bash
git checkout main && git pull
git checkout -b arshia-docgen
cd meridian-docgen-alihaiderbajwa
npm install
npm run dev        # http://localhost:3000
```

- [ ] App boots, login page renders, and you can reach `/login`
- [ ] `.env.local` exists with real values (if missing, copy `.env.example` and fill in from the Supabase dashboard → Project Settings → API)
- [ ] Supabase has seeded data: `select count(*) from document_templates;` → **3** · `select count(*) from template_fields;` → **17** · `select count(*) from clients;` → **3** · `select count(*) from roles;` → **3** (verify in SQL Editor, or `DATABASE_URL=... node scripts/run-sql.mjs` re-runs everything idempotently — note: it recreates tables, wiping any data)
- [ ] Demo auth users exist. If you get a 500 "Database error querying schema" on login, the auth users were not created via the Admin API — run `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/create-demo-users.mjs` (see README §"Rebuild the entire database"), or ask Ali.

**Testing accounts:** `admin@meridian.demo / admin123` (use this for ALL write tests) · `attorney@meridian.demo / attorney123` · `paralegal@meridian.demo / paralegal123`.

## 2. Codebase tour (10 minutes — do not skip)

| Path | What it is / convention |
|---|---|
| `src/app/(dashboard)/layout.tsx` | Server component; fetches the session + staff name; renders `<Sidebar>` around every page inside the `(dashboard)` route group. **You never touch this.** |
| `src/components/dashboard/sidebar.tsx` | Nav with the 8 sections. Already done. |
| `src/components/ui/page-header.tsx` | `<PageHeader title description action />` — use on every page (see any stub). |
| `src/components/dashboard/connectivity-card.tsx` | Example of a minimal Card from Phase 1 — not required, but fine to reuse the pattern. |
| `src/lib/supabase.ts` | Browser client: `import { supabase } from "@/lib/supabase"` — use in **client components** (`"use client"`). |
| `src/lib/supabase-server.ts` | `await createClient()` for **server components** (renders logged-in data without extra round-trips). |
| `src/app/(dashboard)/templates/page.tsx` | **Stub to replace.** |
| `src/app/(dashboard)/dashboard/page.tsx` | **Stub to replace.** |
| `src/components/ui/*` | Available shadcn components: `button, input, label, card, badge, select, textarea, table`. More can be added: `npx shadcn@latest add <name>`. |
| `src/lib/utils.ts` | `cn(...)` class merge helper. |

**Conventions (non-negotiable for this codebase):**
1. Interactive pages/components = **client components** with `"use client"` at the top.
2. Path alias `@/*` → `src/*`. Never relative imports.
3. All queries go through `supabase.from(...)` — the DB is the single source of truth.
4. No hard-coded numbers on the dashboard — every figure comes from a query.
5. Plain English UI copy. No emojis. Follow existing formatting style.
6. Errors: show `error.message` in a red `bg-destructive/10 text-destructive` paragraph — see the login page for the pattern.

**RLS heads-up (important):** `document_templates` and `template_fields` allow **writes only for `admin` and `attorney`** roles (policies.sql). If a write returns `42501` (RLS violation), you are not signed in as admin/attorney. Reads work for all authenticated users.

**Schema reference (`supabase/sql/schema.sql`):**
- `document_templates(id uuid pk, name text, category text default 'Other', description text, body text, status text 'active'|'archived', created_at)`
- `template_fields(id uuid pk, template_id uuid fk→document_templates cascade, label text, field_type 'text'|'textarea'|'date'|'select'|'number', options text[], required bool, sort_order int, created_at)`

---

## 3. Task A — Template list with live search

**Files:**
- Create: `src/components/templates/template-list.tsx`
- Replace: `src/app/(dashboard)/templates/page.tsx`

**Step A1 — Create the list component**

`src/components/templates/template-list.tsx`, client component:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";

type TemplateRow = {
  id: string;
  name: string;
  category: string;
  status: string;
  created_at: string;
  template_fields: { id: string }[];   // from the embedded query
};
```

- State: `templates: TemplateRow[] | null`, `search: string`, `error: string | null`, `loading: boolean`.
- `loadTemplates(term?: string)` — the single fetch function; **search goes to the database**:

```ts
let q = supabase
  .from("document_templates")
  .select("id, name, category, status, created_at, template_fields(id)")
  .order("created_at", { ascending: false });
if (term) q = q.ilike("name", `%${term}%`);
const { data, error } = await q;
```

- Render: if `loading` → "Loading…"; if `error` → red error paragraph; if `data?.length === 0` → empty state card "No templates yet — create your first template." (with a link to `/templates/new`); else the Table:
  - Columns: **Name** (semibold), **Category** (muted), **Status** (Badge: `active` → default variant, `archived` → secondary), **Fields** (count from `template_fields.length`), **Created** (`new Date(x.created_at).toLocaleDateString()`), **Actions** (Edit → `/templates/[id]`, Delete button).
- Delete: `confirm("Delete this template and its fields?")` → `supabase.from("document_templates").delete().eq("id", id)` → on success remove from local state (no reload); on error show it.
- Search input: `onChange` → `setSearch(v)` + `loadTemplates(v)` (debounce not required; a straightforward re-query per keystroke is acceptable at this scale).
- Note: the Delete button on the row calls a handler you also export for reuse — keep it in the same component; no extra files needed.

**Step A2 — Replace the templates page**

`src/app/(dashboard)/templates/page.tsx` — server component:

```tsx
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TemplateList } from "@/components/templates/template-list";
```

- Render `<PageHeader title="Template Library" description="Create, edit, and organize document templates." action={<Link href="/templates/new"><Button>New Template</Button></Link>} />` then `<TemplateList />`.
- Delete the old connectivity-card usage from this page.

**Step A3 — Verify**
1. `npm run dev` → `/templates` shows the 3 seeded templates (Simple Will / NDA / Commercial Lease) with field counts 5 / 6 / 6.
2. Type "nda" in search → only NDA; clear → all three.
3. Click **Delete** on a template → confirm → it disappears; in SQL Editor `select count(*) from template_fields where template_id = '<id>';` → 0 (cascade worked).
4. `npm run build` and `npm run lint` pass.
5. Commit: `git add -A && git commit -m "feat: template list with live search and delete"`

---

## 4. Task B — Create template with field builder

**Files:**
- Create: `src/lib/template-types.ts`
- Create: `src/components/templates/field-builder.tsx`
- Create: `src/app/(dashboard)/templates/new/page.tsx`

**Step B1 — Shared types** (`src/lib/template-types.ts`)

```ts
export const FIELD_TYPES = ["text", "textarea", "date", "select", "number"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export type TemplateFieldDraft = {
  id: string;              // client-side key (crypto.randomUUID())
  label: string;
  field_type: FieldType;
  options: string[];       // used when field_type === "select"
  required: boolean;
};

export type TemplateFormState = {
  name: string;
  category: string;
  description: string;
  body: string;
  fields: TemplateFieldDraft[];
};
```

**Step B2 — Field builder component** (`src/components/templates/field-builder.tsx`, `"use client"`)

- Props: `{ fields: TemplateFieldDraft[]; onChange: (fields: TemplateFieldDraft[]) => void }`.
- Renders the list of field rows, each row (use `Card` or a bordered `div` with `space-y-2`):
  - **Label** (`Input`, placeholder "e.g. Client Name") — bound to `field.label`.
  - **Type** (`Select` from `FIELD_TYPES`, see usage below).
  - **Options** (`Input`, comma-separated, `placeholder="Option 1, Option 2, Option 3"`) — rendered **only when `field_type === "select"`**.
  - **Required** (`input type="checkbox"` or shadcn Checkbox if added) with label "Required".
  - **Remove** (ghost Button, "Remove") — filters the field out.
  - **Move up / Move down** — two small ghost buttons ("↑" / "↓") that swap the field in the array (sets `sort_order` later).
- Footer: `<Button type="button" variant="outline" onClick={addField}>+ Add field</Button>` — appends `{ id: crypto.randomUUID(), label: "", field_type: "text", options: [], required: false }`.
- Select usage (shadcn v4): `Select value={f.field_type} onValueChange={(v) => update(i, { field_type: v as FieldType })}` with `SelectTrigger`/`SelectContent`/`SelectItem` for each of `FIELD_TYPES`. If the shadcn Select feels heavy, a native `<select>` styled with `input` classes is acceptable — consistency matters, not the widget.

**Step B3 — New-template page** (`src/app/(dashboard)/templates/new/page.tsx`, `"use client"`)

- State: `form: TemplateFormState` (init `{ name: "", category: "Other", description: "", body: "", fields: [] }`), `error: string | null`, `saving: boolean`.
- **Category** as a Select: Estate Planning / Corporate / Real Estate / Other.
- **Body** as a `Textarea` (rows 14) with helper text: `Placeholder tokens: write {{field_label_slug}} exactly as the label below, slugified (lowercase, spaces → underscores). Example: label "Client Name" → token {{client_name}}.`
- Render `<FieldBuilder fields={form.fields} onChange={(fields) => setForm({ ...form, fields })} />`.
- **Submit handler** (`handleSubmit`, `async`):
  1. Validate client-side: `form.name.trim()` non-empty, `form.body.trim()` non-empty, every field must have a non-empty label; a `select` field must have ≥ 1 option. Collect messages into one `error` string, e.g. `"Field 2: label is required"`, and abort if any.
  2. Insert template:
     ```ts
     const { data: tpl, error: tplErr } = await supabase
       .from("document_templates")
       .insert({ name: form.name.trim(), category: form.category, description: form.description, body: form.body, status: "active" })
       .select("id")
       .single();
     ```
  3. If `tplErr` → setError + return. If `tplErr?.code === "42501"` → append " (you may be signed in as a non-admin — use admin@meridian.demo)".
  4. Insert fields **in one call** (order preserved by `sort_order: i`):
     ```ts
     const rows = form.fields.map((f, i) => ({
       template_id: tpl.id,
       label: f.label.trim(),
       field_type: f.field_type,
       options: f.field_type === "select" ? f.options.map((o) => o.trim()).filter(Boolean) : [],
       required: f.required,
       sort_order: i,
     }));
     const { error: fldErr } = await supabase.from("template_fields").insert(rows);
     ```
  5. On success: `router.push("/templates")` + `router.refresh()` (import `useRouter` from `next/navigation`).
  6. Wrap in try/catch, `saving` disables the submit button ("Creating…").

**Step B4 — Verify**
1. Create a template "Rental Agreement", category Real Estate, with fields: Landlord (text, required), Tenant (text, required), Property Address (textarea, required), Monthly Rent (number, required), Lease Type (select, options: Office, Retail, Warehouse), Start Date (date, required). Body contains `{{landlord}}`, `{{tenant}}`, `{{property_address}}`, `{{monthly_rent}}`, `{{lease_type}}`, `{{start_date}}`.
2. List shows it with "6 fields".
3. SQL: `select label, field_type, sort_order from template_fields where template_id = '<new id>' order by sort_order;` → 6 rows, correct order and types.
4. Attempt the same signed in as paralegal → submit fails with a clear error (RLS proof).
5. Commit: `git commit -m "feat: template creation with dynamic field builder"`

---

## 5. Task C — Edit & delete template

**Files:**
- Create: `src/app/(dashboard)/templates/[id]/page.tsx`
- Create: `src/components/templates/template-form.tsx` (extract the form from Task B so create and edit share it — **do this extraction now**)

**Step C1 — Extract the shared form**

- Move the entire form (state, FieldBuilder wiring, category select, body textarea, submit) from `new/page.tsx` into `template-form.tsx` with props:
  ```ts
  type Props = {
    mode: "create" | "edit";
    initial?: TemplateFormState | null;      // null = empty (create)
    templateId?: string;
  };
  ```
- `new/page.tsx` becomes a thin wrapper: `<TemplateForm mode="create" />` (server component can render it directly).
- Keep the `"use client"` directive only on `template-form.tsx`.

**Step C2 — Edit page** (`src/app/(dashboard)/templates/[id]/page.tsx`)

- `"use client"`, `useParams()` from `next/navigation` to get `id`.
- On mount load:
  ```ts
  const { data } = await supabase
    .from("document_templates")
    .select("id, name, category, description, body, status, template_fields(id, label, field_type, options, required, sort_order)")
    .eq("id", id)
    .single();
  ```
- Map `data.template_fields` (already ordered by `sort_order` in the DB) into `TemplateFieldDraft[]` and pass as `initial`.
- If not found → render "Template not found" card with a back link.

**Step C3 — Edit submit logic (in the shared form)**

- If `mode === "edit"`:
  1. `supabase.from("document_templates").update({ name, category, description, body }).eq("id", templateId)`
  2. Fields diffing (the straightforward version — correctness over cleverness):
     ```ts
     const existing = initialFields;                      // { id, ... }[]
     const submitted = form.fields;                       // draft rows, some with real ids
     const submittedIds = submitted.map((f) => f.id).filter((x) => x !== "__new__");
     // delete removed: existing.filter((e) => !submittedIds.includes(e.id)) → supabase.from("template_fields").delete().in("id", removedIds)
     // update changed: existing fields whose id is still present → compare label/type/required/options; update() per field (few fields, acceptable)
     // insert new: rows with id "__new__" (assign that placeholder in addField when mode is edit)
     ```
     > Simplest correct pattern: in edit mode, `addField` creates `{ id: "__new__" + counter }`. Then: `delete .in(id, removed)`, `update` per kept field, `insert` the `__new__` rows with the real `template_id`.
  3. Keep field order correct: after ops, run a final `template_fields.update({ sort_order: i })` for each kept id? — optional; simplest: do a `select` of existing, then **delete all + re-insert all** in one shot. At this scale (a handful of fields per template) "delete all + re-insert" is acceptable and far less bug-prone; document the choice in a comment.
  4. `router.push("/templates")`.
- Also add a "Cancel" link back to `/templates`.

**Step C4 — Verify (full cycle — the case-study T2.1 test)**
1. Create → appears in list.
2. Edit it: rename, change a field from text to select, add one field, remove one → saved correctly (verify order/type/required via SQL).
3. Delete it → gone, fields cascade.
4. `npm run build` + lint pass.
5. Commit: `git commit -m "feat: template editing with field diffing"`

---

## 6. Task D — Dashboard live metric cards

**Files:**
- Create: `src/components/dashboard/metric-cards.tsx`
- Replace: `src/app/(dashboard)/dashboard/page.tsx`

**Step D1 — Metric cards component** (`"use client"`)

- State: `counts: { templates: number | null; thisMonth: number | null; pending: number | null }`, `error`.
- `load()` (fetch all three in parallel):

```ts
const [{ count: templates }, { count: thisMonth }, { count: pending }] = await Promise.all([
  supabase.from("document_templates").select("id", { count: "exact", head: true }),
  supabase.from("generated_documents")
    .select("id", { count: "exact", head: true })
    .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  supabase.from("generated_documents")
    .select("id", { count: "exact", head: true })
    .in("status", ["draft", "under_review", "changes_requested"]),
]);
```

- Render 3 `Card`s (reuse the `ConnectivityCard` pattern from Phase 1 or build inline): **Total templates**, **Documents this month**, **Pending review**, each with a short muted caption naming the source table. Add a "Refresh" ghost button that calls `load()`.
- **Live-update behavior:** call `load()` on mount AND on window focus (`useEffect` + `window.addEventListener("focus", load)` with cleanup) — this is what makes the dashboard react to changes made in other tabs/SQL editor without polling.

**Step D2 — Replace the dashboard page**

`src/app/(dashboard)/dashboard/page.tsx` (server component) — `<PageHeader title="Dashboard" description="Live numbers from the database." />` + `<MetricCards />`. Remove old ConnectivityCards.

**Step D3 — Verify**
1. Card values match: `select count(*) from document_templates;` and the SQL equivalents for the other two.
2. In SQL Editor: `insert into generated_documents (template_id, client_id, content) values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'test');` → refocus the browser tab → "Documents this month" and "Pending review" go up by 1 (delete the test row afterwards, or keep it — Phase 3 clears it anyway).
3. Commit: `git commit -m "feat: live dashboard metric cards"`

---

## 7. Task E — Activity feed & charts

**Files:**
- Create: `src/components/dashboard/activity-feed.tsx`
- Create: `src/components/dashboard/charts.tsx`
- Modify: `src/app/(dashboard)/dashboard/page.tsx` (compose feed + charts)

**Step E1 — Activity feed** (`"use client"`)

- Query: last 8 generated documents with joins:

```ts
const { data } = await supabase
  .from("generated_documents")
  .select("id, status, created_at, template_id(name), client_id(name)")
  .order("created_at", { ascending: false })
  .limit(8);
```

- Render a `Card` titled "Recent activity": each row shows the template name, client name, status Badge, and relative time — implement `timeAgo(iso: string)` inline (minutes/hours/days, e.g. "2h ago"); no library needed.
- Empty state: "No documents generated yet."
- Re-query on window focus (same pattern as MetricCards — extract a tiny `useFocusRefresh(cb)` hook into `src/lib/use-focus-refresh.ts` and reuse it in both components; this is the one shared hook of the phase).

**Step E2 — Charts** (`src/components/dashboard/charts.tsx`, `"use client"`)

- Recharts is installed. Two cards side by side (grid `lg:grid-cols-2`):

**Chart 1 — "Documents over time" (LineChart):**
```ts
const { data } = await supabase
  .from("generated_documents")
  .select("created_at");
```
Group in JS: build the last 6 months as buckets (`YYYY-MM`), count documents per month. Data shape: `{ month: "Mar", count: n }[]` (use `toLocaleString("en", { month: "short" })`). Render:
```tsx
<ResponsiveContainer width="100%" height={260}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" />
    <YAxis allowDecimals={false} />
    <Tooltip />
    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" />
  </LineChart>
</ResponsiveContainer>
```
(imports: `ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip` from `recharts`)

**Chart 2 — "Documents by template" (BarChart):**
```ts
const { data } = await supabase
  .from("generated_documents")
  .select("template_id(name)");
```
Group by template name in JS, sort desc, top 5. `BarChart` with `<Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />`.

- If the aggregate is empty → show a muted note inside the card ("Generate documents in Phase 3 to see charts fill in") while still rendering the axes (per the requirement, charts render even with zero data).

**Step E3 — Compose the dashboard**

`dashboard/page.tsx` layout: `<MetricCards />` → grid `mt-6 grid gap-6 lg:grid-cols-5`: `ActivityFeed` (`lg:col-span-2`) + `Charts` (`lg:col-span-3`), or feed on the left and charts stacked — pick the arrangement that looks clean at `lg`; single column below `lg`.

**Step E4 — Verify**
1. Insert 2–3 documents for different templates + months via SQL Editor (vary `created_at` with `now() - interval '2 months'` etc.) → refocus → feed shows them, charts show per-month and per-template aggregates.
2. Empty states look right when the table is empty (truncate + reseed if needed).
3. `npm run build` + lint pass.
4. Commit: `git commit -m "feat: dashboard activity feed and charts"`

---

## 8. Manual test script (run the whole thing, in order)

1. Login as `admin@meridian.demo / admin123`.
2. Dashboard → all three cards > 0, feed + charts render.
3. Templates → 3 seeded templates with correct field counts (5/6/6).
4. Search "will" → only Simple Will.
5. Create "Rental Agreement" (Task B4 fields) → appears with 6 fields.
6. Edit it → rename to "Rental Agreement v2", change Lease Type options, add a field → saved.
7. Delete it → gone; SQL shows its fields cascaded.
8. SQL-insert a test generated_document → refocus browser → dashboard numbers/feed/charts change.
9. Sign out → sign in as `paralegal@meridian.demo / paralegal123` → can READ everything, but creating a template shows the RLS error.
10. `npm run build` clean · `npm run lint` clean.

## 9. Commit & merge

```bash
git add -A && git push -u origin arshia-docgen
```

- [ ] PR `arshia-docgen → main` (title: "Phase 2: Templates & Dashboard"), ask Ali to review.
- [ ] Fix review feedback in small follow-up commits; do not rebase.
- [ ] Merge only after Ali approves and you re-ran the test script.

## 10. Handoff to Phase 3 (Ali)

- Message Ali: "Phase 2 merged to main — templates CRUD + field builder + live dashboard done. Branch `alihaiderbajwa-docgen` from updated main, see `docs/phases/phase-3-clients-wizard.md`. Seeded templates (Simple Will/NDA/Commercial Lease) are ready to test the wizard."

## 11. Pitfalls checklist (review before you start coding)

- [ ] Forgetting `"use client"` on interactive components → hydration errors.
- [ ] In-memory filtering instead of DB search → fails the "search as a database query" requirement.
- [ ] Not committing after each task → review is painful; commit per task.
- [ ] Hard-coding a count anywhere on the dashboard → fails DoD.
- [ ] Writing to templates while signed in as paralegal → RLS 42501 (expected; test writes as admin).
- [ ] Deleting `(dashboard)/layout.tsx` or `sidebar.tsx` by accident → keep untouched.
- [ ] Running `run-sql.mjs` after adding test data → wipes it (script drops + recreates tables).
