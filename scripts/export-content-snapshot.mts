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
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { ContentSnapshot } from '../lib/content/contracts.ts';
import { compareSnapshots, countRecords, formatParityReport, parityReportIsClean } from './compare-content-sources.mts';
import { exitCli, isDirectRun, parseArgs } from './contentCliSupport.mts';
import {
  assertWritableDatabase,
  createDefaultMediaFileResolver,
  formatImportReport,
  importContentSnapshot,
  mediaResolverOptionsFromArgs,
  resolveImportUser,
} from './import-content-to-payload.mts';
import {
  assertRestoreInputModeAllowed,
  checkImportOutcome,
  isLocalDatabaseHost,
  readRestoreTargetIdentity,
  verifyBaselineBeforeRestore,
} from './restore-preflight.mts';
import { parseContentSnapshotJson } from './snapshotSchema.mts';

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
    provider: 'vercel-blob' | 's3' | 'local-disk';
    bucket: string;
    objectKey: string;
    versionId: string | null;
  };
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
  }

  if (typeof manifest.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(manifest.sha256)) problems.push('sha256');

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
  const workDir = await mkdtempDir();
  const manifestPath = path.join(workDir, 'manifest.json');
  const bundlePath = path.join(workDir, 'manifest.cosign.bundle');
  await writeFile(manifestPath, canonicalJson(manifest), 'utf8');
  signBlobWithCosign(manifestPath, bundlePath, keyArn);
  return {
    manifest,
    manifestSignature: {
      algorithm: 'cosign',
      keyId: keyArn,
      bundleBase64: (await readFile(bundlePath)).toString('base64'),
    },
  };
}

/** envelope の manifest 署名を検証する。`canonicalJson(manifest)` が署名対象。 */
export async function verifyManifestSignature(envelope: SignedBaselineEnvelope): Promise<CosignVerifyResult> {
  const workDir = await mkdtempDir();
  const manifestPath = path.join(workDir, 'manifest.json');
  const bundlePath = path.join(workDir, 'manifest.cosign.bundle');
  await writeFile(manifestPath, canonicalJson(envelope.manifest), 'utf8');
  await writeFile(bundlePath, Buffer.from(envelope.manifestSignature.bundleBase64, 'base64'));
  return verifyBlobWithCosign(manifestPath, bundlePath);
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
  const keyPath =
    overridePath ?? path.join(await mkdtempDir(), 'deploid-snapshot-signing-pubkey.pem');
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
  }
}

async function mkdtempDir(): Promise<string> {
  const dir = path.join(os.tmpdir(), `deploid-snapshot-${process.pid}-${Date.now()}`);
  await mkdir(dir, { recursive: true });
  return dir;
}

// ─── object storage adapter ───────────────────────────────────────────────

export interface SnapshotObjectStore {
  provider: CutoverBaselineManifest['storage']['provider'];
  bucket: string;
  /** 同一キーへの再 upload は拒否する（write-once 運用。brief Step 7 の表）。 */
  put(objectKey: string, body: Buffer): Promise<{ versionId: string | null }>;
  get(objectKey: string): Promise<Buffer>;
  /**
   * 表示・ログ用の**永続識別子**。brief Step 7 は「private object の署名付きURLは manifest へ
   * 保存しない（期限切れになるため）」としており、`@vercel/blob@2` にはそもそも期限付き署名URLを
   * 発行する API が無い（private blob の読み出しは認証付き `get()`）。したがってここは
   * **URL を返さない**契約にし、期限の無いリンクがログへ残ることを構造的に防ぐ。
   * 実際の読み出しは常に `get()` を通す。
   */
  objectReference(objectKey: string): string;
}

/**
 * Task 5 のテストと Step 6.5 の round-trip 用。実 private audit store
 * （`deploid-audit-production` / `deploid-audit-preview`）は OIDC federated auth で
 * Vercel Function runtime からしか到達できず、ローカル/CI からは触れない。Task 3 の
 * media storage が token 未設定時に local disk へ落ちるのと同じ前例に従う。
 */
export function createLocalDiskObjectStore(directory: string): SnapshotObjectStore {
  return {
    provider: 'local-disk',
    bucket: directory,
    async put(objectKey, body) {
      const target = path.join(directory, objectKey);
      // write-once: 既に同じキーがあれば拒否する（実 store の `allowOverwrite: false` と同じ挙動）。
      if (existsSync(target)) {
        throw new Error(`object-key-already-exists: ${objectKey} (write-once store, use a fresh key)`);
      }
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, body);
      return { versionId: null };
    },
    async get(objectKey) {
      return readFile(path.join(directory, objectKey));
    },
    objectReference(objectKey) {
      return `file://${path.join(directory, objectKey)}`;
    },
  };
}

