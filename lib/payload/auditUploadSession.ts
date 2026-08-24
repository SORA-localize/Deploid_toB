import { randomBytes, createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Payload } from 'payload';
import {
  assertValidEnvelope,
  canonicalJson,
  sha256Hex,
  verifyBlobWithCosign,
  verifyManifestSignature,
  withTempDir,
  type SignedBaselineEnvelope,
} from '../../scripts/export-content-snapshot.mts';
import type { MediaInventoryEntry, SnapshotObjectStore, VercelBlobStoreOptions } from '../../scripts/snapshotObjectStore.mts';
import { auditBlobStoreIdFor } from '../../scripts/restore-preflight.mts';
import {
  baselineCompletionMarkerKey,
  checkBlobStoreSelection,
  createVercelBlobObjectStore,
  isAllowedAuditBaselineObjectKey,
  resolveBlobCredential,
  type BaselineCompletionMarker,
} from '../../scripts/snapshotObjectStore.mts';

/**
 * `docs/reference/task9-audit-upload-endpoint-design-v1.md`「Endpoint設計」の3段階session flow
 * の実装本体。route handler（`src/app/api/admin/audit-upload/**`）はこのモジュールへの薄い
 * glueだけを持ち、業務ロジックはここに置く（このrepoの他のscriptと同じ分離）。
 */

const SESSION_TTL_MINUTES = 30;

/**
 * テスト用の差し替え口。`deploid-audit-*`はOIDC-federatedで実Vercel Function runtimeからしか
 * 到達できない（`docs/reference/task9-audit-upload-endpoint-design-v1.md`「背景」）ため、単体
 * テストでは`createVercelBlobObjectStore`本体を実行できない。`export-content-snapshot.mts`の
 * `dependencies.verifyManifest ?? verifyManifestSignature`と同じ、このrepo既存のinjectable
 * dependencyパターンに倣う。
 */
export type BlobStoreFactory = (options: VercelBlobStoreOptions) => SnapshotObjectStore;

/**
 * `verifyManifestSignature()`（`export-content-snapshot.mts`、無変更）は`execFileSync('cosign', ...)`
 * を**bare command nameで**呼ぶ。Vercel Function runtimeにはcosignがPATH上に無いので、
 * build時に取得・同梱したbinary（`.cosign-bin/cosign`、`outputFileTracingIncludes`で
 * このrouteのFunctionへ含める）のディレクトリをPATHへ追加する。`execFileSync`はcommand名に
 * path区切りが無い場合PATHを検索する（Node/OSの標準挙動）ため、**署名検証コード自体は
 * 一切変更しない**——呼び出し環境のPATHだけを整える。
 */
let cosignPathEnsured = false;
export function ensureCosignOnPath(): void {
  if (cosignPathEnsured) return;
  const cosignBinDir = path.join(process.cwd(), '.cosign-bin');
  process.env.PATH = process.env.PATH ? `${cosignBinDir}:${process.env.PATH}` : cosignBinDir;
  cosignPathEnsured = true;
}

export interface AllowedObjectRecord {
  objectKey: string;
  /** signature bundle entryだけnull（manifestに事前宣言されたsha256が無いため）。 */
  sha256: string | null;
  size: number | null;
  uploaded: boolean;
  /** media entryだけ設定する。`mediaInventorySha256`を既存exporterと同じ方式で再計算するために要る。 */
  stableId: string | null;
  filename: string | null;
  mimeType: string | null;
}

export type AuditUploadSessionFailureReason =
  | 'malformed-envelope'
  | 'signature-invalid'
  | 'store-selection-refused'
  | 'internal-error';

export type CreateSessionResult =
  | { ok: true; sessionId: string; expiresAt: string; environment: 'preview' | 'production' }
  | { ok: false; reason: AuditUploadSessionFailureReason; detail: string };

/**
 * Step 1。**署名検証に成功した場合にしか行を作らない**（実装時の追加必須事項）。
 * 許可object一覧はここで検証済み`manifest`だけから機械的に導く——bodyの他のどの値も信用しない。
 */
