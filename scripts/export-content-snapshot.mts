/**
 * snapshot の export / upload / restore（`docs/plans/content-platform-migration-plan-v1.md`
 * Task 5 Step 5・6.5・7）。
 *
 * - `content:export -- --source local|payload --out <path>` — snapshot を JSON へ書き出す。
 *   `--source` は必須。暗黙の source 選択をしない（brief Step 5）。
 * - `content:export -- --upload ...` — object storage の write-once 領域へ置き、cosign 署名を
 *   付けて `CutoverBaselineManifest` を出す。
 * - `content:restore -- --input <snapshot>` — export した snapshot を空DBへ書き戻す。
 *   `content:import` と**同じ upsert ロジック**（`importContentSnapshot`）を再利用する。
 *
 * ## 署名（brief Step 7: 「署名は必須」）
 *
 * Task 0 が確定した AWS KMS 鍵（`alias/deploid-snapshot-signing`、`ECC_NIST_P256` /
 * `ECDSA_SHA_256`）を cosign 経由で使う。checksum だけでは「取得時に改ざんされていない」ことしか
 * 示せず、artifact 自体が正規の export であることを示せないため、sha256 と署名の両方を持つ。
 * 検証の trust anchor は `docs/reference/content-platform-resources-v1.md` §4 に平文で載っている
 * **公開鍵**であって Rekor（公開透明性ログ）ではないので、検証時は `--insecure-ignore-tlog` で
 * ログ検証を外す（外部サービスへの可用性依存を復旧経路に持ち込まない）。
 *
 * ## 上書き防止（brief Step 7 の表）
 *
 * Vercel Blob は WORM / object-lock を持たないため、**run ごとに一意なキー（日時 + hash）**で
 * 新規オブジェクトとして置き、同一キーへの再 upload を禁止する（`allowOverwrite: false`）。
 */
import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { ContentSnapshot } from '../lib/content/contracts.ts';
import type { MediaAsset } from '../lib/content/domainTypes.ts';
import { compareSnapshots, countRecords, formatParityReport, parityReportIsClean } from './compare-content-sources.mts';
import { exitCli, isDirectRun, parseArgs } from './contentCliSupport.mts';
import {
  assertWritableDatabase,
  createBaselineMediaFileResolver,
  createDefaultMediaFileResolver,
  formatImportReport,
  mediaResolverOptionsFromArgs,
  resolveImportUser,
  resolveWithinRoot,
  restoreContentSnapshot,
  type MediaFileResolver,
} from './import-content-to-payload.mts';
import {
  authorizeRestoreFromLocalThrowaway,
  authorizeRestoreFromVerifiedBaseline,
  type RestoreAuthorization,
} from './restoreAuthorization.mts';
import {
  assertRawInputTargetAllowed,
  assertRestoreInputModeAllowed,
  checkImportOutcome,
  isLocalDatabaseHost,
  readRestoreTargetIdentity,
  recordRestoredBaseline,
  verifyBaselineBeforeRestore,
} from './restore-preflight.mts';
import {
  baselineCompletionMarkerKey,
  createLocalDiskObjectStore,
  createVercelBlobObjectStore,
  normalizeBlobStoreId,
  resolveBlobCredential,
  type BaselineCompletionMarker,
  type BlobCredential,
  type MediaInventoryEntry,
  type SnapshotObjectStore,
  type SnapshotStorageProvider,
} from './snapshotObjectStore.mts';
import { parseContentSnapshotJson } from './snapshotSchema.mts';

// 必須修正7 で object store の実装は `scripts/snapshotObjectStore.mts` へ移した。既存の
// import 元（テスト・他 script）を壊さないよう、名前はここからも re-export し続ける。
export {
  baselineCompletionMarkerKey,
  createLocalDiskObjectStore,
  createVercelBlobObjectStore,
  type MediaInventoryEntry,
  type SnapshotObjectStore,
} from './snapshotObjectStore.mts';

// ─── snapshot の正規化と hash ──────────────────────────────────────────────

/**
 * key 順を再帰的にソートした決定的 JSON。`undefined` は落とす（`JSON.stringify` と同じ）。
 * sha256 が「同じ内容なら同じ値」になることを保証するために必要
 * （object の key 順は Payload の返す順に依存しうる）。
 */
export function canonicalJson(value: unknown): string {
  const normalize = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(normalize);
    if (input && typeof input === 'object') {
      const entries = Object.entries(input as Record<string, unknown>)
        .filter(([, entryValue]) => entryValue !== undefined)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
      return Object.fromEntries(entries.map(([key, entryValue]) => [key, normalize(entryValue)]));
    }
    return input;
  };
  return JSON.stringify(normalize(value), null, 2);
}

