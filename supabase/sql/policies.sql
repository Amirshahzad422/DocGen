-- =====================================================================
-- Meridian DocGen — policies.sql
-- Row-level security policies. Run AFTER schema.sql + seed.sql.
-- Idempotent: drops and recreates every policy, safe to rerun.
--
-- PHASE 1: baseline — all authenticated staff can read; writes gated by role.
-- PHASE 4: full matrix — paralegals can never approve/finalize documents
--          (enforced in the generated_documents UPDATE policy below).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Enable RLS on every table
-- ---------------------------------------------------------------------
alter table public.roles               enable row level security;
alter table public.staff               enable row level security;
alter table public.document_templates  enable row level security;
alter table public.template_fields     enable row level security;
alter table public.clients             enable row level security;
alter table public.generated_documents enable row level security;
alter table public.review_comments     enable row level security;
alter table public.firm_settings       enable row level security;

-- ---------------------------------------------------------------------
-- roles — readable by all staff, writable only by admin
-- ---------------------------------------------------------------------
drop policy if exists "roles_select" on public.roles;
create policy "roles_select" on public.roles
  for select to authenticated using (true);

drop policy if exists "roles_admin_write" on public.roles;
create policy "roles_admin_write" on public.roles
  for all to authenticated
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- ---------------------------------------------------------------------
-- staff — readable by all staff, writable only by admin
-- ---------------------------------------------------------------------
drop policy if exists "staff_select" on public.staff;
create policy "staff_select" on public.staff
  for select to authenticated using (true);

drop policy if exists "staff_admin_write" on public.staff;
create policy "staff_admin_write" on public.staff
  for all to authenticated
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- ---------------------------------------------------------------------
-- document_templates — admin/attorney manage, everyone reads
-- ---------------------------------------------------------------------
drop policy if exists "templates_select" on public.document_templates;
create policy "templates_select" on public.document_templates
  for select to authenticated using (true);

drop policy if exists "templates_write" on public.document_templates;
create policy "templates_write" on public.document_templates
  for all to authenticated
  using (public.current_role() in ('admin', 'attorney'))
  with check (public.current_role() in ('admin', 'attorney'));

-- ---------------------------------------------------------------------
-- template_fields — same as templates
-- ---------------------------------------------------------------------
drop policy if exists "template_fields_select" on public.template_fields;
create policy "template_fields_select" on public.template_fields
  for select to authenticated using (true);

drop policy if exists "template_fields_write" on public.template_fields;
create policy "template_fields_write" on public.template_fields
  for all to authenticated
  using (public.current_role() in ('admin', 'attorney'))
  with check (public.current_role() in ('admin', 'attorney'));

-- ---------------------------------------------------------------------
-- clients — all staff read/insert/update, admin deletes
-- ---------------------------------------------------------------------
drop policy if exists "clients_select" on public.clients;
create policy "clients_select" on public.clients
  for select to authenticated using (true);

drop policy if exists "clients_insert" on public.clients;
create policy "clients_insert" on public.clients
  for insert to authenticated with check (true);

drop policy if exists "clients_update" on public.clients;
create policy "clients_update" on public.clients
  for update to authenticated using (true) with check (true);

drop policy if exists "clients_delete" on public.clients;
create policy "clients_delete" on public.clients
  for delete to authenticated
  using (public.current_role() = 'admin');

-- ---------------------------------------------------------------------
-- generated_documents — all staff create drafts, read all
--   UPDATE: admin/attorney full control; paralegal limited (Phase 4
--   strengthens this so paralegals can never set approved/finalized).
-- ---------------------------------------------------------------------
drop policy if exists "documents_select" on public.generated_documents;
create policy "documents_select" on public.generated_documents
  for select to authenticated using (true);

drop policy if exists "documents_insert" on public.generated_documents;
create policy "documents_insert" on public.generated_documents
  for insert to authenticated with check (true);

drop policy if exists "documents_update" on public.generated_documents;
create policy "documents_update" on public.generated_documents
  for update to authenticated
  using (public.current_role() in ('admin', 'attorney'))
  with check (public.current_role() in ('admin', 'attorney'));

-- Paralegals (and any non-attorney) may only move drafts back and forth
-- between draft/changes_requested/under_review — they can NEVER set a
-- document to approved or finalized. Finalized docs also get finalized_at
-- set only by attorneys (the write policy above).
drop policy if exists "documents_update_paralegal" on public.generated_documents;
create policy "documents_update_paralegal" on public.generated_documents
  for update to authenticated
  using (public.current_role() not in ('admin', 'attorney'))
  with check (
    not (public.current_role() in ('admin', 'attorney'))
    and status in ('draft', 'under_review', 'changes_requested')
  );

drop policy if exists "documents_delete" on public.generated_documents;
create policy "documents_delete" on public.generated_documents
  for delete to authenticated
  using (public.current_role() = 'admin');

-- ---------------------------------------------------------------------
-- review_comments — all staff read + comment; admin/attorney update (resolved)
-- ---------------------------------------------------------------------
drop policy if exists "comments_select" on public.review_comments;
create policy "comments_select" on public.review_comments
  for select to authenticated using (true);

drop policy if exists "comments_insert" on public.review_comments;
create policy "comments_insert" on public.review_comments
  for insert to authenticated with check (true);

drop policy if exists "comments_update" on public.review_comments;
create policy "comments_update" on public.review_comments
  for update to authenticated
  using (public.current_role() in ('admin', 'attorney'))
  with check (public.current_role() in ('admin', 'attorney'));

drop policy if exists "comments_delete" on public.review_comments;
create policy "comments_delete" on public.review_comments
  for delete to authenticated
  using (public.current_role() = 'admin');

-- ---------------------------------------------------------------------
-- firm_settings — everyone reads (branding), admin writes
-- ---------------------------------------------------------------------
drop policy if exists "firm_settings_select" on public.firm_settings;
create policy "firm_settings_select" on public.firm_settings
  for select to authenticated using (true);

drop policy if exists "firm_settings_write" on public.firm_settings;
create policy "firm_settings_write" on public.firm_settings
  for all to authenticated
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');
