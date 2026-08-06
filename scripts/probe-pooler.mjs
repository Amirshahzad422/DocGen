// Probe Supabase transaction pooler regions to find where the project lives.
import { createRequire } from 'node:module';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lookup } from 'node:dns/promises';
import { readdirSync } from 'node:fs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const appDir =
  readdirSync(root).find((d) => d.startsWith('meridian-docgen-')) ?? root;
const require = createRequire(join(root, appDir, 'package.json'));
const pg = require('pg');

const ref = process.env.SUPABASE_REF;
const password = process.env.SUPABASE_DB_PASSWORD;
if (!ref || !password) {
  console.error('SUPABASE_REF and SUPABASE_DB_PASSWORD required');
  process.exit(1);
}

const regions = [
  'ap-south-1', 'ap-southeast-1', 'ap-northeast-1', 'us-east-1',
  'us-west-1', 'us-east-2', 'eu-central-1', 'eu-west-1', 'ca-central-1',
];

for (const region of regions) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const client = new pg.Client({
    host: (await lookup(host, { family: 4 })).address,
    port: 6543,
    user: `postgres.${ref}`,
    password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });
  try {
    await client.connect();
    const res = await client.query('select current_database(), current_user');
    console.log(`✓ ${region} — connected:`, res.rows[0]);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.log(`✗ ${region} — ${err.code ?? err.message.split('\n')[0].slice(0, 120)}`);
  }
}
console.log('No region matched.');
process.exit(1);