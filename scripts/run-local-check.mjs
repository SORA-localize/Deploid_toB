import { spawnSync } from 'node:child_process';

const missing = ['DATABASE_URL', 'PAYLOAD_SECRET'].filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`[check:local] missing ${missing.join(', ')}.`);
  console.error('[check:local] run against an approved local throwaway DB, e.g. DATABASE_URL=... PAYLOAD_SECRET=... npm run check:local');
  process.exit(2);
}

const result = spawnSync('npm', ['run', 'check'], { stdio: 'inherit', env: process.env });
process.exit(result.status ?? 1);
