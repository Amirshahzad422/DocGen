// Create the three demo Supabase Auth users and link them to their staff rows.
// Uses the Auth Admin API (service_role key) — the supported way to create
// users; direct SQL inserts into auth.users break GoTrue's schema handling.
//
// Usage (from repo root, after npm install in the app folder):
//   SUPABASE_URL=https://<ref>.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=<service_role key> \
//   node scripts/create-demo-users.mjs
//
// Or: values are also read from meridian-docgen-alihaiderbajwa/.env.local
// (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).
//
// Demo accounts created (email / password):
//   admin@meridian.demo      / admin123
//   attorney@meridian.demo   / attorney123
//   paralegal@meridian.demo  / paralegal123

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const appDir =
  readdirSync(root).find((d) => d.startsWith('meridian-docgen-')) ?? root;
const require = createRequire(join(root, appDir, 'package.json'));
const { createClient } = require('@supabase/supabase-js');

// Load .env.local from the app folder if it exists (simple parser).
function loadEnvFile(file) {
  const vars = {};
  if (!file) return vars;
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) vars[m[1]] = m[2].trim();
    }
  } catch {
    /* no env file */
  }
  return vars;
}
const env = loadEnvFile(join(root, appDir, '.env.local'));

const url = process.env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    'Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (env or app .env.local).',
  );
  process.exit(1);
}

const users = [
  { email: 'admin@meridian.demo', password: 'admin123' },
  { email: 'attorney@meridian.demo', password: 'attorney123' },
  { email: 'paralegal@meridian.demo', password: 'paralegal123' },
];

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

for (const u of users) {
  // Idempotent: remove any existing user with this email first.
  const { data: existing } = await admin.auth.admin.listUsers({
    perPage: 1000,
  });
  const dupe = existing?.users.find((x) => x.email === u.email);
  if (dupe) {
    await admin.auth.admin.deleteUser(dupe.id);
    console.log(`removed existing auth user ${u.email}`);
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
  });
  if (error) {
    console.error(`createUser failed for ${u.email}: ${error.message}`);
    process.exit(1);
  }

  const { error: linkErr } = await admin
    .from('staff')
    .update({ user_id: created.user.id })
    .eq('email', u.email);
  if (linkErr) {
    console.error(`link failed for ${u.email}: ${linkErr.message}`);
    process.exit(1);
  }
  console.log(`✓ created + linked ${u.email} -> ${created.user.id}`);
}

console.log('Demo users ready. Sign in with the passwords above.');