export async function createAuditUploadSession(args: {
  payload: Payload;
  rawBody: unknown;
  requestId: string;
  oidcToken: string;
  env?: Record<string, string | undefined>;
}): Promise<CreateSessionResult> {
  const env = args.env ?? process.env;

  let envelope: SignedBaselineEnvelope;
  try {
    assertValidEnvelope(args.rawBody);
    envelope = args.rawBody;
  } catch (e) {
    return { ok: false, reason: 'malformed-envelope', detail: e instanceof Error ? e.message : String(e) };
  }

  ensureCosignOnPath();
  const verification = await verifyManifestSignature(envelope);
  if (!verification.verified) {
    return { ok: false, reason: 'signature-invalid', detail: verification.detail };
  }

  const { manifest } = envelope;
  const environment = manifest.provenance.environment;
  if (environment !== 'preview' && environment !== 'production') {
    return {
      ok: false,
      reason: 'store-selection-refused',
      detail: `manifest.provenance.environment must be preview or production, got: ${environment}`,
    };
  }

  const storeId = auditBlobStoreIdFor(environment, env);
  if (!storeId) {
    return {
      ok: false,
      reason: 'store-selection-refused',
      detail: `no audit blob store id configured for environment ${environment}`,
    };
  }

  const credential = resolveBlobCredential({ ...env, BLOB_STORE_ID: storeId }, args.oidcToken);
  const failures = checkBlobStoreSelection({
    requestedStoreId: manifest.storage.storeId ?? '',
    credential,
    expectedEnvironment: environment,
  });
  if (failures.length > 0) {
    return {
      ok: false,
      reason: 'store-selection-refused',
      detail: failures.map((f) => `${f.check}: ${f.detail}`).join(' | '),
    };
  }

  // 許可object一覧を「検証済みmanifestだけ」から導出する。media entryは`stableId`/`filename`/
  // `mimeType`も保持する——Step 3で`manifest.mediaInventory`と同じ形（`MediaInventoryEntry[]`）を
  // 再構築し、既存exporter（`export-content-snapshot.mts`）と同じ
  // `sha256Hex(canonicalJson(mediaInventory))`でmediaInventorySha256を計算するために必要
  // （レビュー指摘: `{objectKey, sha256}`だけのdigestは既存exporterの契約と一致しない）。
  const allowedObjects: AllowedObjectRecord[] = [
    {
      objectKey: manifest.storage.objectKey,
      sha256: manifest.sha256,
      size: null,
      uploaded: false,
      stableId: null,
      filename: null,
      mimeType: null,
    },
    {
      objectKey: manifest.signature.detachedSignatureObjectKey,
      sha256: null,
      size: null,
      uploaded: false,
      stableId: null,
      filename: null,
      mimeType: null,
    },
    ...manifest.mediaInventory.map((entry) => ({
      objectKey: entry.objectKey,
      sha256: entry.sha256,
      size: entry.size,
      uploaded: false,
      stableId: entry.stableId,
      filename: entry.filename,
      mimeType: entry.mimeType,
    })),
  ];
  // signature bundle自体のsha256はmanifestに記録されていない（manifest.signatureはsnapshotへの
  // 署名の「参照」であって、bundleバイト列自身のdigestではない）。bundleの正当性はStep 3で
  // `verifyManifestSignature`が既に確認した「bundleがsnapshotに対して有効な署名である」ことに
  // 拠るため、Step 2ではobjectKeyの形状チェック（`isAllowedAuditBaselineObjectKey`）だけで受け付け、
  // sha256突き合わせは行わない特別扱いにする（`lib/payload/auditUploadObject.ts`の
  // `recordAuditUploadObject`参照）。

  for (const obj of allowedObjects) {
    if (!isAllowedAuditBaselineObjectKey(obj.objectKey, manifest.storage.objectKey)) {
      return {
        ok: false,
        reason: 'malformed-envelope',
        detail: `manifest declares an object key outside the allowed shape: ${obj.objectKey}`,
      };
    }
  }

  const sessionId = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000).toISOString();
  // 署名対象は`canonicalJson(manifest)`（`verifyManifestSignature`と同じ正規化）。監査用digestとして
  // 意味を持たせるため`JSON.stringify`ではなくこちらを使う（レビュー指摘）。
  const manifestSha256 = sha256Hex(canonicalJson(manifest));

  await args.payload.create({
    collection: 'audit-upload-sessions',
    overrideAccess: true,
    data: {
      sessionId,
      requestId: args.requestId,
      manifestSha256,
      baselineObjectKey: manifest.storage.objectKey,
      // manifest.provenance.baselineRunIdをsessionへ保存する（レビュー指摘1）。complete時は
      // request bodyの値をそのまま信用せず、この値との一致を要求する。
      baselineRunId: manifest.provenance.baselineRunId,
      environment,
      allowedObjects,
      status: 'pending',
      expiresAt,
    } as never,
  });

  return { ok: true, sessionId, expiresAt, environment };
}

