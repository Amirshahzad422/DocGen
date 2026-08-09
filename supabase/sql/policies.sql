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

-- Explicit Data API privileges are required for projects created with
-- automatic public-schema exposure disabled. RLS remains the row-level gate.
revoke all on all tables in schema public from anon, authenticated;

grant select on public.roles, public.staff, public.document_templates,
  public.template_fields, public.clients, public.generated_documents,
  public.review_comments, public.firm_settings to authenticated;
grant insert, update, delete on public.roles to authenticated;
grant insert, delete on public.staff to authenticated;
grant update (name, email, role_id, active) on public.staff to authenticated;
grant insert, update, delete on public.document_templates,
  public.template_fields, public.clients to authenticated;
grant insert, delete on public.generated_documents to authenticated;
grant update (status, finalized_at) on public.generated_documents to authenticated;
grant insert, delete on public.review_comments to authenticated;
grant update (resolved) on public.review_comments to authenticated;
grant update (firm_name, tagline, address, phone, email, logo_url, updated_at)
  on public.firm_settings to authenticated;
grant all on all tables in schema public to service_role;

-- ---------------------------------------------------------------------
-- roles — readable by all staff, writable only by admin
-- ---------------------------------------------------------------------
drop policy if exists "roles_select" on public.roles;
create policy "roles_select" on public.roles
  for select to authenticated using ((select private.is_active_staff()));

drop policy if exists "roles_admin_write" on public.roles;
create policy "roles_admin_write" on public.roles
  for all to authenticated
  using ((select private.current_role()) = 'admin')
  with check ((select private.current_role()) = 'admin');

-- ---------------------------------------------------------------------
-- staff — readable by all staff, writable only by admin
-- ---------------------------------------------------------------------
drop policy if exists "staff_select" on public.staff;
create policy "staff_select" on public.staff
  for select to authenticated using ((select private.is_active_staff()));

drop policy if exists "staff_admin_write" on public.staff;
create policy "staff_admin_write" on public.staff
  for all to authenticated
  using ((select private.current_role()) = 'admin')
  with check ((select private.current_role()) = 'admin');

-- Staff can edit their own profile (name, email) but never their role or
-- active flag (no privilege escalation from the Settings page).
drop policy if exists "staff_self_update" on public.staff;
create policy "staff_self_update" on public.staff
  for update to authenticated
  using (
    user_id = (select auth.uid())
    and (select private.is_active_staff())
  )
  with check (
    user_id = (select auth.uid())
    and role_id = (select private.current_role_id())
    and active = true
  );

-- ---------------------------------------------------------------------
-- document_templates — admin/attorney manage, everyone reads
-- ---------------------------------------------------------------------
drop policy if exists "templates_select" on public.document_templates;
create policy "templates_select" on public.document_templates
  for select to authenticated using ((select private.is_active_staff()));

drop policy if exists "templates_write" on public.document_templates;
create policy "templates_write" on public.document_templates
  for all to authenticated
  using ((select private.current_role()) in ('admin', 'attorney'))
  with check ((select private.current_role()) in ('admin', 'attorney'));

-- ---------------------------------------------------------------------
-- template_fields — same as templates
-- ---------------------------------------------------------------------
drop policy if exists "template_fields_select" on public.template_fields;
create policy "template_fields_select" on public.template_fields
  for select to authenticated using ((select private.is_active_staff()));

drop policy if exists "template_fields_write" on public.template_fields;
create policy "template_fields_write" on public.template_fields
  for all to authenticated
  using ((select private.current_role()) in ('admin', 'attorney'))
  with check ((select private.current_role()) in ('admin', 'attorney'));

-- ---------------------------------------------------------------------
-- clients — all staff read/insert/update, admin deletes
-- ---------------------------------------------------------------------
drop policy if exists "clients_select" on public.clients;
create policy "clients_select" on public.clients
  for select to authenticated using ((select private.is_active_staff()));

drop policy if exists "clients_insert" on public.clients;
create policy "clients_insert" on public.clients
  for insert to authenticated with check ((select private.is_active_staff()));

drop policy if exists "clients_update" on public.clients;
create policy "clients_update" on public.clients
  for update to authenticated
  using ((select private.is_active_staff()))
  with check ((select private.is_active_staff()));

drop policy if exists "clients_delete" on public.clients;
create policy "clients_delete" on public.clients
  for delete to authenticated
  using ((select private.current_role()) = 'admin');

-- ---------------------------------------------------------------------
-- generated_documents — all staff create drafts, read all
--   UPDATE: admin/attorney full control; paralegal limited (Phase 4
--   strengthens this so paralegals can never set approved/finalized).
-- ---------------------------------------------------------------------
drop policy if exists "documents_select" on public.generated_documents;
create policy "documents_select" on public.generated_documents
  for select to authenticated using ((select private.is_active_staff()));

drop policy if exists "documents_insert" on public.generated_documents;
create policy "documents_insert" on public.generated_documents
  for insert to authenticated with check (
    (select private.is_active_staff())
    and created_by = (select private.current_staff_id())
    and status = 'draft'
    and finalized_at is null
  );

drop policy if exists "documents_update" on public.generated_documents;
create policy "documents_update" on public.generated_documents
  for update to authenticated
  using ((select private.current_role()) in ('admin', 'attorney'))
  with check ((select private.current_role()) in ('admin', 'attorney'));

-- Paralegals may only move drafts between draft, changes_requested, and
-- under_review. They can never approve/finalize documents or set finalized_at;
-- column grants also prevent them from rewriting document content.
drop policy if exists "documents_update_paralegal" on public.generated_documents;
create policy "documents_update_paralegal" on public.generated_documents
  for update to authenticated
  using ((select private.current_role()) = 'paralegal')
  with check (
    (select private.current_role()) = 'paralegal'
    and status in ('draft', 'under_review', 'changes_requested')
    and finalized_at is null
  );

drop policy if exists "documents_delete" on public.generated_documents;
create policy "documents_delete" on public.generated_documents
  for delete to authenticated
  using ((select private.current_role()) = 'admin');

-- ---------------------------------------------------------------------
-- review_comments — all staff read + comment; admin/attorney update (resolved)
-- ---------------------------------------------------------------------
drop policy if exists "comments_select" on public.review_comments;
create policy "comments_select" on public.review_comments
  for select to authenticated using ((select private.is_active_staff()));

drop policy if exists "comments_insert" on public.review_comments;
create policy "comments_insert" on public.review_comments
  for insert to authenticated with check (
    (select private.is_active_staff())
    and staff_id = (select private.current_staff_id())
  );

drop policy if exists "comments_update" on public.review_comments;
create policy "comments_update" on public.review_comments
  for update to authenticated
  using ((select private.current_role()) in ('admin', 'attorney'))
  with check ((select private.current_role()) in ('admin', 'attorney'));

drop policy if exists "comments_delete" on public.review_comments;
create policy "comments_delete" on public.review_comments
  for delete to authenticated
  using ((select private.current_role()) = 'admin');

-- ---------------------------------------------------------------------
-- firm_settings — everyone reads (branding), admin writes
-- ---------------------------------------------------------------------
drop policy if exists "firm_settings_select" on public.firm_settings;
create policy "firm_settings_select" on public.firm_settings
  for select to authenticated using ((select private.is_active_staff()));

drop policy if exists "firm_settings_write" on public.firm_settings;
create policy "firm_settings_write" on public.firm_settings
  for all to authenticated
  using ((select private.current_role()) = 'admin')
  with check ((select private.current_role()) = 'admin');
