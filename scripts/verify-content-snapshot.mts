/**
 * 署名 snapshot と Payload DB の**全 collection 完全一致**検証
 * （`docs/plans/content-platform-migration-plan-v1.md` Task 5 Step 5 / Step 7）。
 *
 * `content:compare` は「local TS vs Payload」専用で、Task 9 で local source を撤去したあとは
 * 実行できなくなる。② 以降はこのコマンドと `content:verify-conservation` の2つを使う。
 * **責務を混ぜない**（brief Step 5）:
 *
 * | コマンド | 入力 | 検証内容 |
 * |---|---|---|
 * | `content:compare` | local TS + Payload | ① cutover 前の parity のみ |
 * | `content:verify-snapshot` | 署名 snapshot + Payload | 署名 → sha256 → 全 recordCounts → ID集合 → 参照集合 → 公開状態 の完全一致 |
 * | `content:verify-conservation` | 履歴 baseline manifest | stableId **部分集合** と承認済み identity transfer だけ |
 *
 * 2つの入力形式を持つ:
 * - `--manifest <path>` — object storage 上の署名済み artifact を取得して検証する（本番経路）。
 *   **署名検証に失敗した artifact は以降の検証入力として受け付けない**（brief Step 7）。
 * - `--input <snapshot.json>` — 手元の snapshot ファイルと Payload の一致だけを見る
 *   （Step 6.5 の export → restore round-trip 用。署名は介在しない）。
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { mkdir } from 'node:fs/promises';
import type { ContentSnapshot } from '../lib/content/contracts.ts';
import {
  compareSnapshots,
  countRecords,
  formatParityReport,
  parityReportIsClean,
  type ParityReport,
} from './compare-content-sources.mts';
import { exitCli, isDirectRun, parseArgs } from './contentCliSupport.mts';
import {
  assertValidManifest,
  canonicalJson,
  sha256Hex,
  storeFromManifest,
  verifyBlobWithCosign,
  type CutoverBaselineManifest,
} from './export-content-snapshot.mts';

export interface SnapshotVerificationFailure {
  check: string;
  detail: string;
}

export interface SnapshotVerificationResult {
  ok: boolean;
  failures: SnapshotVerificationFailure[];
  parity?: ParityReport;
}

/**
 * manifest の `recordCounts` が **artifact 本体から数えた件数**と一致するか。
 * brief Step 7: 「media は export が snapshot から数えた値を manifest へ書き、compare が
 * snapshot 本体の件数と一致することを検証する」。media 以外も同じ扱いにする。
 */
export function verifyRecordCounts(
  manifest: CutoverBaselineManifest,
  snapshot: ContentSnapshot,
): SnapshotVerificationFailure[] {
  const actual = countRecords(snapshot);
  const failures: SnapshotVerificationFailure[] = [];
  for (const [key, expected] of Object.entries(manifest.recordCounts)) {
    if (actual[key] !== expected) {
      failures.push({
        check: 'recordCounts',
        detail: `${key}: manifest says ${expected}, artifact contains ${actual[key]}`,
      });
    }
  }
  return failures;
}

async function tempDir(): Promise<string> {
  const dir = path.join(os.tmpdir(), `deploid-verify-${process.pid}-${Date.now()}`);
  await mkdir(dir, { recursive: true });
  return dir;
}

export interface LoadedArtifact {
  snapshot: ContentSnapshot;
  failures: SnapshotVerificationFailure[];
}

/**
 * manifest から artifact を取得し、**署名 → sha256 → recordCounts** の順に検証する。
 * 署名検証に失敗した時点で snapshot を返さない（改ざんされた artifact を後段の
 * compare / restore の入力にしない、brief Step 7）。
 */
export async function loadVerifiedArtifact(
  manifest: CutoverBaselineManifest,
  options: { allowLocalStore?: boolean } = {},
): Promise<LoadedArtifact | { failures: SnapshotVerificationFailure[] }> {
  const failures: SnapshotVerificationFailure[] = [];

  if (manifest.storage.provider === 'local-disk' && !options.allowLocalStore) {
    return {
      failures: [
        {
          check: 'storage.provider',
          detail:
            'manifest points at a local-disk store. Real baselines live in the private object store; ' +
            'pass --allow-local-store only for round-trip tests.',
        },
      ],
    };
  }

  const store = storeFromManifest(manifest);
  const artifact = await store.get(manifest.storage.objectKey);
  const signatureBundle = await store.get(manifest.signature.detachedSignatureObjectKey);

  const workDir = await tempDir();
  const artifactPath = path.join(workDir, 'snapshot.json');
  const bundlePath = path.join(workDir, 'snapshot.cosign.bundle');
  await writeFile(artifactPath, artifact);
  await writeFile(bundlePath, signatureBundle);

  const signature = await verifyBlobWithCosign(artifactPath, bundlePath);
  if (!signature.verified) {
    return { failures: [{ check: 'signature', detail: signature.detail }] };
  }

  const digest = sha256Hex(artifact);
  if (digest !== manifest.sha256) {
    return {
      failures: [{ check: 'sha256', detail: `manifest says ${manifest.sha256}, artifact hashes to ${digest}` }],
    };
  }

  const snapshot = JSON.parse(artifact.toString('utf8')) as ContentSnapshot;
  failures.push(...verifyRecordCounts(manifest, snapshot));
  if (failures.length > 0) return { failures };

  return { snapshot, failures };
}