interface LoadedSession {
  id: string | number;
  sessionId: string;
  requestId: string;
  baselineObjectKey: string;
  baselineRunId: string;
  environment: 'preview' | 'production';
  allowedObjects: AllowedObjectRecord[];
  status: 'pending' | 'completed';
  expiresAt: string;
}

async function loadSession(payload: Payload, sessionId: string): Promise<LoadedSession | null> {
  const { docs } = await payload.find({
    collection: 'audit-upload-sessions',
    where: { sessionId: { equals: sessionId } },
    overrideAccess: true,
    limit: 1,
  });
  const doc = docs[0] as unknown as LoadedSession | undefined;
  return doc ?? null;
}

function isSessionUsable(session: LoadedSession, requestId: string): { ok: true } | { ok: false; reason: string } {
  if (session.status !== 'pending') return { ok: false, reason: 'session-already-completed' };
  if (Date.parse(session.expiresAt) <= Date.now()) return { ok: false, reason: 'session-expired' };
  if (session.requestId !== requestId) return { ok: false, reason: 'request-id-mismatch' };
  return { ok: true };
}

export type CompleteSessionResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | 'session-not-found'
        | 'session-not-usable'
        | 'baseline-run-id-mismatch'
        | 'objects-missing'
        | 'reverify-failed'
        | 'store-error';
      detail: string;
    };

/**
 * Step 3。session内部の記録を鵜呑みにせず、**実際にBlobへ問い合わせて**全objectの実在・sha256・
 * sizeを再確認してからcompletion markerを書く（TOCTOU対策、実装時の追加必須事項）。
 * markerは最後の1回だけ書く（`allowOverwrite: false`のBlob storeなので、二重書き込みは
 * 構造的にも失敗する）。
 */
