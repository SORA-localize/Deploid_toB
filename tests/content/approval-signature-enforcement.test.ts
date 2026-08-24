import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  collectMediaReviewItems,
  evaluateMediaReviewGate,
  mediaReviewDigest,
  type MediaReviewWaiver,
} from '@/scripts/compare-content-sources.mts';
import { cosignAvailable, sha256Hex, signJsonDocument } from '@/scripts/export-content-snapshot.mts';
import { deriveMediaFromSnapshot } from '@/scripts/import-content-to-payload.mts';
import {
  loadApprovedIdentityTransfers,
  type IdentityTransfer,
  type IdentityTransferDocument,
} from '@/scripts/verify-content-conservation.mts';
import { contentSnapshotFixture } from '@/tests/fixtures/contentSnapshot';

/**
 * review fix round 1 / Important #4。
 *
 * レビュー指摘: 必須修正10-7 と 8-6 の負テストは、**実際に enforce する gate を通っていなかった**。
 * - identity transfer: 裸の配列が弾かれることしか見ておらず、「外形は正しいが署名が偽造/不正な
 *   文書」が cosign で拒否されることも、`baselineRunId` 再利用が拒否されることも未検証だった。
 * - media waiver: gate テストが `signatureVerified` を boolean リテラルで注入しており、
 *   ファイルを読んで cosign 検証する `evaluateMediaReviewGate()` が一度も実行されていなかった。
 *
 * ここでは**実 AWS KMS + 実 cosign** で署名した本物のファイルと、偽造したファイルの両方を、
 * 実際の読み込み経路へ通す。
 */

const canSignForReal = cosignAvailable() && Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

const APPROVED_TRANSFER: IdentityTransfer = {
  collection: 'robots',
  from: 'fixture-robot-archived',
  to: 'fixture-robot-merged',
  approvedBy: 'Hori98',
  approvedAt: '2026-08-15',
  reason: 'merged into the successor record',
};

const BASELINE_RUN_ID = 'baseline-2026-08-15T00:00:00.000Z-approval-test';

