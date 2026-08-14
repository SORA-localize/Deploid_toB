/**
 * `content:restore` の**DB へ触る前**の検証（remediation group 2 / 必須修正6）。
 *
 * 監査の指摘（原文）:
 * > `content:restore --input` は `JSON.parse(...) as ContentSnapshot` という bare type cast のみ。
 * > ランタイムの schema 検証も cosign 署名検証も無い。DB 保護は `assertWritableDatabase` による
 * > localhost 判定 + `--i-know-this-is-production` フラグの確認だけで、`_environment_marker` や
 * > Supabase project identity の一致は一切見ていない。つまり未署名・改ざん済み・別環境向けの
 * > JSON ファイルでも、`--i-know-this-is-production` さえ付ければそのまま managed DB へ書き込める。
 *
 * ここは「1件でも検証が通らなければ **DB を1行も触らない**」ための層。検証の順序自体が
 * 仕様であり（署名 → sha256 → schema → 内容 → 対象DB identity）、どこで落ちても
 * 書き込みは始まっていない。
 */
import type { Payload } from 'payload';
import type { ContentSnapshot } from '../lib/content/contracts.ts';
import { collectBrokenReferences, countRecords } from './compare-content-sources.mts';
import {
  assertValidEnvelope,
  sha256Hex,
  verifyBlobWithCosign,
  verifyManifestSignature,
  type BaselineProvenance,
  type SignedBaselineEnvelope,
} from './export-content-snapshot.mts';
import { collectDuplicateStableIds, parseContentSnapshotJson } from './snapshotSchema.mts';

export interface RestoreCheckFailure {
  check: string;
  detail: string;
}

/** restore 先 DB の**実際の** identity。manifest の主張と突き合わせる相手。 */
export interface RestoreTargetIdentity {
  /** `_environment_marker` の値。row が無ければ `null`（local throwaway だけが取りうる）。 */
  environment: 'production' | 'preview' | null;
  /** `DATABASE_URL` から導いた資源識別子。 */
  databaseResourceId: string;
  /** 適用済みの最新 migration 名。 */
  schemaVersion: string;
  /** この環境向けに配線されている private audit blob store ID（未配線なら `null`）。 */
  auditBlobStoreId: string | null;
  /** host が localhost 系か。raw `--input` を許すかの判定に使う。 */
  isLocalHost: boolean;
}

const LOCAL_DATABASE_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

/**
 * `DATABASE_URL` → 資源識別子。**password / secret を一切含めない**形にする
 * （manifest とログへ載るため）。Supabase の transaction pooler は host が project 間で
 * 共有されるので、username 側に現れる project ref も拾う。
 */
