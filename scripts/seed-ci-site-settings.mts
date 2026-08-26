/**
 * Seed only the required site-settings global for the disposable CI database.
 *
 * CI intentionally starts with an empty, migrated Payload database. Production
 * and Preview are populated by the reviewed content import/restore workflows;
 * this script is never part of a deploy and is invoked only by CI=true.
 */
process.env.PAYLOAD_MIGRATING = 'true';

import { getPayload } from 'payload';
import config from '../payload.config';
import { contentSnapshotFixture } from '../tests/fixtures/contentSnapshot';
import { restoreContentSnapshot } from './import-content-to-payload.mts';
import { authorizeRestoreFromLocalThrowaway } from './restoreAuthorization.mts';

async function main(): Promise<void> {
  if (process.env.CI !== 'true') {
    throw new Error('seed-ci-site-settings is CI-only; refusing outside CI=true');
  }

  const payload = await getPayload({ config });
  try {
    await restoreContentSnapshot({
      payload,
      snapshot: contentSnapshotFixture,
      user: { id: 'ci-fixture-admin', role: 'platform-admin' },
      authorization: authorizeRestoreFromLocalThrowaway({ environment: null, isLocalHost: true }),
      runId: 'ci-e2e-fixture',
      reason: 'disposable CI E2E fixture',
    });
    console.log('[ci-fixture] seeded Payload E2E fixture');
  } finally {
    await payload.destroy();
  }
  // Keep this one-shot CI helper from leaving a driver/socket handle alive.
  process.exit(0);
}

await main();