describe.skipIf(!canSignForReal)('identity transfer approvals are enforced by a real signature (必須修正10-5 / 10-6 / 10-7)', () => {
  const writeJson = async (dir: string, name: string, value: unknown) => {
    const filePath = path.join(dir, name);
    await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    return filePath;
  };

  it('accepts a genuinely signed approval bound to this baseline', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-transfer-'));
    try {
      const document: IdentityTransferDocument = { baselineRunId: BASELINE_RUN_ID, transfers: [APPROVED_TRANSFER] };
      const filePath = await writeJson(dir, 'approved.json', await signJsonDocument(document));

      const loaded = await loadApprovedIdentityTransfers({ path: filePath, baselineRunId: BASELINE_RUN_ID });
      expect('transfers' in loaded && loaded.transfers).toEqual([APPROVED_TRANSFER]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 180_000);

  /**
   * **これが必須修正10-7 の本体。** 「承認しました」と書いただけの、外形は正しい文書。
   * `assertValidSignedJsonDocument` は通るので、止まるのは cosign 検証でなければならない。
   */
  it('refuses a self-attested document whose signature block is fabricated', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-transfer-'));
    try {
      const filePath = await writeJson(dir, 'fabricated.json', {
        document: { baselineRunId: BASELINE_RUN_ID, transfers: [APPROVED_TRANSFER] },
        signature: { algorithm: 'cosign', keyId: 'arn:aws:kms:ap-northeast-1:1:key/made-up', bundleBase64: 'AA==' },
      });

      const loaded = await loadApprovedIdentityTransfers({ path: filePath, baselineRunId: BASELINE_RUN_ID });
      expect('failure' in loaded).toBe(true);
      if ('failure' in loaded) expect(loaded.failure.check).toBe('identityTransferSignature');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 180_000);

  /** 正規に署名した文書の中身を後から書き換えたもの（署名は本物、対象が違う）。 */
  it('refuses an approval whose transfers were edited after signing', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-transfer-'));
    try {
      const signed = await signJsonDocument<IdentityTransferDocument>({
        baselineRunId: BASELINE_RUN_ID,
        transfers: [APPROVED_TRANSFER],
      });
      signed.document.transfers[0].to = 'fixture-robot-attacker-controlled';
      const filePath = await writeJson(dir, 'edited.json', signed);

      const loaded = await loadApprovedIdentityTransfers({ path: filePath, baselineRunId: BASELINE_RUN_ID });
      expect('failure' in loaded).toBe(true);
      if ('failure' in loaded) expect(loaded.failure.check).toBe('identityTransferSignature');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 180_000);

  /** 別の baseline のために出された承認を、この run へ流用できない。 */
  it('refuses a genuinely signed approval issued for a different baseline', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-transfer-'));
    try {
      const filePath = await writeJson(
        dir,
        'other-baseline.json',
        await signJsonDocument<IdentityTransferDocument>({
          baselineRunId: 'baseline-2026-01-01T00:00:00.000Z-some-other-run',
          transfers: [APPROVED_TRANSFER],
        }),
      );

      const loaded = await loadApprovedIdentityTransfers({ path: filePath, baselineRunId: BASELINE_RUN_ID });
      expect('failure' in loaded).toBe(true);
      if ('failure' in loaded) {
        expect(loaded.failure.check).toBe('identityTransferBaseline');
        expect(loaded.failure.detail).toMatch(/some-other-run/);
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 180_000);

  /** 署名は本物でも、中身が厳密検証（必須修正10-1〜10-4）を通らなければ拒否。 */
  it('refuses a signed approval whose transfers are structurally invalid', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-transfer-'));
    try {
      const filePath = await writeJson(
        dir,
        'invalid.json',
        await signJsonDocument({
          baselineRunId: BASELINE_RUN_ID,
          transfers: [{ ...APPROVED_TRANSFER, approvedAt: 'approved verbally' }],
        }),
      );

      const loaded = await loadApprovedIdentityTransfers({ path: filePath, baselineRunId: BASELINE_RUN_ID });
      expect('failure' in loaded).toBe(true);
      if ('failure' in loaded) expect(loaded.failure.check).toBe('identityTransfers');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 180_000);

  it('refuses a bare array of self-attested transfers', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-transfer-'));
    try {
      const filePath = await writeJson(dir, 'bare.json', [APPROVED_TRANSFER]);
      const loaded = await loadApprovedIdentityTransfers({ path: filePath, baselineRunId: BASELINE_RUN_ID });
      expect('failure' in loaded).toBe(true);
      if ('failure' in loaded) {
        expect(loaded.failure.check).toBe('identityTransferSignature');
        expect(loaded.failure.detail).toMatch(/self-attested/);
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 180_000);
});

describe.skipIf(!canSignForReal)('media review waivers are enforced by a real signature (必須修正8-6)', () => {
  const items = collectMediaReviewItems(deriveMediaFromSnapshot(contentSnapshotFixture));

  const waiverFor = (digest: string): MediaReviewWaiver => ({
    mediaReviewSha256: digest,
    waivedBy: 'Hori98',
    waivedAt: '2026-08-15',
    reason: 'rights follow-up tracked separately',
  });

  it('accepts a genuinely signed waiver bound to exactly these review items', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-waiver-'));
    try {
      const digest = mediaReviewDigest(items, sha256Hex);
      const filePath = path.join(dir, 'waiver.json');
      await writeFile(filePath, JSON.stringify(await signJsonDocument(waiverFor(digest)), null, 2), 'utf8');

      expect(await evaluateMediaReviewGate(items, filePath)).toEqual({ ok: true, failures: [] });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 180_000);

  /** 外形は正しいが署名が偽物の waiver。cosign 検証でしか止まらない。 */
  it('refuses a waiver whose signature block is fabricated', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-waiver-'));
    try {
      const filePath = path.join(dir, 'fabricated.json');
      await writeFile(
        filePath,
        JSON.stringify({
          document: waiverFor(mediaReviewDigest(items, sha256Hex)),
          signature: { algorithm: 'cosign', keyId: 'made-up', bundleBase64: 'AA==' },
        }),
        'utf8',
      );

      const gate = await evaluateMediaReviewGate(items, filePath);
      expect(gate.ok).toBe(false);
      expect(gate.failures[0].check).toBe('mediaWaiverSignature');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 180_000);

  /** 承認したあとに要確認項目が増えた場合（digest が変わる）。署名は本物のまま。 */
  it('refuses a genuinely signed waiver once the review items change', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-waiver-'));
    try {
      const filePath = path.join(dir, 'stale.json');
      await writeFile(
        filePath,
        JSON.stringify(await signJsonDocument(waiverFor(mediaReviewDigest(items, sha256Hex)))),
        'utf8',
      );

      const moreItems = [
        ...items,
        {
          kind: 'unhostable-image' as const,
          stableId: 'media:https://cdn.example.com/newly-added.jpg',
          src: 'https://cdn.example.com/newly-added.jpg',
          detail: 'external-image-rights-not-auto-hostable (rights.status=blocked)',
          usedBy: ['robots/fixture-robot-a.images.side'],
        },
      ];

      const gate = await evaluateMediaReviewGate(moreItems, filePath);
      expect(gate.ok).toBe(false);
      expect(gate.failures[0].check).toBe('mediaWaiverDigest');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 180_000);

  it('refuses a waiver file that is not a signed document at all', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-waiver-'));
    try {
      const filePath = path.join(dir, 'plain.json');
      await writeFile(filePath, JSON.stringify(waiverFor(mediaReviewDigest(items, sha256Hex))), 'utf8');

      const gate = await evaluateMediaReviewGate(items, filePath);
      expect(gate.ok).toBe(false);
      expect(gate.failures[0].check).toBe('mediaWaiverSchema');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 180_000);

  it('still fails closed when no waiver is supplied at all', async () => {
    const gate = await evaluateMediaReviewGate(items, undefined);
    expect(gate.ok).toBe(false);
    expect(gate.failures[0].check).toBe('mediaReview');
  }, 60_000);
});