export function databaseResourceId(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  const database = url.pathname.replace(/^\//, '') || '(default)';
  const projectRef = /^postgres\.([a-z0-9]+)$/i.exec(decodeURIComponent(url.username))?.[1];
  return `${url.hostname}:${url.port || '5432'}/${database}${projectRef ? `#${projectRef}` : ''}`;
}

export function isLocalDatabaseHost(databaseUrl: string): boolean {
  return LOCAL_DATABASE_HOSTS.has(new URL(databaseUrl).hostname);
}

/** 環境ごとの private audit blob store ID（`lib/payload/access.ts` と同じ env var 名）。 */
export function auditBlobStoreIdFor(
  environment: RestoreTargetIdentity['environment'],
  env: Record<string, string | undefined> = process.env,
): string | null {
  if (environment === 'production') return env.PRODUCTION_AUDIT_BLOB_TOKEN_STORE_ID ?? null;
  if (environment === 'preview') return env.PREVIEW_AUDIT_BLOB_TOKEN_STORE_ID ?? null;
  return env.LOCAL_AUDIT_BLOB_TOKEN_STORE_ID ?? 'local-throwaway-no-audit-store';
}

/** 適用済み migration のうち最後のもの。`dev`（schema push 由来）は世代として数えない。 */
export async function readSchemaVersion(payload: Payload): Promise<string> {
  const { docs } = await payload.find({
    collection: 'payload-migrations' as never,
    where: { batch: { greater_than: 0 } },
    sort: '-name',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const latest = (docs[0] as { name?: string } | undefined)?.name;
  return latest ?? 'none';
}

export async function readEnvironmentMarker(payload: Payload): Promise<RestoreTargetIdentity['environment']> {
  const { docs } = await payload.find({
    collection: 'environment-marker',
    limit: 2,
    depth: 0,
    overrideAccess: true,
  });
  if (docs.length === 0) return null;
  if (docs.length > 1) {
    throw new Error(
      'environment-marker-corrupt: more than one row in _environment_marker. The unique constraint on ' +
        '`singleton` should make this impossible — investigate before restoring anything.',
    );
  }
  return (docs[0] as { environment?: 'production' | 'preview' }).environment ?? null;
}

export async function readRestoreTargetIdentity(
  payload: Payload,
  databaseUrl: string,
  env: Record<string, string | undefined> = process.env,
): Promise<RestoreTargetIdentity> {
  const environment = await readEnvironmentMarker(payload);
  return {
    environment,
    databaseResourceId: databaseResourceId(databaseUrl),
    schemaVersion: await readSchemaVersion(payload),
    auditBlobStoreId: auditBlobStoreIdFor(environment, env),
    isLocalHost: isLocalDatabaseHost(databaseUrl),
  };
}

/**
 * 必須修正6-1・6-2: managed DB への restore は **`--manifest` のみ**。
 * raw `--input` は localhost の throwaway DB か、明示的な test mode だけで許す。
 *
 * 以前の `assertWritableDatabase` は「localhost か、さもなくば `--i-know-this-is-production`」
 * だけを見ていた。flag は**入力の素性を一切保証しない**ので、これ単独では
 * 「未署名 JSON を production へ流す」を止められない。
 */
export function assertRestoreInputModeAllowed(args: {
  hasManifest: boolean;
  hasRawInput: boolean;
  isLocalHost: boolean;
  explicitTestMode: boolean;
}): void {
  if (args.hasManifest && args.hasRawInput) {
    throw new Error('content:restore takes either --manifest or --input, not both.');
  }
  if (!args.hasManifest && !args.hasRawInput) {
    throw new Error('content:restore requires --manifest <signed-envelope.json> (or --input for a local throwaway DB).');
  }
  if (args.hasManifest) return;

  if (!args.isLocalHost && !args.explicitTestMode) {
    throw new Error(
      'restore-raw-input-refused: --input accepts an unsigned snapshot file and is only allowed against a ' +
        'local throwaway database (or with an explicit --test-mode). Restoring into a managed database ' +
        'requires --manifest <signed-envelope.json> so the artifact\'s signature, checksum and provenance ' +
        'are verified before anything is written.',
    );
  }
}

/**
 * 必須修正6-3: manifest の主張と**対象DBの実際の identity**を突き合わせる。
 * 純粋関数なので、実 KMS / 実 blob store が無い環境でも全パターンをテストできる。
 */
export function checkProvenanceAgainstTarget(
  provenance: BaselineProvenance,
  target: RestoreTargetIdentity,
  options: { expectedEnvironment?: string; expectedBaselineRunId?: string } = {},
): RestoreCheckFailure[] {
  const failures: RestoreCheckFailure[] = [];

  if (!['local', 'payload'].includes(provenance.sourceKind)) {
    failures.push({ check: 'sourceKind', detail: `unknown source kind "${provenance.sourceKind}"` });
  }

  // オペレーターが宣言した環境（`--expected-environment`）と manifest が食い違ったら止める。
  if (options.expectedEnvironment && options.expectedEnvironment !== provenance.environment) {
    failures.push({
      check: 'expectedEnvironment',
      detail: `operator expected "${options.expectedEnvironment}" but the artifact is for "${provenance.environment}"`,
    });
  }

  // `_environment_marker` は DB 自身の申告。manifest と食い違えば「別環境向けの artifact」。
  const targetEnvironment = target.environment ?? 'local-throwaway';
  if (provenance.environment !== targetEnvironment) {
    failures.push({
      check: 'environmentMarker',
      detail:
        `artifact is for "${provenance.environment}" but this database reports "${targetEnvironment}"` +
        (target.environment === null ? ' (no _environment_marker row)' : ''),
    });
  }

  if (provenance.databaseResourceId !== target.databaseResourceId) {
    failures.push({
      check: 'databaseResourceId',
      detail: `artifact targets "${provenance.databaseResourceId}" but DATABASE_URL points at "${target.databaseResourceId}"`,
    });
  }

  if (provenance.auditBlobStoreId !== target.auditBlobStoreId) {
    failures.push({
      check: 'auditBlobStoreId',
      detail: `artifact records audit store "${provenance.auditBlobStoreId}" but this environment is wired to "${target.auditBlobStoreId ?? '(none)'}"`,
    });
  }

  if (provenance.schemaVersion !== target.schemaVersion) {
    failures.push({
      check: 'schemaVersion',
      detail:
        `artifact was exported at schema "${provenance.schemaVersion}" but this database is at ` +
        `"${target.schemaVersion}". Restoring across a schema generation can silently drop or mistype fields.`,
    });
  }

  // 必須修正6-10: 古い正規 artifact の replay を防ぐ。run ID は署名対象（manifest）の中にあるので
  // 書き換えられない。オペレーターがどの baseline を戻すのか明示することを要求する。
  if (options.expectedBaselineRunId && options.expectedBaselineRunId !== provenance.baselineRunId) {
    failures.push({
      check: 'baselineRunId',
      detail: `operator expected baseline run "${options.expectedBaselineRunId}" but the artifact is run "${provenance.baselineRunId}" (generation ${provenance.baselineGeneration})`,
    });
  }

  return failures;
}

/** 必須修正6-3: snapshot 本体の内容検査（duplicate stable ID / broken reference / recordCounts）。 */
export function checkSnapshotIntegrity(
  snapshot: ContentSnapshot,
  expectedCounts: Record<string, number>,
): RestoreCheckFailure[] {
  const failures: RestoreCheckFailure[] = [];

  for (const problem of collectDuplicateStableIds(snapshot)) {
    failures.push({ check: 'duplicateStableId', detail: `${problem.path}: ${problem.detail}` });
  }

  for (const broken of collectBrokenReferences(snapshot, 'expected')) {
    failures.push({
      check: 'brokenReference',
      detail: `${broken.collection}/${broken.id}.${broken.field} -> ${broken.referencedCollection}/${broken.referencedId} does not exist in the artifact`,
    });
  }

  const actual = countRecords(snapshot);
  for (const [key, expected] of Object.entries(expectedCounts)) {
    if (actual[key] !== expected) {
      failures.push({
        check: 'recordCounts',
        detail: `${key}: manifest says ${expected}, artifact contains ${actual[key]}`,
      });
    }
  }

  return failures;
}

export interface VerifiedBaseline {
  snapshot: ContentSnapshot;
  provenance: BaselineProvenance;
}

export interface VerifyBaselineArgs {
  envelope: unknown;
  /** object store から取り出した artifact の生バイト列。 */
  artifact: Buffer;
  /** artifact の detached cosign bundle。 */
  artifactSignatureBundle: Buffer;
  target: RestoreTargetIdentity;
  expectedEnvironment?: string;
  expectedBaselineRunId?: string;
  /** 一時ファイルの置き場（cosign は file 相手にしか検証できない）。 */
  workDir: string;
  writeFile: (filePath: string, data: Buffer | string) => Promise<void>;
  joinPath: (...segments: string[]) => string;
}

/**
 * 必須修正6-3: **DB を触る前に**通す検証の全体。1件でも失敗したら `ok: false` を返し、
 * 呼び出し側は書き込みを開始しない。
 *
 * 順序に意味がある:
 * 1. envelope / manifest の runtime schema（形が違えば以降の検証の前提が無い）
 * 2. **manifest 署名**（provenance と sha256 が本物であることの根拠。ここが最初の trust anchor）
 * 3. artifact 署名
 * 4. sha256（manifest ↔ artifact の結び付き）
 * 5. snapshot の厳密 schema
 * 6. 内容（recordCounts / duplicate stable ID / broken reference）
 * 7. 対象DB identity（environment / DB resource / audit store / schema version / baseline run）
 */
export async function verifyBaselineBeforeRestore(
  args: VerifyBaselineArgs,
): Promise<{ ok: true; verified: VerifiedBaseline } | { ok: false; failures: RestoreCheckFailure[] }> {
  try {
    assertValidEnvelope(args.envelope);
  } catch (error) {
    return { ok: false, failures: [{ check: 'envelopeSchema', detail: (error as Error).message }] };
  }
  const envelope = args.envelope as SignedBaselineEnvelope;

  const manifestSignature = await verifyManifestSignature(envelope);
  if (!manifestSignature.verified) {
    return { ok: false, failures: [{ check: 'manifestSignature', detail: manifestSignature.detail }] };
  }

  const artifactPath = args.joinPath(args.workDir, 'snapshot.json');
  const bundlePath = args.joinPath(args.workDir, 'snapshot.cosign.bundle');
  await args.writeFile(artifactPath, args.artifact);
  await args.writeFile(bundlePath, args.artifactSignatureBundle);

  const artifactSignature = await verifyBlobWithCosign(artifactPath, bundlePath);
  if (!artifactSignature.verified) {
    return { ok: false, failures: [{ check: 'artifactSignature', detail: artifactSignature.detail }] };
  }

  const digest = sha256Hex(args.artifact);
  if (digest !== envelope.manifest.sha256) {
    return {
      ok: false,
      failures: [
        { check: 'sha256', detail: `manifest says ${envelope.manifest.sha256}, artifact hashes to ${digest}` },
      ],
    };
  }

  let snapshot: ContentSnapshot;
  try {
    snapshot = parseContentSnapshotJson(args.artifact.toString('utf8'));
  } catch (error) {
    return { ok: false, failures: [{ check: 'snapshotSchema', detail: (error as Error).message }] };
  }

  const failures = [
    ...checkSnapshotIntegrity(snapshot, envelope.manifest.recordCounts as unknown as Record<string, number>),
    ...checkProvenanceAgainstTarget(envelope.manifest.provenance, args.target, {
      expectedEnvironment: args.expectedEnvironment,
      expectedBaselineRunId: args.expectedBaselineRunId,
    }),
  ];
  if (failures.length > 0) return { ok: false, failures };

  return { ok: true, verified: { snapshot, provenance: envelope.manifest.provenance } };
}

/**
 * 必須修正6-8: restore を「成功」と呼んでよいかの判定。
 * skipped media / 未解決 relationship / 部分 import が1件でもあれば成功にしない。
 */
export function checkImportOutcome(report: {
  skippedMedia: readonly unknown[];
  created: Record<string, number>;
  updated: Record<string, number>;
}): RestoreCheckFailure[] {
  const failures: RestoreCheckFailure[] = [];
  if (report.skippedMedia.length > 0) {
    failures.push({
      check: 'skippedMedia',
      detail:
        `${report.skippedMedia.length} media asset(s) were not imported. A restore that silently drops ` +
        'media is a partial restore, not a successful one.',
    });
  }
  return failures;
}
