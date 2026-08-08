// Run the committed SQL scripts (schema.sql -> seed.sql -> policies.sql)
// against a Supabase project. Requires DATABASE_URL in the environment
// (copy of the "Connection string" from Supabase Project Settings -> Database).
//
// Usage:
//   DATABASE_URL=postgresql://... node scripts/run-sql.mjs
// Optionally LIMIT=seed to run only up to and including a given file.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { lookup } from 'node:dns/promises';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Resolve 'pg' from the Next.js app's node_modules (scripts live at repo root).
const appDir =
  readdirSync(root).find((d) => d.startsWith('meridian-docgen-')) ?? root;
const require = createRequire(join(root, appDir, 'package.json'));
const pg = require('pg');
const sqlDir = join(root, 'supabase', 'sql');
const limit = process.env.LIMIT;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required (Supabase connection string).');
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  // Force IPv4: pg ignores `family`, and Supabase hosts resolve AAAA first.
  host: (await lookup(new URL(connectionString).hostname, { family: 4 })).address,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const files = ['schema.sql', 'seed.sql', 'policies.sql'];
if (limit && !files.some((file) => file.replace(/\.sql$/, '') === limit)) {
  console.error(`Invalid LIMIT=${limit}. Expected schema, seed, or policies.`);
  process.exit(1);
}
for (const file of files) {
  if (!existsSync(join(sqlDir, file))) {
    console.error(`Missing ${file} in supabase/sql/`);
    process.exit(1);
  }
  console.log(`--- Running ${file} ---`);
  // schema.sql uses dollar-quoted bodies; pg supports multiple statements per query.
  const sql = readFileSync(join(sqlDir, file), 'utf8');
  await client.query(sql);
  console.log(`✓ ${file} done`);
  if (limit === file.replace(/\.sql$/, '')) break;
}

await client.end();
console.log('All selected SQL files applied.');
