import type { PayloadRequest } from 'payload';
import { describe, expect, it, vi } from 'vitest';
import {
  approvedPublishContext,
  privilegedPublishContext,
  readApprovedPublishAuthorization,
  readPrivilegedPublishAuthorization,
} from '@/lib/payload/publishAuthorization';

const requestWith = (context: Record<string, unknown>): PayloadRequest => ({ context }) as PayloadRequest;

describe('publish authorization capabilities', () => {
  it('accepts the exact approved authorization object issued for the operation', () => {
    const context = approvedPublishContext({
      collection: 'robots',
      documentId: '42',
      approvedVersionId: '9',
      approvalManifestHash: 'a'.repeat(64),
      actorId: 'publisher-1',
    });
    expect(readApprovedPublishAuthorization(requestWith(context), 'robots', '42')).toMatchObject({
      approvedVersionId: '9',
    });
  });

  it('rejects a structurally identical copy of an approved authorization', () => {
    const copied = structuredClone(
      approvedPublishContext({
        collection: 'robots',
        documentId: '42',
        approvedVersionId: '9',
        approvalManifestHash: 'a'.repeat(64),
        actorId: 'publisher-1',
      }),
    );
    expect(readApprovedPublishAuthorization(requestWith(copied), 'robots', '42')).toBeNull();
  });

  it('rejects a structurally identical copy of a privileged authorization', () => {
    const copied = structuredClone(
      privilegedPublishContext({
        runId: 'restore-1',
        actorId: 'admin-1',
        reason: 'verified baseline restore',
        collections: ['robots'],
      }),
    );
    expect(readPrivilegedPublishAuthorization(requestWith(copied), 'robots')).toBeNull();
  });
});

/**
 * 2026-09-03、admin公開UIのe2e（`tests/e2e/payload-admin-publish.spec.ts`）が
 * **実ビルドしたNextサーバー上でのみ**再現する不具合を出した。公開が
 * `publish-approval-required` で必ず失敗する。
 *
 * 計測結果（`readApprovedPublishAuthorization` に一時的な計装を入れて実測）:
 *
 * ```
 * [issue]        moduleInstance: 1, documentId: '1'
 * [readApproved] moduleInstance: 2, hasValue: true, inWeakSet: false,
 *                valueCollection: 'manufacturers' === wantCollection,
 *                valueDocId: '1' === wantDocId
 * ```
 *
 * collectionもdocument idも一致しており、context自体も届いている。**WeakSetだけが別物**
 * だった —— Next.jsが `publishAuthorization` をサーバー側で2つのchunkへ重複して束ねるため、
 * `approvedPublishContext()` を実行したmodule instanceと、collection hookが
 * `readApprovedPublishAuthorization()` を呼ぶmodule instanceが違う。
 *
 * それまでこれが表面化しなかったのは、`publishApprovedVersion()` の呼び出し元が
 * CLI script（単一process・単一module graph）とvitest（同上）しか無かったため。
 * Nextサーバーの中で公開を実行したのはこのe2eが初めてだった。
 *
 * `vi.resetModules()` + 2回のdynamic importは、この「同じfileから2つのmodule instanceが
 * 生まれる」状況をそのまま再現する。registryがmodule scopeにある実装ではこのテストは落ちる。
 */
describe('module instanceをまたいでも認可が成立すること', () => {
  async function freshModule() {
    vi.resetModules();
    return import('@/lib/payload/publishAuthorization');
  }

  it('別instanceが発行した承認contextを、こちらのinstanceが認める', async () => {
    const issuer = await freshModule();
    const verifier = await freshModule();
    expect(issuer).not.toBe(verifier);

    const context = issuer.approvedPublishContext({
      collection: 'robots',
      documentId: '42',
      approvedVersionId: '9',
      approvalManifestHash: 'a'.repeat(64),
      actorId: 'publisher-1',
    });

    expect(
      verifier.readApprovedPublishAuthorization(requestWith(context), 'robots', '42'),
    ).toMatchObject({ approvedVersionId: '9' });
  });

  it('別instanceでも、自己申告のcopyは依然として拒否する（同一性の保証を落としていない）', async () => {
    const issuer = await freshModule();
    const verifier = await freshModule();

    const copied = structuredClone(
      issuer.approvedPublishContext({
        collection: 'robots',
        documentId: '42',
        approvedVersionId: '9',
        approvalManifestHash: 'a'.repeat(64),
        actorId: 'publisher-1',
      }),
    );

    expect(verifier.readApprovedPublishAuthorization(requestWith(copied), 'robots', '42')).toBeNull();
  });

  it('privileged側も同じ性質を持つ', async () => {
    const issuer = await freshModule();
    const verifier = await freshModule();

    const context = issuer.privilegedPublishContext({
      runId: 'run-1',
      actorId: 'importer',
      reason: 'restore',
    });

    expect(verifier.readPrivilegedPublishAuthorization(requestWith(context), 'robots')).toMatchObject({
      runId: 'run-1',
    });
    expect(
      verifier.readPrivilegedPublishAuthorization(requestWith(structuredClone(context)), 'robots'),
    ).toBeNull();
  });
});
