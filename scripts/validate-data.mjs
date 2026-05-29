import { validateData } from '../lib/validate.ts';

const issues = validateData();

if (issues.length === 0) {
  console.log('[data] validation: OK');
} else {
  console.error(`[data] validation issues (${issues.length}):`);
  issues.forEach((issue) => console.error(`  - ${issue}`));
  process.exitCode = 1;
}
