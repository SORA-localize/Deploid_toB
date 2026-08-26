/**
 * Seed only the required site-settings global for the disposable CI database.
 *
 * CI intentionally starts with an empty, migrated Payload database. Production
 * and Preview are populated by the reviewed content import/restore workflows;
 * this script is never part of a deploy and is invoked only by CI=true.
 */
process.env.PAYLOAD_MIGRATING = 'true';

async function main(): Promise<void> {
  if (process.env.CI !== 'true') {
    console.log('[ci-fixture] skipped outside CI=true');
    return;
  }

  // Keep these imports after the migration guard is set. Static ESM imports are
  // evaluated before this module body and could initialize Payload too early.
  const [{ getPayload }, { default: config }, { contentSnapshotFixture }, { restoreContentSnapshot }, { authorizeRestoreFromLocalThrowaway }] =
    await Promise.all([
      import('payload'),
      import('../payload.config'),
      import('../tests/fixtures/contentSnapshot'),
      import('./import-content-to-payload.mts'),
      import('./restoreAuthorization.mts'),
    ]);

  const payload = await getPayload({ config });
  try {
    // The cache/draft E2E helpers perform a real Payload write and therefore
    // need a platform-admin user for the publish gate. Admins are intentionally
    // excluded from ContentSnapshot, so create a disposable CI-only account
    // here instead of relying on the retired --bootstrap-admin import path.
    const { docs: existingAdmins } = await payload.find({
      collection: 'admins',
      limit: 1,
      overrideAccess: true,
      depth: 0,
    });
    if (existingAdmins.length === 0) {
      const password = `ci-${crypto.randomUUID()}-Disposable!`;
      await payload.create({
        collection: 'admins',
        overrideAccess: true,
        data: {
          email: 'ci-fixture-admin@example.invalid',
          password,
          role: 'platform-admin',
        } as never,
      });
    }
    await restoreContentSnapshot({
      payload,
      snapshot: contentSnapshotFixture,
      user: { id: 'ci-fixture-admin', role: 'platform-admin' },
      authorization: authorizeRestoreFromLocalThrowaway({ environment: null, isLocalHost: true }),
      runId: 'ci-e2e-fixture',
      reason: 'disposable CI E2E fixture',
    });
    // Keep the required global explicit: restore may legitimately skip a global
    // when a fixture omits it, while the static build requires these fields.
    await payload.updateGlobal({
      slug: 'site-settings',
      overrideAccess: true,
      user: { id: 'ci-fixture-admin', role: 'platform-admin' },
      data: {
        dataAsOf: 'ci-fixture',
        articleIndexPlacementLimits: { hero: 5, feature: 2 },
      },
    });
    const published = await payload.findGlobal({ slug: 'site-settings', draft: false, depth: 0, overrideAccess: true });
    const limits = published.articleIndexPlacementLimits;
    if (limits?.hero !== 5 || limits?.feature !== 2) {
      throw new Error('[ci-fixture] site-settings publish verification failed');
    }
    console.log('[ci-fixture] seeded Payload E2E fixture');
  } finally {
    await payload.destroy();
  }
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