export async function completeAuditUploadSession(args: {
  payload: Payload;
  sessionId: string;
  requestId: string;
  baselineRunId: string;
  oidcToken: string;
  env?: Record<string, string | undefined>;
  storeFactory?: BlobStoreFactory;
}): Promise<CompleteSessionResult> {
  const env = args.env ?? process.env;
  const session = await loadSession(args.payload, args.sessionId);
  if (!session) return { ok: false, reason: 'session-not-found', detail: args.sessionId };

  const usable = isSessionUsable(session, args.requestId);
  if (!usable.ok) return { ok: false, reason: 'session-not-usable', detail: usable.reason };

  // レビュー指摘1: completion markerの`baselineRunId`は署名検証済みmanifestから保存した値
  // （`session.baselineRunId`、`createAuditUploadSession`参照）だけを使う。CLIが渡した値は
  // 一致確認にしか使わない——不一致は「CLIが別のrunのつもりでこのsessionを叩いている」signalとして
  // 拒否する（任意のrun IDでmarkerを作れてしまい、restore側の`baselineGeneration`単調増加チェック
  // と食い違う不整合を防ぐ）。
  if (args.baselineRunId !== session.baselineRunId) {
    return {
      ok: false,
      reason: 'baseline-run-id-mismatch',
      detail: `request baselineRunId does not match the session's manifest-derived baselineRunId`,
    };
  }

  const missing = session.allowedObjects.filter((obj) => !obj.uploaded);
  if (missing.length > 0) {
    return {
      ok: false,
      reason: 'objects-missing',
      detail: `${missing.length} object(s) not yet uploaded: ${missing.map((o) => o.objectKey).join(', ')}`,
    };
  }

  const storeId = auditBlobStoreIdFor(session.environment, env);
  if (!storeId) return { ok: false, reason: 'store-error', detail: 'no audit blob store id configured' };

  const makeStore = args.storeFactory ?? createVercelBlobObjectStore;
  let store: SnapshotObjectStore;
  try {
    store = makeStore({
      storeId,
      displayName: `deploid-audit-${session.environment}`,
      expectedEnvironment: session.environment,
      env,
      oidcTokenOverride: args.oidcToken,
    });
  } catch (e) {
    return { ok: false, reason: 'store-error', detail: e instanceof Error ? e.message : String(e) };
  }

  const signatureKey = `${session.baselineObjectKey}.cosign.bundle`;
  let snapshotSha256: string | null = null;
  let signatureSha256: string | null = null;
  let snapshotBytes: Buffer | null = null;
  let signatureBytes: Buffer | null = null;
  // 元のmanifest.mediaInventoryと同じ形（`MediaInventoryEntry[]`）・同じ順序で再構築する。
  // `session.allowedObjects`はStep 1でmanifestのmediaInventoryをそのままmapして作った配列
  // （`createAuditUploadSession`参照）なので、ここを順に辿るだけで元の順序を保てる。
  const mediaInventory: MediaInventoryEntry[] = [];

  for (const obj of session.allowedObjects) {
    let bytes: Buffer;
    try {
      bytes = await store.get(obj.objectKey, { fresh: true });
    } catch (e) {
      return {
        ok: false,
        reason: 'reverify-failed',
        detail: `object missing or unreadable at complete-time: ${obj.objectKey} (${e instanceof Error ? e.message : String(e)})`,
      };
    }
    const actualSha256 = createHash('sha256').update(bytes).digest('hex');
    if (obj.objectKey === signatureKey) {
      // 条件2の対象。manifestはsignature bundle自体のsha256を持たない（`createAuditUploadSession`
      // のコメント参照）ため、Step 2ではobjectKey一致だけで受け付けている。ここで**実際に
      // snapshotに対する有効なcosign署名かを検証**しないと、任意バイト列がsignature slotへ
      // 通ってしまう（実装中に見つけた穴）。バイト列は保持しておき、snapshot側を読み終えてから
      // まとめて検証する。
      signatureSha256 = actualSha256;
      signatureBytes = bytes;
      continue;
    }
    if (actualSha256 !== obj.sha256) {
      return {
        ok: false,
        reason: 'reverify-failed',
        detail: `sha256 mismatch at complete-time for ${obj.objectKey}`,
      };
    }
    if (obj.size !== null && bytes.byteLength !== obj.size) {
      return {
        ok: false,
        reason: 'reverify-failed',
        detail: `size mismatch at complete-time for ${obj.objectKey}`,
      };
    }
    if (obj.objectKey === session.baselineObjectKey) {
      snapshotSha256 = actualSha256;
      snapshotBytes = bytes;
    } else {
      // media entry。`stableId`/`filename`/`mimeType`はStep 1でmanifestからそのまま保存した値
      // （client申告値ではない）。sha256/sizeは今re-verifyした実測値を使う（sessionの記録を
      // 鵜呑みにしないというTOCTOU対策の趣旨に沿う）。
      mediaInventory.push({
        stableId: obj.stableId ?? '',
        filename: obj.filename ?? '',
        objectKey: obj.objectKey,
        sha256: actualSha256,
        size: bytes.byteLength,
        mimeType: obj.mimeType ?? '',
      });
    }
  }

  if (!snapshotSha256 || !signatureSha256 || !snapshotBytes || !signatureBytes) {
    return { ok: false, reason: 'reverify-failed', detail: 'snapshot or signature object missing from allowed set' };
  }

  ensureCosignOnPath();
  const signatureVerification = await withTempDir(async (dir) => {
    const snapshotPath = path.join(dir, 'snapshot.json');
    const bundlePath = path.join(dir, 'snapshot.cosign.bundle');
    await writeFile(snapshotPath, snapshotBytes);
    await writeFile(bundlePath, signatureBytes);
    return verifyBlobWithCosign(snapshotPath, bundlePath);
  });
  if (!signatureVerification.verified) {
    return {
      ok: false,
      reason: 'reverify-failed',
      detail: `uploaded signature bundle does not verify against the uploaded snapshot: ${signatureVerification.detail}`,
    };
  }

  // レビュー指摘2: 既存exporter（`export-content-snapshot.mts`）と同じ契約
  // （`sha256Hex(canonicalJson(mediaInventory))`、`MediaInventoryEntry[]`丸ごとのdigest）に
  // 合わせる。`{objectKey, sha256}`だけのdigestでは既存のrestore/verify側の期待値と一致しない。
  const mediaInventorySha256 = sha256Hex(canonicalJson(mediaInventory));

  const marker: BaselineCompletionMarker = {
    artifactSha256: snapshotSha256,
    signatureSha256,
    mediaInventorySha256,
    // レビュー指摘1: request bodyの値ではなく、manifestから保存したsession.baselineRunIdを使う
    // （上でこの2つが一致することは既に確認済みだが、書き込む値としては「manifest由来」の方を
    // 明示的に使う）。
    baselineRunId: session.baselineRunId,
    completedAt: new Date().toISOString(),
  };

  try {
    await store.put(baselineCompletionMarkerKey(session.baselineObjectKey), Buffer.from(canonicalJson(marker), 'utf8'));
  } catch (e) {
    return { ok: false, reason: 'store-error', detail: e instanceof Error ? e.message : String(e) };
  }

  await args.payload.update({
    collection: 'audit-upload-sessions',
    id: session.id,
    overrideAccess: true,
    data: { status: 'completed' } as never,
  });

  return { ok: true };
}