export function sha256Hex(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

// ─── manifest（brief Step 7 の検証schema） ─────────────────────────────────

/**
 * 必須修正6-9（remediation group 2）: manifest（および署名済み envelope）が持つべき出所情報。
 *
 * 監査の指摘は「未署名・改ざん済み・**別環境向け**の JSON でも `--i-know-this-is-production`
 * さえ付ければ managed DB へ書ける」だった。`assertWritableDatabase` は host が localhost かと
 * flag の有無しか見ておらず、`_environment_marker` も Supabase project identity も一切見ていない。
 * artifact が「どこで・何から作られ、どの DB へ戻すためのものか」を artifact 自身に持たせて、
 * restore 側が対象 DB の実際の identity と突き合わせられるようにする。
 */
export interface BaselineProvenance {
  /** snapshot の作成元。`local` は cutover 前の local TS、`payload` は稼働中の Payload。 */
  sourceKind: SnapshotSourceName;
  /** この artifact が戻る先の環境。`_environment_marker` の値と一致しなければ restore しない。 */
  environment: 'production' | 'preview' | 'local-throwaway';
  /** DB の資源識別子（host:port/dbname[#supabase project ref]）。**接続情報の秘密部分は含めない**。 */
  databaseResourceId: string;
  /** private audit blob store の ID（`docs/reference/content-platform-resources-v1.md` §4）。 */
  auditBlobStoreId: string;
  /** export 時点で適用済みだった最新 migration 名。schema 世代の不一致を検出する。 */
  schemaVersion: string;
  /** export run ごとに一意。古い正規 artifact の replay を検出するための識別子（必須修正6-10）。 */
  baselineRunId: string;
  /** 単調増加。世代を跨いだ巻き戻しを検出する。 */
  baselineGeneration: number;
}

export interface CutoverBaselineManifest {
  provenance: BaselineProvenance;
  storage: {
    /**
     * brief の union は `'vercel-blob' | 's3'`。Task 5 のテストは実 private audit store へ
     * 到達できない（OIDC federated auth で Vercel Function runtime からしか使えない）ため、
     * ローカルディスク backed の test adapter を表す `'local-disk'` を足してある。
     * `content:verify-snapshot` は `local-disk` の manifest を既定で**拒否**し、
     * `--allow-local-store` を明示したときだけ受け付ける。
     */
    provider: SnapshotStorageProvider;
    /** 表示用の store 名。**接続先の選択には使わない**（必須修正7-3）。 */
    bucket: string;
    /**
     * 必須修正7-3/7-4: artifact が実際に置かれた **store ID**。restore / verify は runtime
     * credential から導いた store ID とこれを突き合わせ、食い違えば拒否する。表示名（`bucket`）は
     * 誰でも好きに書けるので、照合の対象にはならない。local-disk store は `null`。
     */
    storeId: string | null;
    objectKey: string;
    versionId: string | null;
  };
  /**
   * 必須修正9-1: baseline に同梱した media バイト列の inventory。**署名対象**なので、
   * ここに載った sha256 は artifact 署名と同じ強さで守られる。snapshot の `media` と1対1。
   */
  mediaInventory: MediaInventoryEntry[];
  sha256: string;
  signature: {
    algorithm: 'cosign';
    keyId: string;
    detachedSignatureObjectKey: string;
  };
  recordCounts: {
    manufacturers: number;
    robots: number;
    robotSeries: number;
    distributors: number;
    useCases: number;
    deployments: number;
    articles: number;
    articlePlacements: number;
    media: number;
    siteSettings: number;
  };
  exportedAt: string;
  exportedBy: string;
}

const RECORD_COUNT_KEYS: readonly (keyof CutoverBaselineManifest['recordCounts'])[] = [
  'manufacturers',
  'robots',
  'robotSeries',
  'distributors',
  'useCases',
  'deployments',
  'articles',
  'articlePlacements',
  'media',
  'siteSettings',
];

/** manifest の形を機械的に検査する（1 field でも欠けた artifact を受け付けない、brief Step 7）。 */
export function assertValidManifest(value: unknown): asserts value is CutoverBaselineManifest {
  const problems: string[] = [];
  const manifest = value as Partial<CutoverBaselineManifest> | null;

  if (!manifest || typeof manifest !== 'object') throw new Error('manifest-invalid: not an object');

  const storage = manifest.storage;
  if (!storage || typeof storage !== 'object') {
    problems.push('storage');
  } else {
    if (!['vercel-blob', 's3', 'local-disk'].includes(storage.provider as string)) problems.push('storage.provider');
    if (typeof storage.bucket !== 'string' || storage.bucket.length === 0) problems.push('storage.bucket');
    if (typeof storage.objectKey !== 'string' || storage.objectKey.length === 0) problems.push('storage.objectKey');
    if (!(storage.versionId === null || typeof storage.versionId === 'string')) problems.push('storage.versionId');
    // 必須修正7-3: store ID は「あるかないか」ではなく provider ごとに**必ず決まる**もの。
    // vercel-blob なのに store ID が無い manifest は、照合できない = 受け付けない。
    if (storage.provider === 'vercel-blob') {
      if (typeof storage.storeId !== 'string' || storage.storeId.length === 0) problems.push('storage.storeId');
    } else if (!(storage.storeId === null || typeof storage.storeId === 'string')) {
      problems.push('storage.storeId');
    }
  }

  if (typeof manifest.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(manifest.sha256)) problems.push('sha256');

  // 必須修正9-1: media inventory は「あってもなくてもよい追加情報」ではない。field が無い
  // manifest は media を復元できない baseline なので、manifest として無効にする。
  if (!Array.isArray(manifest.mediaInventory)) {
    problems.push('mediaInventory');
  } else {
    manifest.mediaInventory.forEach((entry, index) => {
      const row = entry as Partial<MediaInventoryEntry> | null;
      if (!row || typeof row !== 'object') {
        problems.push(`mediaInventory[${index}]`);
        return;
      }
      for (const key of ['stableId', 'filename', 'objectKey', 'mimeType'] as const) {
        if (typeof row[key] !== 'string' || (row[key] as string).length === 0) {
          problems.push(`mediaInventory[${index}].${key}`);
        }
      }
      if (typeof row.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(row.sha256)) {
        problems.push(`mediaInventory[${index}].sha256`);
      }
      if (typeof row.size !== 'number' || !Number.isInteger(row.size) || row.size < 0) {
        problems.push(`mediaInventory[${index}].size`);
      }
    });
  }

  const signature = manifest.signature;
  if (!signature || typeof signature !== 'object') {
    problems.push('signature');
  } else {
    if (signature.algorithm !== 'cosign') problems.push('signature.algorithm');
    if (typeof signature.keyId !== 'string' || signature.keyId.length === 0) problems.push('signature.keyId');
    if (typeof signature.detachedSignatureObjectKey !== 'string' || signature.detachedSignatureObjectKey.length === 0) {
      problems.push('signature.detachedSignatureObjectKey');
    }
  }

  const counts = manifest.recordCounts;
  if (!counts || typeof counts !== 'object') {
    problems.push('recordCounts');
  } else {
    for (const key of RECORD_COUNT_KEYS) {
      if (typeof counts[key] !== 'number' || !Number.isInteger(counts[key])) problems.push(`recordCounts.${key}`);
    }
  }

  if (typeof manifest.exportedAt !== 'string' || Number.isNaN(Date.parse(manifest.exportedAt))) problems.push('exportedAt');
  if (typeof manifest.exportedBy !== 'string' || manifest.exportedBy.length === 0) problems.push('exportedBy');

  // 必須修正6-9: provenance が1 field でも欠けたら manifest として無効。欠けた field は
  // 「検証しない」ではなく「検証できない」ので、restore を許してはいけない。
  const provenance = manifest.provenance;
  if (!provenance || typeof provenance !== 'object') {
    problems.push('provenance');
  } else {
    if (!['local', 'payload'].includes(provenance.sourceKind as string)) problems.push('provenance.sourceKind');
    if (!['production', 'preview', 'local-throwaway'].includes(provenance.environment as string)) {
      problems.push('provenance.environment');
    }
    for (const key of ['databaseResourceId', 'auditBlobStoreId', 'schemaVersion', 'baselineRunId'] as const) {
      if (typeof provenance[key] !== 'string' || (provenance[key] as string).length === 0) {
        problems.push(`provenance.${key}`);
      }
    }
    if (typeof provenance.baselineGeneration !== 'number' || !Number.isInteger(provenance.baselineGeneration)) {
      problems.push('provenance.baselineGeneration');
    }
  }

  if (problems.length > 0) throw new Error(`manifest-invalid: ${problems.join(', ')}`);
}

// ─── 署名済み envelope（必須修正6-10） ─────────────────────────────────────

/**
 * 必須修正6-10: **manifest 自体も署名対象へ含める**。
 *
 * snapshot 本体だけに署名していると、攻撃者は「過去の正規 artifact（署名は本物）」に
 * 「今の環境向けに書き換えた manifest（署名対象外）」を組み合わせられる。sha256 も
 * provenance も manifest 側にあるので、artifact の署名は何の防御にもならない。
 * manifest を署名対象へ入れると、sha256 経由で artifact も、provenance 経由で
 * 環境・DB・store・schema 世代・baseline run ID も、すべて1つの署名で覆われる。
 */
export interface SignedBaselineEnvelope {
  manifest: CutoverBaselineManifest;
  manifestSignature: {
    algorithm: 'cosign';
    keyId: string;
    /** `canonicalJson(manifest)` に対する detached cosign bundle（base64）。 */
    bundleBase64: string;
  };
}

export function assertValidEnvelope(value: unknown): asserts value is SignedBaselineEnvelope {
  const envelope = value as Partial<SignedBaselineEnvelope> | null;
  if (!envelope || typeof envelope !== 'object') throw new Error('envelope-invalid: not an object');
  if (!('manifest' in envelope) || !('manifestSignature' in envelope)) {
    throw new Error(
      'envelope-invalid: expected a signed baseline envelope { manifest, manifestSignature }. ' +
        'A bare manifest is not accepted — the manifest itself must be signed so its provenance ' +
        'cannot be swapped onto an older artifact (必須修正6-10).',
    );
  }
  assertValidManifest(envelope.manifest);
  const signature = envelope.manifestSignature;
  const problems: string[] = [];
  if (!signature || typeof signature !== 'object') {
    problems.push('manifestSignature');
  } else {
    if (signature.algorithm !== 'cosign') problems.push('manifestSignature.algorithm');
    if (typeof signature.keyId !== 'string' || signature.keyId.length === 0) problems.push('manifestSignature.keyId');
    if (typeof signature.bundleBase64 !== 'string' || signature.bundleBase64.length === 0) {
      problems.push('manifestSignature.bundleBase64');
    }
  }
  if (problems.length > 0) throw new Error(`envelope-invalid: ${problems.join(', ')}`);
}

/** manifest へ cosign 署名を付けて envelope にする。 */
export async function signManifest(
  manifest: CutoverBaselineManifest,
  keyArn = signingKeyArn(),
): Promise<SignedBaselineEnvelope> {
  const signature = await signCanonicalJson(manifest, keyArn);
  return { manifest, manifestSignature: signature };
}

/** envelope の manifest 署名を検証する。`canonicalJson(manifest)` が署名対象。 */
export async function verifyManifestSignature(envelope: SignedBaselineEnvelope): Promise<CosignVerifyResult> {
  return verifyCanonicalJson(envelope.manifest, envelope.manifestSignature.bundleBase64);
}

/**
 * 任意の JSON 文書へ cosign 署名を付ける汎用形（必須修正8-6 の media waiver、
 * 必須修正10-6 の identity transfer manifest が使う）。**署名対象は `canonicalJson(document)`**
 * なので、key 順や空白の違いでは署名は変わらず、値が1文字でも変われば必ず落ちる。
 */
export interface JsonDocumentSignature {
  algorithm: 'cosign';
  keyId: string;
  bundleBase64: string;
}

export interface SignedJsonDocument<T> {
  document: T;
  signature: JsonDocumentSignature;
}

async function signCanonicalJson(value: unknown, keyArn: string): Promise<JsonDocumentSignature> {
  // 必須修正11-1/11-2: 署名対象の平文と bundle を /tmp へ残さない。
  return withTempDir(async (workDir) => {
    const documentPath = path.join(workDir, 'document.json');
    const bundlePath = path.join(workDir, 'document.cosign.bundle');
    await writeFile(documentPath, canonicalJson(value), 'utf8');
    signBlobWithCosign(documentPath, bundlePath, keyArn);
    return {
      algorithm: 'cosign' as const,
      keyId: keyArn,
      bundleBase64: (await readFile(bundlePath)).toString('base64'),
    };
  });
}

async function verifyCanonicalJson(value: unknown, bundleBase64: string): Promise<CosignVerifyResult> {
  return withTempDir(async (workDir) => {
    const documentPath = path.join(workDir, 'document.json');
    const bundlePath = path.join(workDir, 'document.cosign.bundle');
    await writeFile(documentPath, canonicalJson(value), 'utf8');
    await writeFile(bundlePath, Buffer.from(bundleBase64, 'base64'));
    return verifyBlobWithCosign(documentPath, bundlePath);
  });
}

export async function signJsonDocument<T>(
  document: T,
  keyArn = signingKeyArn(),
): Promise<SignedJsonDocument<T>> {
  return { document, signature: await signCanonicalJson(document, keyArn) };
}

export async function verifyJsonDocumentSignature<T>(signed: SignedJsonDocument<T>): Promise<CosignVerifyResult> {
  return verifyCanonicalJson(signed.document, signed.signature.bundleBase64);
}

/**
 * 署名済み JSON 文書の外形検査（非 assertion 版）。動的 import 越しに呼ぶ場合は
 * assertion 関数が使えない（TS2775）ため、値を返すこちらを使う。
 */
export function parseSignedJsonDocument(value: unknown): SignedJsonDocument<unknown> {
  assertValidSignedJsonDocument(value);
  return value;
}

/** 署名済み JSON 文書の外形検査（署名検証の前に形が正しいことを確かめる）。 */
export function assertValidSignedJsonDocument(value: unknown): asserts value is SignedJsonDocument<unknown> {
  const signed = value as Partial<SignedJsonDocument<unknown>> | null;
  if (!signed || typeof signed !== 'object') throw new Error('signed-document-invalid: not an object');
  if (!('document' in signed) || signed.document === undefined || signed.document === null) {
    throw new Error('signed-document-invalid: missing `document`');
  }
  const signature = signed.signature;
  const problems: string[] = [];
  if (!signature || typeof signature !== 'object') {
    problems.push('signature');
  } else {
    if (signature.algorithm !== 'cosign') problems.push('signature.algorithm');
    if (typeof signature.keyId !== 'string' || signature.keyId.length === 0) problems.push('signature.keyId');
    if (typeof signature.bundleBase64 !== 'string' || signature.bundleBase64.length === 0) {
      problems.push('signature.bundleBase64');
    }
  }
  if (problems.length > 0) throw new Error(`signed-document-invalid: ${problems.join(', ')}`);
}

// ─── cosign 署名 ──────────────────────────────────────────────────────────

/**
 * Task 0 の検証用公開鍵（`docs/reference/content-platform-resources-v1.md` §4）。
 * **secret ではない**。verify を外部ファイル無しで完結させるために埋め込む
 * （復旧時に「鍵ファイルがどこにあるか分からない」状態を作らない）。
 * `SNAPSHOT_SIGNING_PUBLIC_KEY_PATH` で上書きできる（鍵の手動 rotation 後の経路）。
 */
export const SNAPSHOT_SIGNING_PUBLIC_KEY_PEM = [
  '-----BEGIN PUBLIC KEY-----',
  'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE/cHZmiiXZKXcUVZefKLtKVwLBdxS',
  'oHcOefwBg14WSe08xdJE0yM9cnVgLZYINtulE2S/ZTStYMBNoK3vOhnq6Q==',
  '-----END PUBLIC KEY-----',
  '',
].join('\n');

export const DEFAULT_SIGNING_KEY_ARN =
  'arn:aws:kms:ap-northeast-1:866731631468:key/a9c59d6b-b769-47bb-bc65-8ac6ff4782f5';

export function signingKeyArn(): string {
  return process.env.SNAPSHOT_SIGNING_KMS_KEY_ARN ?? DEFAULT_SIGNING_KEY_ARN;
}

export function cosignAvailable(): boolean {
  try {
    execFileSync('cosign', ['version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * detached signature（cosign bundle）を作る。AWS credential は呼び出し側の環境変数
 * （`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION`）から cosign が読む。
 * このコードは credential 値を読まない・保存しない・ログに出さない。
 */
export function signBlobWithCosign(filePath: string, bundlePath: string, keyArn = signingKeyArn()): void {
  execFileSync(
    'cosign',
    [
      'sign-blob',
      '--key',
      `awskms:///${keyArn}`,
      // cosign v3 は新 bundle 形式を既定にするが、検証側で「公開鍵 + detached signature」
      // だけで完結させたいので旧形式（base64Signature を含む JSON）を明示する。
      '--new-bundle-format=false',
      '--bundle',
      bundlePath,
      '--yes',
      filePath,
    ],
    { stdio: ['ignore', 'ignore', 'inherit'] },
  );
}

export interface CosignVerifyResult {
  verified: boolean;
  detail: string;
}

export async function verifyBlobWithCosign(filePath: string, bundlePath: string): Promise<CosignVerifyResult> {
  const overridePath = process.env.SNAPSHOT_SIGNING_PUBLIC_KEY_PATH;
  // 必須修正11-2: 公開鍵の temp を /tmp へ残さない（秘密ではないが、放置ファイルは
  // 「どれが正しい鍵か分からない」状態を作る）。override があるときは何も書かない。
  const keyDir = overridePath ? undefined : await mkdtempDir();
  const keyPath = overridePath ?? path.join(keyDir as string, 'deploid-snapshot-signing-pubkey.pem');
  if (!overridePath) await writeFile(keyPath, SNAPSHOT_SIGNING_PUBLIC_KEY_PEM, 'utf8');

  try {
    execFileSync(
      'cosign',
      [
        'verify-blob',
        '--key',
        keyPath,
        '--bundle',
        bundlePath,
        // trust anchor は Task 0 の KMS 公開鍵。Rekor（外部サービス）を復旧経路の
        // 可用性依存にしない。
        '--insecure-ignore-tlog=true',
        filePath,
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    return { verified: true, detail: 'cosign verify-blob: Verified OK' };
  } catch (error) {
    const stderr = (error as { stderr?: Buffer }).stderr?.toString() ?? (error as Error).message;
    // cosign は `--insecure-ignore-tlog` の WARNING を必ず先に出す。それが失敗理由として
    // 表示されると本当の原因（署名不一致）が読めないので落とす。
    const detail = stderr
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('WARNING:'))
      .join(' | ');
    return { verified: false, detail: detail || stderr.trim() };
  } finally {
    if (keyDir) await removeTempDir(keyDir);
  }
}

/**
 * 必須修正11-1: 一時ディレクトリは **`mkdtemp` で予測不可能な名前** + **0700** にする。
 *
 * 以前は `path.join(os.tmpdir(), \`deploid-snapshot-${process.pid}-${Date.now()}\`)` を
 * `mkdir` していた。名前が pid と時刻から**予測可能**で、既定 mode（umask 次第で 0755）なので、
 * multi-user のマシンでは平文 snapshot（全 content record）と署名 bundle が他ユーザーから
 * 読める場所へ落ちていた。しかも一度も削除していなかった。
 */
export async function mkdtempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-snapshot-'));
  await chmod(dir, 0o700);
  return dir;
}

/** 必須修正11-1/11-2: 一時ディレクトリは `finally` で必ず消す。失敗しても本処理は止めない。 */
export async function removeTempDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true }).catch(() => {});
}

/** 一時ディレクトリを作り、使い終わったら必ず消す。 */
export async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtempDir();
  try {
    return await fn(dir);
  } finally {
    await removeTempDir(dir);
  }
}

// ─── snapshot の読み出し ───────────────────────────────────────────────────

export type SnapshotSourceName = 'local' | 'payload';

/** `--source` は必須。暗黙の source 選択をしない（brief Step 5）。 */
export async function readSnapshotFromSource(source: SnapshotSourceName): Promise<ContentSnapshot> {
  if (source === 'local') {
    const { createLocalContentSource } = await import('../lib/content/localSource.ts');
    return createLocalContentSource().readSnapshot();
  }
  const { createPayloadContentSource } = await import('../lib/content/payloadSource.ts');
  return createPayloadContentSource().readSnapshot();
}

/** run ごとに一意な object key（日時 + hash）。同一キーへの再 upload を構造的に起こさない。 */
export function baselineObjectKey(exportedAt: string, sha256: string): string {
  const stamp = exportedAt.replace(/[:.]/g, '-');
  return `cutover-baseline/${stamp}-${sha256.slice(0, 12)}.json`;
}

export interface BuildManifestArgs {
  snapshot: ContentSnapshot;
  store: SnapshotObjectStore;
  exportedBy: string;
  /** 必須修正6-9: artifact の出所。restore 側が対象DBの実 identity と突き合わせる。 */
  provenance: BaselineProvenance;
  /**
   * 必須修正9-1: media の**バイト列**の取得元。baseline 単体から media を復元できるようにするため、
   * snapshot の各 media asset の実体を private backup store へ一緒に置く。
   * 省略時は `createDefaultMediaByteSource()`（Payload の local upload ディレクトリ）。
   */
  resolveMediaBytes?: MediaByteResolver;
  exportedAt?: string;
  keyArn?: string;
}

export interface BuiltBaseline {
  manifest: CutoverBaselineManifest;
  /** 必須修正6-10: manifest ごと署名した envelope。`--manifest` で渡すのはこちら。 */
  envelope: SignedBaselineEnvelope;
  snapshotJson: string;
  signatureBundle: Buffer;
  /** 必須修正7-7: 最後に置いた completion marker の内容。 */
  completion: BaselineCompletionMarker;
}

// ─── media バイト列の baseline 同梱（必須修正9） ────────────────────────────

/**
 * 必須修正9-1: **baseline 単体から media を復元できる**ようにする。
 *
 * 監査の指摘: 署名 snapshot は media の metadata しか持たず、画像バイト列の checksum も無い。
 * つまり復旧は「public media Blob が生きていること」に依存しており、それは baseline の意味を
 * 満たしていない（9-2）。ここでは snapshot と同じ private backup store へ media bytes を置き、
 * **署名対象である manifest** に objectKey / sha256 / size / mimeType の inventory を持たせる。
 * restore 側は inventory どおりに取り出して sha256 を検証する（9-3・9-4）。
 *
 * `MediaInventoryEntry` 自体は `scripts/snapshotObjectStore.mts` が持つ（module 循環を避けるため。
 * 詳細はあちらの docblock）。
 */
export type MediaByteResolver = (asset: MediaAsset) => Promise<Buffer>;

/**
 * 既定の media バイト列取得元。export 元 Payload の local disk upload ディレクトリから読む
 * （`/api/media/file/<filename>` 形式の URL も、素の filename も同じ場所を指す）。
 * Vercel Blob backed の media では `url` が絶対URLになるので、そのときだけ fetch する。
 */
export function createDefaultMediaByteSource(options: { uploadDir?: string } = {}): MediaByteResolver {
  const uploadDir = options.uploadDir ?? path.resolve(process.cwd(), 'media');
  return async (asset) => {
    if (/^https?:\/\//i.test(asset.url)) {
      const response = await fetch(asset.url);
      if (!response.ok) throw new Error(`media-fetch-failed-${response.status}: ${asset.url}`);
      return Buffer.from(await response.arrayBuffer());
    }
    const within = resolveWithinRoot(uploadDir, asset.filename);
    if (within === undefined) throw new Error(`media-path-outside-root: ${asset.filename}`);
    return readFile(within);
  };
}

/** media bytes を store へ置き、署名対象になる inventory を組み立てる。 */
async function uploadMediaInventory(args: {
  media: readonly MediaAsset[];
  objectKeyPrefix: string;
  resolveMediaBytes?: MediaByteResolver;
  put: (objectKey: string, body: Buffer) => Promise<{ versionId: string | null }>;
}): Promise<MediaInventoryEntry[]> {
  const resolve = args.resolveMediaBytes ?? createDefaultMediaByteSource();
  const inventory: MediaInventoryEntry[] = [];
  // content-addressed なので、同じバイト列を持つ media（rights 違いで2レコードに割れた同一
  // ファイルなど）は同じ objectKey になる。write-once store は再 put を拒否するため、
  // この run で既に置いたキーは置き直さない（inventory には両方の stableId が載る）。
  const uploaded = new Set<string>();
  // stable ID 順に固定して、同じ snapshot なら同じ inventory になるようにする。
  const assets = [...args.media].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (const asset of assets) {
    let bytes: Buffer;
    try {
      bytes = await resolve(asset);
    } catch (error) {
      // 必須修正9-4 の裏側: **取得できなかった media がある baseline は作らない**。
      // 「あとで public store から拾えばよい」を許すと、baseline 単体での復元にならない。
      throw new Error(`media-bytes-unavailable: ${asset.id} (${asset.filename}): ${(error as Error).message}`);
    }
    const sha256 = sha256Hex(bytes);
    const objectKey = `${args.objectKeyPrefix}/${sha256}`;
    inventory.push({
      stableId: asset.id,
      filename: asset.filename,
      objectKey,
      sha256,
      size: bytes.byteLength,
      mimeType: asset.mimeType ?? 'application/octet-stream',
    });
    if (uploaded.has(objectKey)) continue;
    await args.put(objectKey, bytes);
    uploaded.add(objectKey);
  }
  return inventory;
}

/**
 * snapshot を object storage へ置き、cosign 署名を作り、manifest を組み立てる。
 * `recordCounts.media` は **snapshot 本体から数えた値**を書き、`content:verify-snapshot` が
 * snapshot 本体の件数と一致することを検証する（brief Step 7）。
 *
 * 必須修正7-7: **不完全な run が有効 baseline として選ばれないようにする。** 構成物を全部
 * 置き終えた最後に completion marker を書き、途中で失敗したら**置いた分を消してから**投げ直す。
 * marker の無い baseline は restore / verify が受け付けない。
 */
export async function exportSignedBaseline(args: BuildManifestArgs): Promise<BuiltBaseline> {
  const exportedAt = args.exportedAt ?? new Date().toISOString();
  const snapshotJson = canonicalJson(args.snapshot);
  const snapshotBuffer = Buffer.from(snapshotJson, 'utf8');
  const sha256 = sha256Hex(snapshotBuffer);
  const objectKey = baselineObjectKey(exportedAt, sha256);
  const signatureObjectKey = `${objectKey}.cosign.bundle`;

  const workDir = await mkdtempDir();
  let signatureBundle: Buffer;
  try {
    const localSnapshotPath = path.join(workDir, 'snapshot.json');
    const localBundlePath = path.join(workDir, 'snapshot.cosign.bundle');
    await writeFile(localSnapshotPath, snapshotBuffer);
    signBlobWithCosign(localSnapshotPath, localBundlePath, args.keyArn);
    signatureBundle = await readFile(localBundlePath);
  } finally {
    // 必須修正11-1/11-2: 平文 snapshot と署名 bundle を /tmp へ残さない。
    await removeTempDir(workDir);
  }

  // 途中で失敗したら「置いた分」を消してから投げ直す（必須修正7-7）。
  const written: string[] = [];
  const put = async (key: string, body: Buffer) => {
    const result = await args.store.put(key, body);
    written.push(key);
    return result;
  };

  let versionId: string | null;
  let mediaInventory: MediaInventoryEntry[];
  try {
    ({ versionId } = await put(objectKey, snapshotBuffer));
    await put(signatureObjectKey, signatureBundle);
    mediaInventory = await uploadMediaInventory({
      media: args.snapshot.media,
      objectKeyPrefix: `${objectKey}.media`,
      resolveMediaBytes: args.resolveMediaBytes,
      put,
    });
  } catch (error) {
    for (const key of [...written].reverse()) {
      await args.store.remove(key).catch(() => {});
    }
    throw new Error(
      `baseline-upload-incomplete: ${(error as Error).message}. Partial objects from this run were removed; ` +
        'no completion marker was written, so this run can never be selected as a baseline.',
      { cause: error },
    );
  }

  const counts = countRecords(args.snapshot);
  const manifest: CutoverBaselineManifest = {
    provenance: args.provenance,
    storage: {
      provider: args.store.provider,
      bucket: args.store.bucket,
      storeId: args.store.storeId,
      objectKey,
      versionId,
    },
    mediaInventory,
    sha256,
    signature: {
      algorithm: 'cosign',
      keyId: args.keyArn ?? signingKeyArn(),
      detachedSignatureObjectKey: signatureObjectKey,
    },
    recordCounts: {
      manufacturers: counts.manufacturers,
      robots: counts.robots,
      robotSeries: counts.robotSeries,
      distributors: counts.distributors,
      useCases: counts.useCases,
      deployments: counts.deployments,
      articles: counts.articles,
      articlePlacements: counts.articlePlacements,
      media: counts.media,
      siteSettings: counts.siteSettings,
    },
    exportedAt,
    exportedBy: args.exportedBy,
  };
  assertValidManifest(manifest);

  // 必須修正7-7: **最後に** completion marker を置く。ここまで来ていない run（snapshot だけ、
  // signature だけ、media が途中まで）は marker を持たないので、restore / verify が拒否する。
  const completion: BaselineCompletionMarker = {
    artifactSha256: sha256,
    signatureSha256: sha256Hex(signatureBundle),
    mediaInventorySha256: sha256Hex(canonicalJson(mediaInventory)),
    baselineRunId: args.provenance.baselineRunId,
    completedAt: new Date().toISOString(),
  };
  await args.store.put(baselineCompletionMarkerKey(objectKey), Buffer.from(canonicalJson(completion), 'utf8'));

  // 必須修正6-10: manifest 自体にも署名する。sha256 経由で artifact も、provenance 経由で
  // 環境・DB・store・schema世代・baseline run IDも、これ1つの署名で覆われる。
  const envelope = await signManifest(manifest, args.keyArn);
  assertValidEnvelope(envelope);

  return { manifest, envelope, snapshotJson, signatureBundle, completion };
}

/**
 * 必須修正7-4: preflight は「credential が無い」ことも失敗として報告したいので、
 * ここでは throw せず `null` を返す（`checkBlobStoreAgainstCredential` が `blobCredential`
 * failure として扱う）。
 */
function resolveBlobCredentialOrNull(): BlobCredential | null {
  try {
    return resolveBlobCredential();
  } catch {
    return null;
  }
}

/** manifest の `storage` からストアを復元する（短命URLはここで都度発行する）。 */
export function storeFromManifest(manifest: CutoverBaselineManifest): SnapshotObjectStore {
  switch (manifest.storage.provider) {
    case 'local-disk':
      return createLocalDiskObjectStore(manifest.storage.bucket);
    case 'vercel-blob':
      // 必須修正7-3/7-4: **表示名（bucket）ではなく store ID** で接続先を決め、runtime
      // credential が指す store と一致しなければ store を作る時点で拒否する。
      // `expectedEnvironment` を渡すことで Preview / Production の credential 交差も拒否される。
      return createVercelBlobObjectStore({
        storeId: manifest.storage.storeId ?? '',
        displayName: manifest.storage.bucket,
        expectedEnvironment: manifest.provenance.environment,
      });
    case 's3':
      throw new Error('manifest-storage-provider-unsupported: s3 store adapter is not implemented (Task 0 chose Vercel Blob).');
  }
}

// ─── CLI ─────────────────────────────────────────────────────────────────

const HELP = [
  'content:export — snapshot を JSON へ書き出す / 署名つきで object storage へ置く。',
  '',
  '  --source local|payload        必須。暗黙の source 選択をしない。',
  '  --out <path>                  snapshot JSON の出力先',
  '  --upload                      object storage へ置き、cosign 署名 + manifest を作る',
  '  --store local-disk|vercel-blob  --upload 時の保存先',
  '  --store-dir <dir>             local-disk store のディレクトリ',
  '  --store-id <id>               vercel-blob の**実 store ID**（接続先の選択と credential 照合に使う）',
  '  --store-name <name>           vercel-blob store の表示名（manifest / ログ用。選択には使わない）',
  '  --media-dir <dir>             baseline へ同梱する media バイト列の読み取り元（既定 ./media）',
  '  --manifest-out <path>         署名済み manifest envelope の出力先',
  '  --exported-by <who>           manifest の exportedBy',
  '  --baseline-generation <n>     --upload 時必須。単調増加の世代番号（古い baseline の replay 防止）',
  '',
  'content:restore — export した snapshot をDBへ書き戻す（content:import と同じ upsert）。',
  '',
  '  --restore --manifest <envelope.json>  managed DB へはこれのみ。署名 + sha256 + schema +',
  '                                        内容 + 対象DB identity をDB変更前に全部検証する。',
  '  --restore --input <snapshot>          未署名。localhost の throwaway DB か --test-mode のみ。',
  '  --expected-environment <env>          オペレーターが宣言する対象環境（manifest と照合）',
  '  --expected-baseline-run-id <id>       戻す baseline を明示する（古い artifact の replay 防止）',
  '  --media-dir <dir>             media のバイト列の読み取り元（restore 元 store 相当）',
  '  --admin-email / --admin-password / --bootstrap-admin / --i-know-this-is-production',
  '',
].join('\n');

async function runExport(args: Map<string, string | true>): Promise<void> {
  const source = args.get('source');
  if (source !== 'local' && source !== 'payload') {
    throw new Error('content:export requires --source local|payload (no implicit source selection).');
  }

  // review fix round 2 / Critical #2 の残り半分: **DBへ接続する前に**push を止める。
  //
  // round 1 では `resolveExportProvenance()` の中でこれを設定していたが、それは
  // `readSnapshotFromSource('payload')` が `getPayload()` を呼んで**既に接続した後**だった。
  // つまり `content:export --source payload --upload`（cutover baseline を取る本来の経路で、
  // managed DB に対して実行される）は、修正前とまったく同じ dev schema push と
  // 対話プロンプトのリスクに晒されたままだった。export は読み取り操作であって
  // schema を変える権限を持たない。詳細は `runRestore` の同じ guard の docblock を参照。
  process.env.PAYLOAD_MIGRATING = 'true';

  const snapshot = await readSnapshotFromSource(source);
  const counts = countRecords(snapshot);
  process.stdout.write(
    `exported from ${source}: ${Object.entries(counts).map(([key, value]) => `${key}=${value}`).join(' ')}\n`,
  );

  const outPath = args.get('out');
  if (typeof outPath === 'string') {
    await writeFile(outPath, `${canonicalJson(snapshot)}\n`, 'utf8');
    process.stdout.write(`wrote snapshot: ${outPath} (sha256=${sha256Hex(canonicalJson(snapshot))})\n`);
  }

  if (!args.has('upload')) {
    if (typeof outPath !== 'string') throw new Error('content:export requires --out <path> or --upload.');
    return;
  }

  if (!cosignAvailable()) {
    throw new Error('cosign is not installed. Snapshot signing is mandatory (brief Step 7); install cosign and retry.');
  }

  // provenance を**先に**決める。private audit store の ID も対象環境も provenance が持っており、
  // vercel-blob store はその2つを credential と突き合わせてからでないと作れない（必須修正7-4）。
  const exportedBy = (args.get('exported-by') as string | undefined) ?? process.env.USER ?? 'unknown';
  const provenance = await resolveExportProvenance(source, args);

  const storeKind = args.get('store');
  let store: SnapshotObjectStore;
  if (storeKind === 'local-disk') {
    const dir = args.get('store-dir');
    if (typeof dir !== 'string') throw new Error('--store local-disk requires --store-dir <dir>.');
    store = createLocalDiskObjectStore(path.resolve(dir));
  } else if (storeKind === 'vercel-blob') {
    // 必須修正7-3: 接続先を決めるのは **store ID**。`--store-name` は manifest とログの表示名で、
    // 認証にも store 選択にも一切関与しない（それが監査で見つかった欠陥そのもの）。
    const storeIdArg = args.get('store-id');
    const storeId = typeof storeIdArg === 'string' ? storeIdArg : provenance.auditBlobStoreId;
    if (normalizeBlobStoreId(storeId) !== normalizeBlobStoreId(provenance.auditBlobStoreId)) {
      throw new Error(
        `blob-store-id-mismatch: --store-id "${storeId}" is not the audit store wired to this environment ` +
          `("${provenance.auditBlobStoreId}"). The baseline must live in the store this environment declares.`,
      );
    }
    const displayName = args.get('store-name');
    store = createVercelBlobObjectStore({
      storeId,
      ...(typeof displayName === 'string' ? { displayName } : {}),
      expectedEnvironment: provenance.environment,
    });
  } else {
    throw new Error('--upload requires --store local-disk|vercel-blob.');
  }

  const mediaDir = args.get('media-dir');
  const { manifest, envelope } = await exportSignedBaseline({
    snapshot,
    store,
    exportedBy,
    provenance,
    // 必須修正9-1: media のバイト列も baseline へ同梱する（既定は Payload の local upload dir）。
    resolveMediaBytes: createDefaultMediaByteSource(
      typeof mediaDir === 'string' ? { uploadDir: path.resolve(mediaDir) } : {},
    ),
  });

  const manifestPath = args.get('manifest-out');
  // **envelope を書く**（bare manifest ではない）。restore が受け付けるのは署名済み envelope だけ。
  const envelopeJson = `${JSON.stringify(envelope, null, 2)}\n`;
  if (typeof manifestPath === 'string') {
    await writeFile(manifestPath, envelopeJson, 'utf8');
    process.stdout.write(`wrote signed manifest envelope: ${manifestPath}\n`);
  } else {
    process.stdout.write(envelopeJson);
  }
  process.stdout.write(`baseline run: ${provenance.baselineRunId} (generation ${provenance.baselineGeneration})\n`);
  process.stdout.write(`object: ${store.objectReference(manifest.storage.objectKey)}\n`);
}

/**
 * 必須修正6-9: artifact の provenance を**推測せず**に決める。
 *
 * `environment` / `databaseResourceId` / `schemaVersion` / `auditBlobStoreId` は
 * `DATABASE_URL` が指す**その DB 自身**から読む（`_environment_marker` と `payload_migrations`）。
 * ここを CLI flag の自己申告にすると、「artifact が主張する環境」と「実際の環境」が
 * 一致することを誰も確かめていない状態に戻ってしまう。
 */
async function resolveExportProvenance(
  sourceKind: SnapshotSourceName,
  args: Map<string, string | true>,
): Promise<BaselineProvenance> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set. --upload records the target database identity in the manifest.');
  }

  const generationArg = args.get('baseline-generation');
  const baselineGeneration = typeof generationArg === 'string' ? Number.parseInt(generationArg, 10) : NaN;
  if (!Number.isInteger(baselineGeneration) || baselineGeneration < 0) {
    throw new Error('--upload requires --baseline-generation <integer> (monotonic; guards against replaying an older baseline).');
  }

  // Critical #2 と同じ理由: export も schema を変えてはならない（`runRestore` の docblock 参照）。
  process.env.PAYLOAD_MIGRATING = 'true';

  const { getPayload } = await import('payload');
  const { default: config } = await import('../payload.config.ts');
  const payload = await getPayload({ config });
  try {
    const target = await readRestoreTargetIdentity(payload, databaseUrl);
    if (target.auditBlobStoreId === null) {
      throw new Error(
        'audit-blob-store-not-configured: the manifest must record the private audit store id, and this ' +
          'environment has none wired (PRODUCTION_AUDIT_BLOB_TOKEN_STORE_ID / PREVIEW_AUDIT_BLOB_TOKEN_STORE_ID).',
      );
    }
    return {
      sourceKind,
      environment: target.environment ?? 'local-throwaway',
      databaseResourceId: target.databaseResourceId,
      auditBlobStoreId: target.auditBlobStoreId,
      schemaVersion: target.schemaVersion,
      baselineRunId: `baseline-${new Date().toISOString()}-${randomUUID()}`,
      baselineGeneration,
    };
  } finally {
    await payload.destroy();
  }
}

