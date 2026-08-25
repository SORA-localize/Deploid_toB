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

async function main(): Promise<void> {
  if (process.env.CI !== 'true') {
    throw new Error('seed-ci-site-settings is CI-only; refusing outside CI=true');
  }

  const payload = await getPayload({ config });
  try {
    await payload.updateGlobal({
      slug: 'site-settings',
      overrideAccess: true,
      data: {
        dataAsOf: 'ci-fixture',
        articleIndexPlacementLimits: { hero: 5, feature: 2 },
      },
    });
    console.log('[ci-fixture] seeded required site-settings global');
  } finally {
    await payload.destroy();
  }
  // Keep this one-shot CI helper from leaving a driver/socket handle alive.
  process.exit(0);
}

await main();
