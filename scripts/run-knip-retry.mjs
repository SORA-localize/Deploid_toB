import { spawnSync } from 'node:child_process';

// Knip can exit 13 when Node's worker-thread loader races under a busy shared
// CI runner. Retry only that known transient exit; preserve all real failures.
const maxAttempts = 3;
for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  const result = spawnSync(process.execPath, ['node_modules/knip/bin/knip.js', ...process.argv.slice(2)], {
    stdio: 'inherit',
  });
  if (result.status === 0) process.exit(0);
  if (result.status !== 13 || attempt === maxAttempts) process.exit(result.status ?? 1);
}
