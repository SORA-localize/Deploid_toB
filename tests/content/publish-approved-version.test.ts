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
          // 承認確認の後、公開updateの前に、新しいversionを**hookもlockも通らない経路**
          // （adapter直叩き）で差し込む。通常のupdate経路は publish gate が同じdocument lockを
          // 取るので、そもそもここへ割り込めない（それは別テストで確認している）。
          // ここで確認したいのは、その排他制御をすり抜けてversionが増えた場合でも、
          // 書き込み直前の再検証が競合を検出して公開を止める（多層防御）ということ。
          await payload.db.createVersion({
            collectionSlug: 'manufacturers',
            parent: draft.id,
            autosave: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            versionData: {
              ...(versions[0] as unknown as { version: Record<string, unknown> }).version,
              description: 'raced in between the approval check and the publish write',
            } as never,
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

  /**
   * 必須修正1-5 は「TOCTOUを**なくす**」を要求している。承認確認と公開updateを同一transaction
   * に入れ、承認済みversionがchain headであることを直前に再検証するだけでは、
   * **publish同士**しか直列化されない（advisory lockをpublish側しか取らないため）。draft保存は
   * lockを取らずに割り込め、再検証と書き込みの間でcommitされうる。
   *
   * このテストは「割り込もうとしたdraft保存が実際にblockされる」ことを直接確かめる:
   * publishのtransactionが生きている間、同じdocumentへのdraft保存はsettleしない。
   */
  it('serializes a draft save that races an approved publish, instead of letting it interleave', async () => {
    const draft = await payload.create({
      collection: 'manufacturers',
      overrideAccess: false,
      draft: true,
      user: writerUser,
      data: { stableId: 'approve-mfr-race', slug: 'approve-mfr-race', ...COMPLETE_MANUFACTURER_DATA },
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

    let racingDraftSave: Promise<unknown> | undefined;
    let racingSettled = false;

    const result = await publishApprovedVersion({
      payload,
      collection: 'manufacturers',
      stableId: 'approve-mfr-race',
      approvedVersionId,
      approvalManifestHash,
      publisherUser,
      onApprovalVerified: async () => {
        // 別transactionからのdraft保存を開始する（awaitしない）。
        racingDraftSave = payload
          .update({
            collection: 'manufacturers',
            id: draft.id,
            overrideAccess: false,
            draft: true,
            user: writerUser,
            data: { description: 'draft save racing the publish' },
          })
          .then(
            (value) => {
              racingSettled = true;
              return value;
            },
            (error) => {
              racingSettled = true;
              throw error;
            },
          );

        // publishのtransactionがlockを握っている間、この書き込みは進めないはず。
        // 修正前は数十msで完了してしまう（= 割り込みが成立する）。
        await new Promise((resolve) => setTimeout(resolve, 500));
        expect(racingSettled).toBe(false);
      },
    });

    expect(result.documentId).toBe(draft.id);

    // publishのtransactionがcommitしlockが解けたので、ここで初めて進む。
    await racingDraftSave;
    expect(racingSettled).toBe(true);

    // 公開されたmain rowは承認された内容のまま。割り込んだdraftはmain rowへ入っていない。
    const mainRow = await payload.findByID({ collection: 'manufacturers', id: draft.id, overrideAccess: true });
    expect(mainRow._status).toBe('published');
    expect(mainRow.description).toBe(COMPLETE_MANUFACTURER_DATA.description);
  }, 60_000);

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
