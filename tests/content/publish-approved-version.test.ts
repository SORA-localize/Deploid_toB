import { getPayload, type Payload } from 'payload';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config from '../../payload.config';
import { computeCanonicalHash, publishApprovedVersion } from '../../lib/payload/publishApprovedVersion';
import { assertLocalThrowawayDatabase } from './testDbGuard';

const PASSWORD = 'Str0ngPassw0rd!23';

const COMPLETE_MANUFACTURER_DATA = {
  summary: 'Draft manufacturer used for publishApprovedVersion tests.',
  reliability: 'reported' as const,
  sources: [{ title: 'Official site', url: 'https://example.com', checkedAt: '2026-01-01', reliability: 'official' as const }],
  name: 'Approved Version Robotics',
  country: 'Japan',
  companyType: 'manufacturer' as const,
  japanPresence: 'office' as const,
  website: 'https://example.com',
  description: 'A manufacturer fixture used only by publish-approved-version.test.ts.',
};

describe('publishApprovedVersion (real Payload Local API)', () => {
  let payload: Payload;
  let publisherUser: { id: string | number; role?: string };
  let writerUser: { id: string | number; role?: string };

  beforeAll(async () => {
    assertLocalThrowawayDatabase('tests/content/publish-approved-version.test.ts');
    payload = await getPayload({ config });
    await payload.delete({ collection: 'manufacturers', where: {}, overrideAccess: true });
    await payload.delete({ collection: 'admins', where: {}, overrideAccess: true });

    const owner = await payload.create({
      collection: 'admins',
      overrideAccess: false,
      data: { email: 'approve-owner@example.com', password: PASSWORD, role: 'content-reader' },
    });
    writerUser = await payload.create({
      collection: 'admins',
      overrideAccess: false,
      user: owner,
      data: { email: 'approve-writer@example.com', password: PASSWORD, role: 'content-draft-writer' },
    });
    publisherUser = await payload.create({
      collection: 'admins',
      overrideAccess: false,
      user: owner,
      data: { email: 'approve-publisher@example.com', password: PASSWORD, role: 'content-publisher' },
    });
  });

  afterAll(async () => {
    await payload?.destroy();
  });

  it('publishes when the latest draft version matches the approval and hash', async () => {
    const draft = await payload.create({
      collection: 'manufacturers',
      overrideAccess: false,
      draft: true,
      user: writerUser,
      data: { stableId: 'approve-mfr-happy', slug: 'approve-mfr-happy', ...COMPLETE_MANUFACTURER_DATA },
    });

    const { docs: versions } = await payload.findVersions({
      collection: 'manufacturers',
      where: { parent: { equals: draft.id } },
      sort: '-createdAt',
      limit: 1,
      overrideAccess: true,
    });
    const latestVersion = versions[0];
    const approvalManifestHash = computeCanonicalHash((latestVersion as unknown as { version: Record<string, unknown> }).version);

    const result = await publishApprovedVersion({
      payload,
      collection: 'manufacturers',
      stableId: 'approve-mfr-happy',
      approvedVersionId: latestVersion.id,
      approvalManifestHash,
      publisherUser,
    });

    expect(result.documentId).toBe(draft.id);
    expect(result.canonicalHash).toBeTruthy();

    const published = await payload.findByID({ collection: 'manufacturers', id: draft.id, overrideAccess: true });
    expect(published._status).toBe('published');
    expect(published.name).toBe(COMPLETE_MANUFACTURER_DATA.name);
  });

  it('rejects when a newer draft was created after the approval (stale approval)', async () => {
    const draft = await payload.create({
      collection: 'manufacturers',
      overrideAccess: false,
      draft: true,
      user: writerUser,
      data: { stableId: 'approve-mfr-stale', slug: 'approve-mfr-stale', ...COMPLETE_MANUFACTURER_DATA },
    });

    const { docs: versions } = await payload.findVersions({
      collection: 'manufacturers',
      where: { parent: { equals: draft.id } },
      sort: '-createdAt',
      limit: 1,
      overrideAccess: true,
    });
    const approvedVersionId = versions[0].id;
    const approvalManifestHash = computeCanonicalHash((versions[0] as unknown as { version: Record<string, unknown> }).version);

    // 承認後に別draftを作る（statusだけの更新でも新versionが作られる）。
    await payload.update({
      collection: 'manufacturers',
      id: draft.id,
      overrideAccess: false,
      user: writerUser,
      data: { description: 'changed after approval, before publish' },
    });

    await expect(
      publishApprovedVersion({
        payload,
        collection: 'manufacturers',
        stableId: 'approve-mfr-stale',
        approvedVersionId,
        approvalManifestHash,
        publisherUser,
      }),
    ).rejects.toThrow(/publish-stale-approval/);
  });

  it('rejects when the approval manifest hash does not match the approved version content', async () => {
    const draft = await payload.create({
      collection: 'manufacturers',
      overrideAccess: false,
      draft: true,
      user: writerUser,
      data: { stableId: 'approve-mfr-hash-mismatch', slug: 'approve-mfr-hash-mismatch', ...COMPLETE_MANUFACTURER_DATA },
    });

    const { docs: versions } = await payload.findVersions({
      collection: 'manufacturers',
      where: { parent: { equals: draft.id } },
      sort: '-createdAt',
      limit: 1,
      overrideAccess: true,
    });

    await expect(
      publishApprovedVersion({
        payload,
        collection: 'manufacturers',
        stableId: 'approve-mfr-hash-mismatch',
        approvedVersionId: versions[0].id,
        approvalManifestHash: 'not-the-real-hash',
        publisherUser,
      }),
    ).rejects.toThrow(/publish-hash-mismatch/);
  });

  /**
   * 必須修正1-5（remediation group 1）: 最新version確認 → approval hash確認 → 公開update を
   * 同一transaction・同一排他制御の中で行い、「確認は通ったが、書き込む直前に別のversionが
   * 差し込まれた」というTOCTOUを塞ぐ。`onApprovalVerified` は**このTOCTOU回帰テスト専用**の
   * 差し込み口で、本番の呼び出し側は渡さない。
   */
  it('rejects a version created after the approval check but before the publish write (TOCTOU)', async () => {
    const draft = await payload.create({
      collection: 'manufacturers',
      overrideAccess: false,
      draft: true,
      user: writerUser,
      data: { stableId: 'approve-mfr-toctou', slug: 'approve-mfr-toctou', ...COMPLETE_MANUFACTURER_DATA },
    });

    const { docs: versions } = await payload.findVersions({
      collection: 'manufacturers',
      where: { parent: { equals: draft.id } },
      sort: '-createdAt',
      limit: 1,
      overrideAccess: true,
    });
    const approvedVersionId = versions[0].id;
    const approvalManifestHash = computeCanonicalHash(
      (versions[0] as unknown as { version: Record<string, unknown> }).version,
    );

    let interleaved = false;
    await expect(
      publishApprovedVersion({
        payload,
        collection: 'manufacturers',
        stableId: 'approve-mfr-toctou',
        approvedVersionId,
        approvalManifestHash,
        publisherUser,
        onApprovalVerified: async () => {
          // 承認確認の後、公開updateの前に、別transactionから新しいdraft versionを作る。
          await payload.update({
            collection: 'manufacturers',
            id: draft.id,
            overrideAccess: false,
            draft: true,
            user: writerUser,
            data: { description: 'raced in between the approval check and the publish write' },
          });
          interleaved = true;
        },
      }),
    ).rejects.toThrow(/publish-stale-approval/);

    expect(interleaved).toBe(true);

    // 競合を検出した以上、公開してはいけない（transactionごとrollback）。
    const doc = await payload.findByID({ collection: 'manufacturers', id: draft.id, overrideAccess: true });
    expect(doc._status).toBe('draft');
  });

  it('rejects when the caller is not a publisher', async () => {
    const draft = await payload.create({
      collection: 'manufacturers',
      overrideAccess: false,
      draft: true,
      user: writerUser,
      data: { stableId: 'approve-mfr-role-guard', slug: 'approve-mfr-role-guard', ...COMPLETE_MANUFACTURER_DATA },
    });

    const { docs: versions } = await payload.findVersions({
      collection: 'manufacturers',
      where: { parent: { equals: draft.id } },
      sort: '-createdAt',
      limit: 1,
      overrideAccess: true,
    });
    const approvalManifestHash = computeCanonicalHash((versions[0] as unknown as { version: Record<string, unknown> }).version);

    await expect(
      publishApprovedVersion({
        payload,
        collection: 'manufacturers',
        stableId: 'approve-mfr-role-guard',
        approvedVersionId: versions[0].id,
        approvalManifestHash,
        publisherUser: writerUser,
      }),
    ).rejects.toThrow(/publish-role-required/);
  });
});