/**
 * 本番（Task 9 Step 2）向け。private Vercel Blob store（`deploid-audit-*`）を対象にする。
 * **ローカル / CI からは実行できない**（static token を持たない OIDC federated store のため、
 * Vercel Function runtime だけが `VERCEL_OIDC_TOKEN` を Blob access へ交換できる）。
 * ここでは interface を本番の形に合わせて用意するにとどめ、実 upload の検証は Task 9 で行う。
 */
export function createVercelBlobObjectStore(storeName: string): SnapshotObjectStore {
  return {
    provider: 'vercel-blob',
    bucket: storeName,
    async put(objectKey, body) {
      const { put } = await import('@vercel/blob');
      const result = await put(objectKey, body, {
        // **private 必須**。`deploid-audit-*` は private store（資源表 §2 / §2.1）で、
        // cutover baseline は全 content record を含む。`access: 'public'` で置くと
        // 推測しにくいだけの永続URLで誰でも読める状態になり、資源表の
        // 「private。公開URLを持たず、短命な認証付き経路からのみ読む」と正面から矛盾する。
        access: 'private',
        addRandomSuffix: false,
        // 同一キーへの再 upload を禁止する（Vercel Blob は WORM を持たないため、
        // 「run ごとに一意なキー + 上書き禁止」で immutability を運用的に担保する）。
        allowOverwrite: false,
      });
      return { versionId: (result as { versionId?: string }).versionId ?? null };
    },
    async get(objectKey) {
      // private blob の読み出しは SDK の認証付き `get()` で行う。`head()` + 素の `fetch(url)`
      // は public store 用のアクセス経路で、private store では 401 になる。
      const { get } = await import('@vercel/blob');
      const result = await get(objectKey, { access: 'private' });
      if (!result) throw new Error(`blob-object-not-found: ${objectKey}`);
      if (result.statusCode !== 200 || !result.stream) {
        throw new Error(`blob-get-unexpected-status-${result.statusCode}: ${objectKey}`);
      }
      const chunks: Uint8Array[] = [];
      for await (const chunk of result.stream) chunks.push(chunk);
      return Buffer.concat(chunks);
    },
    objectReference(objectKey) {
      // **URL を返さない。** `@vercel/blob@2` には期限付き署名URLを発行する API が無く、
      // private blob の読み出しは「その場で token / OIDC を使う認証付き `get()`」で行う。
      // ここで `head().url` のような永続URLを返して表示すると、期限の無いリンクを
      // ログ・スクロールバック・チケットへ残すことになる（brief Step 7:
      // 「private objectの署名付きURLはmanifestへ保存しない。URLは期限切れになるため」）。
      // よって表示・記録用には**参照解決できない永続識別子**だけを返す。
      return `vercel-blob://${storeName}/${objectKey} (private; read via @vercel/blob get({ access: 'private' }))`;
    },
  };
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
  exportedAt?: string;
  keyArn?: string;
}

export interface BuiltBaseline {
  manifest: CutoverBaselineManifest;
  /** 必須修正6-10: manifest ごと署名した envelope。`--manifest` で渡すのはこちら。 */
  envelope: SignedBaselineEnvelope;
  snapshotJson: string;
  signatureBundle: Buffer;
}

/**
 * snapshot を object storage へ置き、cosign 署名を作り、manifest を組み立てる。
 * `recordCounts.media` は **snapshot 本体から数えた値**を書き、`content:verify-snapshot` が
 * snapshot 本体の件数と一致することを検証する（brief Step 7）。
 */
