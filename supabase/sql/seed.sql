-- =====================================================================
-- Meridian DocGen — seed.sql
-- Sample roles, staff, templates, template fields, clients and settings.
-- Run AFTER schema.sql, BEFORE policies.sql. Safe to rerun.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------
insert into public.roles (id, name, description) values
  ('00000000-0000-0000-0000-000000000001', 'admin',     'Full access: staff, roles, templates, everything'),
  ('00000000-0000-0000-0000-000000000002', 'attorney',  'Reviews drafts, approves and finalizes documents'),
  ('00000000-0000-0000-0000-000000000003', 'paralegal', 'Registers clients, fills wizards, resubmits drafts')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- Staff (user_id links to Supabase Auth users — see scripts/create-demo-users.mjs)
-- ---------------------------------------------------------------------
insert into public.staff (name, email, role_id, active) values
  ('Ali Haider Bajwa',  'admin@meridian.demo',      '00000000-0000-0000-0000-000000000001', true),
  ('Ayesha Tariq',      'attorney@meridian.demo',   '00000000-0000-0000-0000-000000000002', true),
  ('Kamran Adeel',      'k.adeel@meridian.demo',    '00000000-0000-0000-0000-000000000002', true),
  ('Arshia Khan',      'paralegal@meridian.demo',  '00000000-0000-0000-0000-000000000003', true),
  ('Sana Rizvi',        's.rizvi@meridian.demo',    '00000000-0000-0000-0000-000000000003', true)
on conflict (email) do nothing;

-- ---------------------------------------------------------------------
-- Templates
-- ---------------------------------------------------------------------
insert into public.document_templates (id, name, category, description, body, status) values
  (
    '10000000-0000-0000-0000-000000000001',
    'Simple Will',
    'Estate Planning',
    'A basic last will and testament for a single testator with an executor.',
    $body$
LAST WILL AND TESTAMENT

I, {{client_name}}, born on {{date_of_birth}}, currently residing at the address provided to my attorney, being of sound mind, do hereby revoke all prior wills and codicils and declare this to be my Last Will and Testament.

1. SPOUSE. I am {{spouse_name|not married}} married. All references to my spouse in this Will are to the person named above.

2. EXECUTOR. I nominate {{executor_name}} as the Executor of this Will, and direct that no bond be required of my Executor.

3. ASSETS. I give all property, both real and personal, of which I may die possessed, including {{assets_summary}}, to be administered according to the laws of the jurisdiction in which I reside at the time of my death.

4. GENERAL PROVISIONS. My Executor shall have the power to sell, transfer, and distribute my estate as permitted by law.

IN WITNESS WHEREOF, I have signed this Will this day, in the presence of the witnesses below.

Signature: ______________________
{{client_name}}
$body$,
    'active'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'NDA',
    'Corporate',
    'Mutual non-disclosure agreement between two parties for a stated purpose.',
    $body$
NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement (the "Agreement") is entered into on {{effective_date}} (the "Effective Date"), by and between {{disclosing_party}} ("Disclosing Party") and {{receiving_party}} ("Receiving Party").

1. PURPOSE. The parties wish to explore a business relationship relating to: {{purpose}} (the "Purpose").

2. CONFIDENTIAL INFORMATION. "Confidential Information" means any information disclosed by the Disclosing Party, oral or written, that is marked confidential or would reasonably be understood to be confidential.

3. OBLIGATIONS. The Receiving Party shall not disclose Confidential Information to any third party, shall use it solely for the Purpose, and shall protect it with the same degree of care used for its own confidential information.

4. TERM. The obligations under this Agreement shall survive for a period of {{duration_years}} year(s) from the Effective Date.

5. GOVERNING LAW. This Agreement shall be governed by the laws of {{governing_law}}.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.

{{disclosing_party}}
{{receiving_party}}
$body$,
    'active'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'Commercial Lease',
    'Real Estate',
    'Standard commercial lease agreement between landlord and tenant.',
    $body$
COMMERCIAL LEASE AGREEMENT

This Commercial Lease Agreement (the "Lease") is entered into on {{start_date}} by and between {{landlord}} ("Landlord") and {{tenant}} ("Tenant").

1. PREMISES. Landlord leases to Tenant the premises located at {{property_address}} (the "Premises").

2. TERM. The term of this Lease shall be {{lease_term_years}} year(s), commencing on {{start_date}}.

3. RENT. Tenant shall pay monthly rent of {{monthly_rent}} (in the agreed currency) on the first day of each month.

4. USE. The Premises shall be used solely for lawful commercial purposes.

5. UTILITIES. Tenant shall pay all utilities and services supplied to the Premises during the term.

6. DEFAULT. If Tenant fails to pay rent or breaches any term, Landlord may terminate this Lease upon written notice as provided by law.

IN WITNESS WHEREOF, the parties have executed this Lease as of the date first written above.

{{landlord}}
{{tenant}}
$body$,
    'active'
  );

