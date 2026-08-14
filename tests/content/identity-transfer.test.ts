import { describe, expect, it } from 'vitest';
import type { ContentSnapshot } from '@/lib/content/contracts';
import {
  IdentityTransferError,
  isStrictApprovalDate,
  parseIdentityTransferDocument,
  parseIdentityTransfers,
  verifyStableIdConservation,
  type IdentityTransfer,
} from '@/scripts/verify-content-conservation.mts';
import { contentSnapshotFixture } from '@/tests/fixtures/contentSnapshot';

/**
 * 必須修正10（remediation group 3）の負テスト。
 *
 * 監査の指摘（コントローラーが実コードで確認済み）:
 * > `assertValidIdentityTransfers` は各 field が非空文字列であることしか検査しない。
 * > `collection` が実在するか、`approvedAt` が有効な日付か、`from !== to` か、重複 entry があるか、
 * > chain/cycle があるかを一切見ていない。`approvedBy` は任意の文字列で「承認」を主張できる。
 */

const APPROVED: IdentityTransfer = {
  collection: 'robots',
  from: 'fixture-robot-archived',
  to: 'fixture-robot-merged',
  approvedBy: 'Hori98',
  approvedAt: '2026-08-12',
  reason: 'merged into the successor record',
};

const clone = (snapshot: ContentSnapshot): ContentSnapshot => structuredClone(snapshot);

describe('identity transfer strict validation (必須修正10-1 / 10-2 / 10-3)', () => {
  it('accepts a well-formed approved transfer', () => {
    expect(parseIdentityTransfers([APPROVED])).toEqual([APPROVED]);
  });

  it('rejects a collection that does not exist', () => {
    expect(() => parseIdentityTransfers([{ ...APPROVED, collection: 'spaceships' }])).toThrow(/unknown collection/);
  });

  it('rejects an unknown field instead of silently dropping it', () => {
    expect(() => parseIdentityTransfers([{ ...APPROVED, approvedByManager: 'someone' }])).toThrow(/unknown field/);
  });

  it('rejects approvedAt values that are not real dates', () => {
    for (const approvedAt of ['yesterday', '2026-13-01', '2026-02-31', '2026-08', '', 'soon']) {
      expect(() => parseIdentityTransfers([{ ...APPROVED, approvedAt }]), approvedAt).toThrow(
        /identity-transfers-invalid/,
      );
    }
    expect(isStrictApprovalDate('2026-08-12')).toBe(true);
    expect(isStrictApprovalDate('2026-08-12T09:00:00.000Z')).toBe(true);
    expect(isStrictApprovalDate('2026-02-30')).toBe(false);
  });

  it('rejects a transfer from an id to itself', () => {
    expect(() => parseIdentityTransfers([{ ...APPROVED, to: APPROVED.from }])).toThrow(/from and to are the same/);
  });

  /**
   * 必須修正10-4: 以前は `transferIndex` が Map だったため、同じ `from` の2件目が黙って
   * 1件目を上書きしていた。「承認された宛先」と「実際に適用される宛先」が食い違う。
   */
  it('rejects duplicate transfers for the same id instead of letting the later one win', () => {
    const duplicate = { ...APPROVED, to: 'fixture-robot-somewhere-else' };
    expect(() => parseIdentityTransfers([APPROVED, duplicate])).toThrow(/duplicate transfer/);
  });

  it('rejects two transfers that collapse into the same target id', () => {
    const other = { ...APPROVED, from: 'fixture-robot-draft' };
    expect(() => parseIdentityTransfers([APPROVED, other])).toThrow(/target the same id/);
  });

  it('rejects chains and cycles', () => {
    const chain = { ...APPROVED, from: APPROVED.to, to: 'fixture-robot-third' };
    expect(() => parseIdentityTransfers([APPROVED, chain])).toThrow(/chains into another transfer/);

    const cycle = { ...APPROVED, from: APPROVED.to, to: APPROVED.from };
    expect(() => parseIdentityTransfers([APPROVED, cycle])).toThrow(/identity-transfers-invalid/);
  });

  it('rejects a stable id that moves across collections', () => {
    const crossing: IdentityTransfer = {
      collection: 'articles',
      from: 'shared-id',
      to: 'fixture-article-new',
      approvedBy: 'Hori98',
      approvedAt: '2026-08-12',
      reason: 'x',
    };
    const intoRobots: IdentityTransfer = {
      collection: 'robots',
      from: 'fixture-robot-archived',
      to: 'shared-id',
      approvedBy: 'Hori98',
      approvedAt: '2026-08-12',
      reason: 'x',
    };
    expect(() => parseIdentityTransfers([crossing, intoRobots])).toThrow(/Identity never moves across collections/);
  });

  it('collects every problem rather than stopping at the first', () => {
    try {
      parseIdentityTransfers([{ ...APPROVED, collection: 'spaceships', approvedAt: 'whenever' }]);
      throw new Error('expected a rejection');
    } catch (error) {
      expect(error).toBeInstanceOf(IdentityTransferError);
      expect((error as IdentityTransferError).problems.length).toBeGreaterThan(1);
    }
  });
});

describe('identity transfer document (必須修正10-5 / 10-6)', () => {
  it('rejects a bare array — a self-attested list is not an approval', () => {
    expect(() => parseIdentityTransferDocument([APPROVED])).toThrow(/self-attested claim, not an approval/);
  });

  it('requires the baseline the approval was issued for', () => {
    expect(() => parseIdentityTransferDocument({ transfers: [APPROVED] })).toThrow(/baselineRunId is required/);
  });

  it('accepts a document bound to one baseline', () => {
    const document = parseIdentityTransferDocument({ baselineRunId: 'baseline-x', transfers: [APPROVED] });
    expect(document).toEqual({ baselineRunId: 'baseline-x', transfers: [APPROVED] });
  });
});

describe('stable-id conservation with transfers (必須修正10-4 / 10-7)', () => {
  const baseline = contentSnapshotFixture;

  it('still accepts a single approved transfer', () => {
    const current = clone(baseline);
    current.robots[1].id = 'fixture-robot-merged';
    expect(verifyStableIdConservation(baseline, current, [APPROVED])).toMatchObject({ ok: true, appliedTransfers: 1 });
  });

  /**
   * 必須修正10-7: **自己申告 JSON だけで消失 stable ID を保全済みにできない。**
   *
   * 「承認」を主張する transfer が壊れている（重複・chain・偽の日付など）場合、
   * 保全判定そのものが成立しない。以前は重複が黙って上書きされ、`ok: true` が返っていた。
   */
  it('refuses to conserve anything when the transfer list is not a valid approval record', () => {
    const current = clone(baseline);
    current.robots[1].id = 'fixture-robot-merged';

    // 攻撃者が「本当の宛先」と「後から書き足した宛先」を並べた場合。
    const duplicated = [APPROVED, { ...APPROVED, to: 'fixture-robot-merged-2' }];
    expect(() => verifyStableIdConservation(baseline, current, duplicated)).toThrow(/duplicate transfer/);

    // 日付でない approvedAt を持つ「承認」。
    expect(() =>
      verifyStableIdConservation(baseline, current, [{ ...APPROVED, approvedAt: 'approved verbally' }]),
    ).toThrow(/identity-transfers-invalid/);
  });

  it('still reports a lost id when the approved target does not exist either', () => {
    const current = clone(baseline);
    current.robots.splice(1, 1);
    const result = verifyStableIdConservation(baseline, current, [APPROVED]);
    expect(result.ok).toBe(false);
    expect(result.violations[0]).toMatchObject({ reason: 'transfer-target-missing' });
  });
});