export async function exportSignedBaseline(args: BuildManifestArgs): Promise<BuiltBaseline> {
  const exportedAt = args.exportedAt ?? new Date().toISOString();
  const snapshotJson = canonicalJson(args.snapshot);
  const snapshotBuffer = Buffer.from(snapshotJson, 'utf8');
  const sha256 = sha256Hex(snapshotBuffer);
  const objectKey = baselineObjectKey(exportedAt, sha256);
  const signatureObjectKey = `${objectKey}.cosign.bundle`;

  const workDir = await mkdtempDir();
  const localSnapshotPath = path.join(workDir, 'snapshot.json');
  const localBundlePath = path.join(workDir, 'snapshot.cosign.bundle');
  await writeFile(localSnapshotPath, snapshotBuffer);
  signBlobWithCosign(localSnapshotPath, localBundlePath, args.keyArn);
  const signatureBundle = await readFile(localBundlePath);

  const { versionId } = await args.store.put(objectKey, snapshotBuffer);
  await args.store.put(signatureObjectKey, signatureBundle);

  const counts = countRecords(args.snapshot);
  const manifest: CutoverBaselineManifest = {
    provenance: args.provenance,
    storage: { provider: args.store.provider, bucket: args.store.bucket, objectKey, versionId },
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

  // 必須修正6-10: manifest 自体にも署名する。sha256 経由で artifact も、provenance 経由で
  // 環境・DB・store・schema世代・baseline run IDも、これ1つの署名で覆われる。
  const envelope = await signManifest(manifest, args.keyArn);
  assertValidEnvelope(envelope);

  return { manifest, envelope, snapshotJson, signatureBundle };
}

/** manifest の `storage` からストアを復元する（短命URLはここで都度発行する）。 */
export function storeFromManifest(manifest: CutoverBaselineManifest): SnapshotObjectStore {
  switch (manifest.storage.provider) {
    case 'local-disk':
      return createLocalDiskObjectStore(manifest.storage.bucket);
    case 'vercel-blob':
      return createVercelBlobObjectStore(manifest.storage.bucket);
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
  '  --store-name <name>           vercel-blob store 名（例 deploid-audit-production）',
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

  const storeName = args.get('store');
  let store: SnapshotObjectStore;
  if (storeName === 'local-disk') {
    const dir = args.get('store-dir');
    if (typeof dir !== 'string') throw new Error('--store local-disk requires --store-dir <dir>.');
    store = createLocalDiskObjectStore(path.resolve(dir));
  } else if (storeName === 'vercel-blob') {
    const name = args.get('store-name');
    if (typeof name !== 'string') throw new Error('--store vercel-blob requires --store-name <store>.');
    store = createVercelBlobObjectStore(name);
  } else {
    throw new Error('--upload requires --store local-disk|vercel-blob.');
  }

  if (!cosignAvailable()) {
    throw new Error('cosign is not installed. Snapshot signing is mandatory (brief Step 7); install cosign and retry.');
  }

  const exportedBy = (args.get('exported-by') as string | undefined) ?? process.env.USER ?? 'unknown';
  const provenance = await resolveExportProvenance(source, args);
  const { manifest, envelope } = await exportSignedBaseline({ snapshot, store, exportedBy, provenance });

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
  });

  assertWritableDatabase(args, 'scripts/export-content-snapshot.mts --restore');

  const { getPayload } = await import('payload');
  const { default: config } = await import('../payload.config.ts');
  const payload = await getPayload({ config });

  try {
    let snapshot: ContentSnapshot;
    let sourceLabel: string;

    if (typeof manifestPath === 'string') {
      const envelope = JSON.parse(await readFile(manifestPath, 'utf8')) as unknown;
      assertValidEnvelope(envelope);

      const store = storeFromManifest(envelope.manifest);
      const artifact = await store.get(envelope.manifest.storage.objectKey);
      const artifactSignatureBundle = await store.get(envelope.manifest.signature.detachedSignatureObjectKey);
      const target = await readRestoreTargetIdentity(payload, databaseUrl);

      const verification = await verifyBaselineBeforeRestore({
        envelope,
        artifact,
        artifactSignatureBundle,
        target,
        expectedEnvironment: typeof args.get('expected-environment') === 'string' ? (args.get('expected-environment') as string) : undefined,
        expectedBaselineRunId: typeof args.get('expected-baseline-run-id') === 'string' ? (args.get('expected-baseline-run-id') as string) : undefined,
        workDir: await mkdtempDir(),
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
      sourceLabel = `signed baseline ${verification.verified.provenance.baselineRunId}`;
      process.stdout.write(
        'preflight: manifest signature, artifact signature, sha256, snapshot schema, record counts, ' +
          'stable ids, references, environment marker, database resource, audit store, schema version — all OK\n',
      );
    } else {
      // localhost の throwaway DB か明示的 test mode だけがここへ来る。それでも
      // bare cast はしない（必須修正6-4: 厳密な runtime schema 検証は入力形式を問わず通す）。
      snapshot = parseContentSnapshotJson(await readFile(inputPath as string, 'utf8'));
      sourceLabel = `unsigned snapshot ${inputPath}`;
      process.stdout.write(`preflight: strict snapshot schema OK (unsigned input, local/test target)\n`);
    }

    const user = await resolveImportUser(payload, args);
    const report = await importContentSnapshot({
      payload,
      snapshot,
      user,
      // 必須修正1-6: restore は import とは別のrun ID / 理由で監査ログへ残す。
      runId: `content-restore-${new Date().toISOString()}`,
      reason: `content:restore from ${sourceLabel}`,
      mediaResolver: createDefaultMediaFileResolver(mediaResolverOptionsFromArgs(args)),
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

    process.stdout.write('content:restore: OK — the database matches the artifact on every collection.\n');
  } finally {
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
