import { describe, expect, it } from 'vitest';
import config from '../../payload.config';

/**
 * brief（`docs/plans/content-platform-migration-plan-v1.md` Task 3 Step 1）の契約testを
 * そのまま使う。`buildConfig()` の sanitize結果を検査するだけで実DB接続を要しないため、
 * `admin-access.test.ts` のような throwaway DB guard は不要。
 */
describe('Payload content schema', () => {
  it('registers every content collection', async () => {
    const resolved = await config;
    expect(resolved.collections.map((collection) => collection.slug)).toEqual(
      expect.arrayContaining([
        'admins',
        'manufacturers',
        'distributors',
        'robot-series',
        'robots',
        'use-cases',
        'deployments',
        'articles',
        'article-placements',
        'media',
      ]),
    );
  });

  // ②の §0 G-4 が要求する。data/types.ts を写すと再導入されるため機械で止める。
  it('does not carry the removed Robot fields', async () => {
    const resolved = await config;
    const robots = resolved.collections.find((collection) => collection.slug === 'robots')!;
    const names = robots.fields.flatMap((field) => ('name' in field ? [field.name] : []));

    for (const removed of ['buyerReadiness', 'marketAvailability', 'safetyNote', 'vendorRiskNote']) {
      expect(names).not.toContain(removed);
    }
    // comparison は /compare が使用中のため残す
    expect(names).toContain('comparison');
  });

  it('links robots to their series', async () => {
    const resolved = await config;
    const robots = resolved.collections.find((collection) => collection.slug === 'robots')!;
    const seriesId = robots.fields.find((field) => 'name' in field && field.name === 'seriesId');

    expect(seriesId).toBeDefined();
    expect(seriesId).toMatchObject({ type: 'relationship', relationTo: 'robot-series', required: false });
  });

  it('registers the route registry table used by Robots/RobotSeries slug sharing', async () => {
    const resolved = await config;
    const registry = resolved.collections.find((collection) => collection.slug === 'content-route-registry');
    expect(registry).toBeDefined();
  });

  it('registers the SiteSettings global', async () => {
    const resolved = await config;
    expect(resolved.globals.map((global) => global.slug)).toContain('site-settings');
  });

  /**
   * 必須修正3-1（remediation group 1）: 署名済みprivate audit archiveが完成するまで自動pruneは
   * 無効（`maxPerDoc: 0` = Payloadの `saveVersion.js` の `max > 0` ガードで
   * `enforceMaxVersions` が呼ばれない）。以前は `maxPerDoc: 50` で、archiveできないまま
   * 51版目以降が実削除されていた。
   */
  it('gives every content collection drafts and keeps automatic version pruning disabled', async () => {
    const resolved = await config;
    const contentSlugs = ['manufacturers', 'distributors', 'robot-series', 'robots', 'use-cases', 'deployments', 'articles', 'article-placements'];
    for (const slug of contentSlugs) {
      const collection = resolved.collections.find((c) => c.slug === slug)!;
      expect(collection.versions).toBeTruthy();
      expect(collection.versions?.drafts).toBeTruthy();
      expect((collection.versions as { maxPerDoc?: number })?.maxPerDoc).toBe(0);
    }
  });
});
