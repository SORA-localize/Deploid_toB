import { getPayload, type Payload } from 'payload';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config from '../../payload.config';
import {
  contentVersionsConfig,
  isAuditArchiveFullyConfigured,
  resolveVersionRetention,
} from '../../lib/payload/access';
import { assertLocalThrowawayDatabase } from './testDbGuard';

/**
 * remediation group 1 / 必須修正3 の回帰テスト。
 *
 * 監査の指摘: `exportVersionsToAuditArchive()` は常に `false` を返す（署名済み private archive が
 * 未配線）のに、`versions.maxPerDoc: 50` のままPayloadのpruneを許していた。50版に達した
 * documentは、archiveされないまま古いversionが**実際に削除される**（`saveVersion` →
 * `enforceMaxVersions`）。最低180日保持を満たせない件数ベースのmaxPerDoc運用は行わず、
 * 署名済みarchiveが完成するまで自動pruneを無効化する。
 */
const PASSWORD = 'Str0ngPassw0rd!23';

describe('Version retention is fail-closed while the signed audit archive is unavailable', () => {
  let payload: Payload;
  let owner: { id: string | number };

  beforeAll(async () => {
    assertLocalThrowawayDatabase('tests/content/version-retention.test.ts');
    payload = await getPayload({ config });
    await payload.delete({ collection: 'manufacturers', where: {}, overrideAccess: true });
    await payload.delete({ collection: 'admins', where: {}, overrideAccess: true });
    owner = await payload.create({
      collection: 'admins',
      overrideAccess: false,
      data: { email: 'retention-owner@example.com', password: PASSWORD, role: 'content-reader' },
    });
  }, 120_000);

  afterAll(async () => {
    await payload?.destroy();
  });

  it('keeps automatic pruning disabled because the audit archive is not configured', () => {
    expect(isAuditArchiveFullyConfigured({})).toBe(false);
    // maxPerDoc 0 = Payloadのprune無効（`saveVersion.js` の `max > 0` ガード）。
    expect(contentVersionsConfig.maxPerDoc).toBe(0);
  });

  it('refuses to enable pruning even when a prune limit is explicitly requested, if the archive is missing', () => {
    const resolved = resolveVersionRetention({ CONTENT_VERSION_PRUNE_MAX_PER_DOC: '50' });
    expect(resolved.pruningEnabled).toBe(false);
    expect(resolved.maxPerDoc).toBe(0);
    expect(resolved.reason).toMatch(/audit-archive/);
  });

  it('enables pruning only when archive, signing, storage and verification are all wired', () => {
    const resolved = resolveVersionRetention({
      CONTENT_VERSION_PRUNE_MAX_PER_DOC: '50',
      PREVIEW_AUDIT_BLOB_TOKEN_STORE_ID: 'store_preview',
      AUDIT_ARCHIVE_SIGNING_KMS_KEY_ID: 'arn:aws:kms:ap-northeast-1:000000000000:key/fake',
      AUDIT_ARCHIVE_VERIFICATION_ENABLED: 'true',
    });
    expect(resolved.pruningEnabled).toBe(true);
    expect(resolved.maxPerDoc).toBe(50);
  });

  it('retains more than 50 versions of a single document when the archive is unavailable', async () => {
    const draft = await payload.create({
      collection: 'manufacturers',
      overrideAccess: false,
      draft: true,
      user: owner,
      data: { stableId: 'retention-mfr', slug: 'retention-mfr', name: 'Retention Robotics' },
    });

    // create で1版、以降のupdateごとに1版。合計 55 版まで積む。
    const TARGET_VERSIONS = 55;
    for (let i = 1; i < TARGET_VERSIONS; i += 1) {
      await payload.update({
        collection: 'manufacturers',
        id: draft.id,
        overrideAccess: false,
        draft: true,
        user: owner,
        data: { description: `revision ${i}` },
      });
    }

    const { totalDocs } = await payload.countVersions({
      collection: 'manufacturers',
      where: { parent: { equals: draft.id } },
      overrideAccess: true,
    });
    expect(totalDocs).toBe(TARGET_VERSIONS);

    // 最古のversion（revision 1 より前、= createの版）が失われていないこと。
    const { docs: oldest } = await payload.findVersions({
      collection: 'manufacturers',
      where: { parent: { equals: draft.id } },
      sort: 'updatedAt',
      limit: 1,
      overrideAccess: true,
      depth: 0,
    });
    expect(oldest).toHaveLength(1);
    const oldestVersion = (oldest[0] as unknown as { version: Record<string, unknown> }).version;
    expect(oldestVersion.description ?? null).toBeNull();

    // revision 1 も残っている（件数ベースのpruneが起きていれば真っ先に消える範囲）。
    const { totalDocs: earlyRevisions } = await payload.countVersions({
      collection: 'manufacturers',
      where: { and: [{ parent: { equals: draft.id } }, { 'version.description': { equals: 'revision 1' } }] },
      overrideAccess: true,
    });
    expect(earlyRevisions).toBe(1);
  }, 180_000);
});