-- ---------------------------------------------------------------------
-- Template fields (labels are slugified to match {{tokens}} in bodies)
-- ---------------------------------------------------------------------
insert into public.template_fields (template_id, label, field_type, options, required, sort_order) values
  -- Simple Will
  ('10000000-0000-0000-0000-000000000001', 'Client Name',     'text',     '{}', true,  0),
  ('10000000-0000-0000-0000-000000000001', 'Date of Birth',   'date',     '{}', true,  1),
  ('10000000-0000-0000-0000-000000000001', 'Spouse Name',     'text',     '{}', false, 2),
  ('10000000-0000-0000-0000-000000000001', 'Executor Name',   'text',     '{}', true,  3),
  ('10000000-0000-0000-0000-000000000001', 'Assets Summary',  'textarea', '{}', true,  4),
  -- NDA
  ('10000000-0000-0000-0000-000000000002', 'Disclosing Party', 'text',    '{}', true,  0),
  ('10000000-0000-0000-0000-000000000002', 'Receiving Party',  'text',    '{}', true,  1),
  ('10000000-0000-0000-0000-000000000002', 'Effective Date',   'date',    '{}', true,  2),
  ('10000000-0000-0000-0000-000000000002', 'Purpose',          'textarea','{}', true,  3),
  ('10000000-0000-0000-0000-000000000002', 'Duration Years',   'number',  '{}', true,  4),
  ('10000000-0000-0000-0000-000000000002', 'Governing Law',    'select',  '{Pakistan,United Kingdom,United States,United Arab Emirates}', true, 5),
  -- Commercial Lease
  ('10000000-0000-0000-0000-000000000003', 'Landlord',           'text', '{}', true, 0),
  ('10000000-0000-0000-0000-000000000003', 'Tenant',             'text', '{}', true, 1),
  ('10000000-0000-0000-0000-000000000003', 'Property Address',   'text', '{}', true, 2),
  ('10000000-0000-0000-0000-000000000003', 'Monthly Rent',       'number', '{}', true, 3),
  ('10000000-0000-0000-0000-000000000003', 'Lease Term Years',   'number', '{}', true, 4),
  ('10000000-0000-0000-0000-000000000003', 'Start Date',         'date',   '{}', true, 5);

-- ---------------------------------------------------------------------
-- Clients
-- ---------------------------------------------------------------------
insert into public.clients (id, name, email, phone, address, notes) values
  (
    '20000000-0000-0000-0000-000000000001',
    'Sarah Mitchell', 'sarah.mitchell@example.com', '+92 300 111 2233',
    '12 Lake View Road, Lahore', 'Prefers electronic signatures; estate planning matters.'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'James Carter', 'james.carter@example.com', '+92 321 444 5566',
    '88 Blue Street, Karachi', 'Corporate client; signatory authority for NDA matters.'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    'Ayesha Khan', 'ayesha.khan@example.com', '+92 345 777 8899',
    '5 Gulberg Avenue, Islamabad', 'Commercial tenant; lease renewal expected.'
  );

-- ---------------------------------------------------------------------
-- Firm settings (single row, id = 1)
-- ---------------------------------------------------------------------
insert into public.firm_settings (id, firm_name, tagline, address, phone, email) values
  (
    1,
    'Meridian Legal Group',
    'Clarity in every clause.',
    '10 Constitution Avenue, Suite 400, Islamabad',
    '+92 51 123 4567',
    'info@meridianlegal.demo'
  )
on conflict (id) do nothing;
