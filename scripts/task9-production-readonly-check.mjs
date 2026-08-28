import { readFile, writeFile } from 'node:fs/promises';
import { Client } from 'pg';

const envPath = process.argv[2];
const outputPath = process.argv[3] ?? '/tmp/task9-production-readonly-result.json';
if (!envPath) {
  console.error('Usage: node scripts/task9-production-readonly-check.mjs <vercel-env-file> [output-json]');
  process.exit(2);
}

const text = await readFile(envPath, 'utf8');
const env = {};
for (const line of text.split(/\r?\n/)) {
  const match = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!match) continue;
  env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
}
const databaseUrl = env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is missing from the env file');

const result = { checkedAt: new Date().toISOString(), source: 'read-only', database: {}, environmentVariables: {} };
for (const name of ['DATABASE_URL', 'CONTENT_SOURCE', 'PAYLOAD_SECRET', 'BLOB_STORE_ID', 'SNAPSHOT_SIGNING_KMS_KEY_ARN']) {
  result.environmentVariables[name] = env[name] ? 'present' : 'missing';
}
const client = new Client({ connectionString: databaseUrl });
await client.connect();
try {
  const identity = await client.query('select current_database() as database, current_user as role, inet_server_addr()::text as host, inet_server_port() as port');
  result.database.identity = identity.rows[0];
  const marker = await client.query('select environment, last_restored_baseline_generation from "_environment_marker" limit 1');
  result.database.environmentMarker = marker.rows[0] ?? null;
  const counts = await client.query(`select table_name from information_schema.tables where table_schema = 'public' order by table_name`);
  result.database.publicTables = counts.rows.map((row) => row.table_name);
} finally {
  await client.end();
}
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(`read-only result written to ${outputPath}`);
console.log(JSON.stringify(result, null, 2));
