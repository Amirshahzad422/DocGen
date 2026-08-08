-- =====================================================================
-- Meridian DocGen — schema.sql
-- Creates every table for the legal document generator.
-- Run BEFORE seed.sql and policies.sql. Idempotent: safe to rerun.
-- =====================================================================

drop table if exists public.review_comments cascade;
drop table if exists public.generated_documents cascade;
drop table if exists public.template_fields cascade;
drop table if exists public.document_templates cascade;
drop table if exists public.clients cascade;
drop table if exists public.staff cascade;
drop table if exists public.roles cascade;
drop table if exists public.firm_settings cascade;

create extension if not exists "pgcrypto";

-- Privileged RLS helpers live outside the exposed public schema. Keeping
-- security-definer functions private prevents them from becoming Data API
-- endpoints while still allowing policies to use them.
create schema if not exists private;
revoke all on schema private from public, anon;

-- ---------------------------------------------------------------------
-- Roles (admin, attorney, paralegal)
-- ---------------------------------------------------------------------
create table public.roles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Staff — linked to Supabase Auth users (user_id nullable until linked)
-- ---------------------------------------------------------------------
create table public.staff (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid unique references auth.users (id) on delete set null,
  name       text not null,
  email      text not null unique,
  role_id    uuid not null references public.roles (id) on delete restrict,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create index staff_role_idx on public.staff (role_id);

-- ---------------------------------------------------------------------
-- Document templates — body contains {{placeholder}} tokens
-- ---------------------------------------------------------------------
create table public.document_templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null default 'Other',
  description text,
  body        text not null default '',
  status      text not null default 'active' check (status in ('active', 'archived')),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Template fields — drive the wizard form for each template
-- ---------------------------------------------------------------------
create table public.template_fields (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.document_templates (id) on delete cascade,
  label       text not null,
  field_type  text not null check (field_type in ('text', 'textarea', 'date', 'select', 'number')),
  options     text[] not null default '{}',
  required    boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index template_fields_template_idx on public.template_fields (template_id);

-- ---------------------------------------------------------------------
-- Clients
-- ---------------------------------------------------------------------
create table public.clients (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text,
  phone      text,
  address    text,
  notes      text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Generated documents — the merged draft
-- ---------------------------------------------------------------------
create table public.generated_documents (
  id           uuid primary key default gen_random_uuid(),
  template_id  uuid not null references public.document_templates (id) on delete restrict,
  client_id    uuid not null references public.clients (id) on delete cascade,
  created_by   uuid references public.staff (id) on delete set null,
  field_values jsonb not null default '{}'::jsonb,
  content      text not null default '',
  status       text not null default 'draft'
               check (status in ('draft', 'under_review', 'changes_requested', 'approved', 'finalized')),
  created_at   timestamptz not null default now(),
  finalized_at timestamptz,
  constraint generated_documents_finalized_at_check check (
    (status = 'finalized' and finalized_at is not null)
    or (status <> 'finalized' and finalized_at is null)
  )
);

create index generated_documents_status_idx on public.generated_documents (status);
create index generated_documents_created_idx on public.generated_documents (created_at desc);
create index generated_documents_client_idx on public.generated_documents (client_id);
create index generated_documents_template_idx on public.generated_documents (template_id);

-- ---------------------------------------------------------------------
-- Review comments — linked to a generated document and a reviewer
-- ---------------------------------------------------------------------
create table public.review_comments (
  id                    uuid primary key default gen_random_uuid(),
  generated_document_id uuid not null references public.generated_documents (id) on delete cascade,
  staff_id              uuid not null references public.staff (id) on delete cascade,
  comment               text not null,
  resolved              boolean not null default false,
  created_at            timestamptz not null default now()
);

create index review_comments_document_idx on public.review_comments (generated_document_id);
create index review_comments_staff_idx on public.review_comments (staff_id);

-- ---------------------------------------------------------------------
-- Firm settings — single-row (id = 1) firm information
-- ---------------------------------------------------------------------
create table public.firm_settings (
  id         integer primary key check (id = 1),
  firm_name  text not null default '',
  tagline    text,
  address    text,
  phone      text,
  email      text,
  logo_url   text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Helpers for the current authenticated staff member (used by policies.sql)
-- ---------------------------------------------------------------------
drop function if exists public.current_role();

create or replace function private.current_staff_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select s.id
  from public.staff s
  where s.user_id = (select auth.uid())
    and s.active = true;
$$;

create or replace function private.current_role_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select s.role_id
  from public.staff s
  where s.user_id = (select auth.uid())
    and s.active = true;
$$;

create or replace function private.current_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select r.name
  from public.staff s
  join public.roles r on r.id = s.role_id
  where s.user_id = (select auth.uid())
    and s.active = true;
$$;

create or replace function private.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff s
    where s.user_id = (select auth.uid())
      and s.active = true
  );
$$;

revoke all on function private.current_staff_id() from public, anon;
revoke all on function private.current_role_id() from public, anon;
revoke all on function private.current_role() from public, anon;
revoke all on function private.is_active_staff() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.current_staff_id() to authenticated;
grant execute on function private.current_role_id() to authenticated;
grant execute on function private.current_role() to authenticated;
grant execute on function private.is_active_staff() to authenticated;
