import { getPayload, type Payload } from 'payload';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config from '../../payload.config';
import { assertLocalThrowawayDatabase } from './testDbGuard';
import { createPayloadContentSource } from '@/lib/content/payloadSource';
import { createLocalContentSource } from '@/lib/content/localSource';
import { localContentSnapshot } from '@/lib/data/localContentSnapshot';
import { siteMeta } from '@/lib/site';
import { privilegedPublishContext } from '@/lib/payload/publishAuthorization';

/**
 * remediation group 2 / 必須修正4 の回帰テスト。
 *
 * 監査の指摘: `globals/SiteSettings.ts` は `dataAsOf` / `articleIndexPlacementLimits` field を
 * 持たず、`lib/content/payloadSource.ts` が `settings.dataAsOf ?? siteMeta.dataAsOf` で
 * **ローカル定数へfallback**していた。CONTENT_SOURCE=payload でも欠落がparityに出ないため、
 * 「SiteSettingsはCMSへ移行済み」という主張が検証不能なtautologyになっていた。
 *
 * ここで固定する仕様:
 * 1. globalが `dataAsOf` / `articleIndexPlacementLimits.hero` / `.feature` を持つ。
 * 2. Payload sourceはlocal定数へfallbackしない。値が無ければ**明示的に失敗する**。
 * 3. importerはsnapshotの値を `updateGlobal` で書き、Payload sourceがそれを読み戻す。
 * 4. local sourceだけがlocal値（`lib/site.ts` / `data/articlePlacements.ts`）を読む。
 */
const PASSWORD = 'Str0ngPassw0rd!23';
const OWNER_EMAIL = 'site-settings-migration-owner@example.com';

describe('SiteSettings global schema (必須修正4-1)', () => {
  it('declares dataAsOf and articleIndexPlacementLimits.hero / .feature', async () => {
    const { SiteSettings } = await import('@/globals/SiteSettings');
    const byName = new Map(SiteSettings.fields.map((field) => [(field as { name?: string }).name, field]));

    expect(byName.has('dataAsOf')).toBe(true);
    expect((byName.get('dataAsOf') as { type?: string }).type).toBe('text');

    const limits = byName.get('articleIndexPlacementLimits') as
      | { type?: string; fields?: Array<{ name?: string; type?: string }> }
      | undefined;
    expect(limits?.type).toBe('group');
    expect(limits?.fields?.map((field) => `${field.name}:${field.type}`).sort()).toEqual([
      'feature:number',
      'hero:number',
    ]);
  });
});

describe('SiteSettings is the CMS source of truth (real Payload Local API)', () => {
  let payload: Payload;
  let owner: unknown;

  beforeAll(async () => {
    assertLocalThrowawayDatabase('tests/content/site-settings-migration.test.ts');
    payload = await getPayload({ config });

    // `readSnapshot()` は全 collection を map するので、他suiteが残したレコードがあると
    // siteSettings とは無関係な理由で落ちる。参照される側を後にして空にしてから始める。
    for (const collection of [
      'article-placements',
      'articles',
      'deployments',
      'use-cases',
      'distributors',
      'robots',
      'robot-series',
      'manufacturers',
      'media',
    ] as const) {
      await payload.delete({ collection, where: {}, overrideAccess: true });
    }
    await payload.delete({ collection: 'content-route-registry', where: {}, overrideAccess: true });
    await payload.delete({ collection: 'admins', where: {}, overrideAccess: true });
    await payload.create({
      collection: 'admins',
      overrideAccess: false,
      data: { email: OWNER_EMAIL, password: PASSWORD, role: 'content-reader' },
    });
    const login = await payload.login({ collection: 'admins', data: { email: OWNER_EMAIL, password: PASSWORD } });
    owner = login.user;
    if (!owner) throw new Error('failed to log in as the site-settings test owner');
  }, 120_000);

  afterAll(async () => {
    await payload?.destroy();
  });

  const writeGlobal = async (data: Record<string, unknown>) => {
    await payload.updateGlobal({
      slug: 'site-settings',
      overrideAccess: true,
      user: owner as never,
      data: data as never,
      context: privilegedPublishContext({
        runId: 'site-settings-migration-test',
        actorId: 'test',
        reason: 'site settings migration regression test',
      }),
    });
  };

  it('fails loudly instead of falling back to lib/site.ts when dataAsOf is missing (必須修正4-4)', async () => {
    await writeGlobal({ dataAsOf: null, articleIndexPlacementLimits: { hero: 5, feature: 2 } });

    // fallback が生きていると `{ dataAsOf: siteMeta.dataAsOf }` が返って例外にならない。
    const source = createPayloadContentSource({ payload });
    await expect(source.readSiteSettings()).rejects.toThrow(/site-settings-not-migrated.*dataAsOf/);
  }, 60_000);

  it('fails loudly instead of falling back to a local constant when the placement limits are missing', async () => {
    await writeGlobal({ dataAsOf: '2026年7月', articleIndexPlacementLimits: { hero: null, feature: null } });

    const source = createPayloadContentSource({ payload });
    await expect(source.readArticleIndexPlacementLimits()).rejects.toThrow(
      /site-settings-not-migrated.*articleIndexPlacementLimits/,
    );
  }, 60_000);

  it('reads the values actually stored in Payload, not the local ones (必須修正4-3/4-4)', async () => {
    await writeGlobal({
      dataAsOf: 'payload-only-value',
      articleIndexPlacementLimits: { hero: 11, feature: 7 },
    });

    const source = createPayloadContentSource({ payload });
    expect(await source.readSiteSettings()).toEqual({ dataAsOf: 'payload-only-value' });
    expect(await source.readArticleIndexPlacementLimits()).toEqual({ hero: 11, feature: 7 });

    // local source は local の値のまま（必須修正4-5）。
    const local = createLocalContentSource();
    expect(await local.readSiteSettings()).toEqual({ dataAsOf: siteMeta.dataAsOf });
    expect(await local.readArticleIndexPlacementLimits()).toEqual(localContentSnapshot.articleIndexPlacementLimits);
  }, 60_000);

  it('carries the Payload values into readSnapshot()', async () => {
    await writeGlobal({
      dataAsOf: 'snapshot-value',
      articleIndexPlacementLimits: { hero: 3, feature: 1 },
    });

    const snapshot = await createPayloadContentSource({ payload }).readSnapshot();
    expect(snapshot.siteSettings).toEqual({ dataAsOf: 'snapshot-value' });
    expect(snapshot.articleIndexPlacementLimits).toEqual({ hero: 3, feature: 1 });
  }, 120_000);
});