/**
 * 必須修正6（remediation group 2）。以前の実装は
 *   `JSON.parse(await readFile(inputPath, 'utf8')) as ContentSnapshot`
 * だけで managed DB への upsert を始めていた。署名も schema 検証も対象DB identity の確認も無く、
 * `--i-know-this-is-production` を付けさえすれば未署名・改ざん済み・別環境向けのファイルが
 * そのまま本番へ流れた。
 *
 * 新しい経路:
 * - managed DB へは `--manifest`（署名済み envelope）でしか restore できない（6-1）。
 * - raw `--input` は localhost の throwaway DB か明示的 `--test-mode` のみ（6-2）。
 * - DB を1行も触る前に署名 → sha256 → schema → 内容 → 対象DB identity を全部通す（6-3）。
 * - restore 後に同じ artifact との完全 parity を自動実行し、通らなければ exit 1（6-7）。
 * - skipped media / 部分 import が1件でもあれば成功扱いにしない（6-8）。
 */
async function runRestore(args: Map<string, string | true>): Promise<void> {
  const manifestPath = args.get('manifest');
  const inputPath = args.get('input');
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is not set. content:restore needs an explicit target database.');

  assertRestoreInputModeAllowed({
    hasManifest: typeof manifestPath === 'string',
    hasRawInput: typeof inputPath === 'string',
    isLocalHost: isLocalDatabaseHost(databaseUrl),
    explicitTestMode: args.has('test-mode'),
    nodeEnv: process.env.NODE_ENV,
  });

  assertWritableDatabase(args, 'scripts/export-content-snapshot.mts --restore');

  // review fix round 1 / Critical #2: **config を import する前に**push を止める。
  //
  // `getPayload()` は `NODE_ENV !== 'production'` かつ adapter が `push: false` でない限り
  // dev-mode schema push（`@payloadcms/drizzle` の `pushDevSchema`）を走らせ、実際に DDL を
  // 実行して `payload_migrations` へ `batch: -1` の行を INSERT する。これが検証より前に
  // 起きていたため、後段の「refusing to write. No database change was made.」は**事実に反して
  // いた**（改ざん envelope でも managed DB の schema が同期されてしまう）。さらに drizzle が
  // data-loss 警告を出す場合は対話 prompt が起動し、非TTY実行では `onCancel` の
  // `process.exit(0)` で「何もしていないのに exit 0」になり得た。
  //
  // `scripts/stamp-environment.mts` が同じ理由で同じ1行を使っている（そちらの docblock 参照）。
  // restore は schema を変えてはならない操作なので、push を止めるのは制約ではなく仕様。
  // schema が無い DB への restore は「table が無い」というエラーで正しく落ちる。
  process.env.PAYLOAD_MIGRATING = 'true';

  const { getPayload } = await import('payload');
  const { default: config } = await import('../payload.config.ts');
  const payload = await getPayload({ config });

  let restoreWorkDir: string | undefined;
  try {
    let snapshot: ContentSnapshot;
    let sourceLabel: string;
    let verifiedProvenance: BaselineProvenance | undefined;
    let authorization: RestoreAuthorization;
    let mediaResolver: MediaFileResolver;

    if (typeof manifestPath === 'string') {
      const envelope = JSON.parse(await readFile(manifestPath, 'utf8')) as unknown;
      assertValidEnvelope(envelope);

      const store = storeFromManifest(envelope.manifest);
      const artifact = await store.get(envelope.manifest.storage.objectKey);
      const artifactSignatureBundle = await store.get(envelope.manifest.signature.detachedSignatureObjectKey);
      // 必須修正7-7: completion marker が無い（= 途中で終わった run）ことと、取得に失敗したことを
      // 区別せず、どちらも「完了を確認できない」として扱う。
      const completionMarker = await store
        .get(baselineCompletionMarkerKey(envelope.manifest.storage.objectKey))
        .catch(() => null);
      const target = await readRestoreTargetIdentity(payload, databaseUrl);

      restoreWorkDir = await mkdtempDir();
      const verification = await verifyBaselineBeforeRestore({
        envelope,
        artifact,
        artifactSignatureBundle,
        completionMarker,
        fetchMediaObject: (objectKey) => store.get(objectKey),
        // 必須修正7-4: vercel-blob manifest のときだけ credential を要求する（local-disk store の
        // round-trip テストで Blob credential を持ち出さない）。
        blobCredential:
          envelope.manifest.storage.provider === 'vercel-blob' ? resolveBlobCredentialOrNull() : undefined,
        target,
        expectedEnvironment: typeof args.get('expected-environment') === 'string' ? (args.get('expected-environment') as string) : undefined,
        expectedBaselineRunId: typeof args.get('expected-baseline-run-id') === 'string' ? (args.get('expected-baseline-run-id') as string) : undefined,
        workDir: restoreWorkDir,
        writeFile: async (filePath, data) => writeFile(filePath, data),
        joinPath: (...segments) => path.join(...segments),
      });

      if (!verification.ok) {
        for (const failure of verification.failures) process.stderr.write(`FAIL ${failure.check}: ${failure.detail}\n`);
        process.stderr.write('content:restore: refusing to write. No database change was made.\n');
        process.exitCode = 1;
        return;
      }

      snapshot = verification.verified.snapshot;
      verifiedProvenance = verification.verified.provenance;
      authorization = authorizeRestoreFromVerifiedBaseline(verification.verified);
      // 必須修正9-1/9-2: media は **baseline に同梱されたバイト列**から戻す。public media store が
      // 生きていることを復旧の前提にしない。
      mediaResolver = createBaselineMediaFileResolver({
        inventory: verification.verified.mediaInventory,
        fetchMediaObject: (objectKey) => store.get(objectKey),
      });
      sourceLabel = `signed baseline ${verification.verified.provenance.baselineRunId}`;
      process.stdout.write(
        'preflight: manifest signature, artifact signature, sha256, baseline completion, snapshot schema, ' +
          'record counts, stable ids, references, media inventory (bytes + sha256), environment marker, ' +
          'database resource, audit store, schema version, blob store identity — all OK\n',
      );
    } else {
      // localhost の throwaway DB か明示的 test mode だけがここへ来る。それでも
      // bare cast はしない（必須修正6-4: 厳密な runtime schema 検証は入力形式を問わず通す）。
      // Critical #1 の後段: DB 自身の申告で production / preview を拒否する。
      // `NODE_ENV` と違い、これは restore の呼び出し側が書き換えられない。
      const rawTarget = await readRestoreTargetIdentity(payload, databaseUrl);
      assertRawInputTargetAllowed(rawTarget);
      // 必須修正8-3: override 付き書き込みの authorization は、この経路でも
      // 「DB 自身が local throwaway だと申告している」ことからしか発行しない。
      authorization = authorizeRestoreFromLocalThrowaway(rawTarget);

      snapshot = parseContentSnapshotJson(await readFile(inputPath as string, 'utf8'));
      mediaResolver = createDefaultMediaFileResolver(mediaResolverOptionsFromArgs(args));
      sourceLabel = `unsigned snapshot ${inputPath}`;
      process.stdout.write(`preflight: strict snapshot schema OK (unsigned input, local/test target)\n`);
    }

    const user = await resolveImportUser(payload, args);
    const report = await restoreContentSnapshot({
      payload,
      snapshot,
      user,
      authorization,
      // 必須修正1-6: restore は import とは別のrun ID / 理由で監査ログへ残す。
      runId: `content-restore-${new Date().toISOString()}`,
      reason: `content:restore from ${sourceLabel}`,
      mediaResolver,
      log: (line) => process.stdout.write(`  ${line}\n`),
    });
    process.stdout.write(`\n${formatImportReport(report)}\n`);

    // 必須修正6-8: skipped media / 部分 import があれば成功扱いにしない。
    const outcomeFailures = checkImportOutcome(report);

    // 必須修正6-7: restore 後に**同じ artifact** との完全 parity を自動実行する。
    const { createPayloadContentSource } = await import('../lib/content/payloadSource.ts');
    const actual = await createPayloadContentSource({ payload }).readSnapshot();
    const parity = compareSnapshots(snapshot, actual);
    process.stdout.write(`\n${formatParityReport(parity)}\n`);
    if (!parityReportIsClean(parity)) {
      outcomeFailures.push({
        check: 'postRestoreParity',
        detail:
          `missing=${parity.missing.length} extra=${parity.extra.length} changed=${parity.changed.length} ` +
          `brokenReferences=${parity.brokenReferences.length}`,
      });
    }

    if (outcomeFailures.length > 0) {
      for (const failure of outcomeFailures) process.stderr.write(`FAIL ${failure.check}: ${failure.detail}\n`);
      process.stderr.write('content:restore: NOT successful — the database was modified but does not match the artifact.\n');
      process.exitCode = 1;
      return;
    }

    // review fix round 1 / Important #1: 成功したときだけ世代を記録する。次回以降、これより
    // 古い世代の artifact は署名が本物でも `baselineGeneration` チェックで拒否される。
    if (verifiedProvenance) {
      await recordRestoredBaseline(payload, verifiedProvenance);
      process.stdout.write(
        `recorded baseline generation ${verifiedProvenance.baselineGeneration} ` +
          `(run ${verifiedProvenance.baselineRunId}) on this database\n`,
      );
    }

    process.stdout.write('content:restore: OK — the database matches the artifact on every collection.\n');
  } finally {
    // 必須修正11-1/11-2: cosign 検証用に書き出した平文 artifact と bundle を /tmp へ残さない。
    if (restoreWorkDir) await removeTempDir(restoreWorkDir);
    await payload.destroy();
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.has('help')) {
    process.stdout.write(HELP);
    return;
  }
  if (args.has('restore')) {
    await runRestore(args);
    return;
  }
  await runExport(args);
}

if (isDirectRun(import.meta.url)) {
  await main();
  await exitCli();
}