/** snapshot と Payload DB の全 collection 完全一致（ID集合・参照集合・公開状態を含む）。 */
export function verifyAgainstPayloadSnapshot(
  expected: ContentSnapshot,
  actual: ContentSnapshot,
): SnapshotVerificationResult {
  const parity = compareSnapshots(expected, actual);
  if (parityReportIsClean(parity)) return { ok: true, failures: [], parity };
  return {
    ok: false,
    failures: [
      {
        check: 'parity',
        detail:
          `missing=${parity.missing.length} extra=${parity.extra.length} ` +
          `changed=${parity.changed.length} brokenReferences=${parity.brokenReferences.length}`,
      },
    ],
    parity,
  };
}

// ─── CLI ─────────────────────────────────────────────────────────────────

const HELP = [
  'content:verify-snapshot — 署名 snapshot と Payload DB の全 collection 完全一致を検証する。',
  '',
  '  --manifest <path>       署名済み baseline manifest（本番経路。署名 + sha256 + counts + parity）',
  '  --input <snapshot.json> 手元 snapshot と Payload の parity のみ（Step 6.5 の round-trip 用）',
  '  --allow-local-store     local-disk store の manifest を受け付ける（round-trip テスト用）',
  '  --json <path>           parity レポートを JSON で書き出す',
  '',
].join('\n');

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.has('help')) {
    process.stdout.write(HELP);
    return;
  }

  const manifestPath = args.get('manifest');
  const inputPath = args.get('input');
  if (typeof manifestPath !== 'string' && typeof inputPath !== 'string') {
    throw new Error('content:verify-snapshot requires --manifest <path> or --input <snapshot.json>.');
  }
  if (typeof manifestPath === 'string' && typeof inputPath === 'string') {
    throw new Error('content:verify-snapshot takes either --manifest or --input, not both.');
  }

  let expected: ContentSnapshot;
  if (typeof manifestPath === 'string') {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as unknown;
    assertValidManifest(manifest);
    process.stdout.write(`manifest schema: ok (${manifest.storage.provider}:${manifest.storage.objectKey})\n`);

    const loaded = await loadVerifiedArtifact(manifest, { allowLocalStore: args.has('allow-local-store') });
    if (!('snapshot' in loaded)) {
      for (const failure of loaded.failures) process.stderr.write(`FAIL ${failure.check}: ${failure.detail}\n`);
      process.exitCode = 1;
      return;
    }
    process.stdout.write('cosign signature: verified\n');
    process.stdout.write(`sha256: ${manifest.sha256} (matches artifact)\n`);
    process.stdout.write('recordCounts: match the artifact body\n');
    expected = loaded.snapshot;
  } else {
    const raw = await readFile(inputPath as string, 'utf8');
    expected = JSON.parse(raw) as ContentSnapshot;
    process.stdout.write(`input snapshot: ${inputPath} (sha256=${sha256Hex(canonicalJson(expected))})\n`);
  }

  const { createPayloadContentSource } = await import('../lib/content/payloadSource.ts');
  const actual = await createPayloadContentSource().readSnapshot();

  const result = verifyAgainstPayloadSnapshot(expected, actual);
  process.stdout.write(`${formatParityReport(result.parity as ParityReport)}\n`);

  const jsonPath = args.get('json');
  if (typeof jsonPath === 'string') {
    await writeFile(jsonPath, `${JSON.stringify(result.parity, null, 2)}\n`, 'utf8');
    process.stdout.write(`wrote JSON report: ${jsonPath}\n`);
  }

  if (!result.ok) {
    for (const failure of result.failures) process.stderr.write(`FAIL ${failure.check}: ${failure.detail}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write('content:verify-snapshot: OK — snapshot and Payload match on every collection.\n');
}

if (isDirectRun(import.meta.url)) {
  await main();
  await exitCli();
}
