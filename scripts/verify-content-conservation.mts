/**
 * 履歴 baseline の **stableId 部分集合**保全と、承認済み identity transfer だけを検証する
 * （`docs/plans/content-platform-migration-plan-v1.md` Task 5 Step 5、② §0 G-3 の入力）。
 *
 * `content:verify-snapshot` との違いを混ぜない（brief Step 5）:
 * - `content:verify-snapshot` は「署名 snapshot と Payload DB が**全 collection 完全一致**」。
 *   ② のように import で新レコードが増えたあとは、定義上まず通らない。
 * - `content:verify-conservation` は「① cutover 時点の baseline に載っていた stableId が
 *   **今も1件残らず存在する**（部分集合）」だけを見る。新規レコードの増加は差分にしない。
 *
 * 「identity transfer」= 承認済みの id 付け替え（例: 統合により旧 stableId が新 stableId へ
 * 引き継がれた）。承認記録が無い消失は保全違反として扱い、exit 1 にする。
 *
 * このコマンドの実復元対象は ② 開始時に新規生成する `pre-robot-import-manifest.json` であり、
 * 古い cutover baseline を ② 開始時点の完全復元へ流用しない（brief Step 7 の注記）。
 */
import { readFile } from 'node:fs/promises';
import type { ContentSnapshot } from '../lib/content/contracts.ts';
import type { ParityCollection } from './compare-content-sources.mts';
import { exitCli, isDirectRun, parseArgs } from './contentCliSupport.mts';
import { assertValidEnvelope, verifyManifestSignature } from './export-content-snapshot.mts';
import { loadVerifiedArtifact } from './verify-content-snapshot.mts';

const CONSERVED_COLLECTIONS = [
  'manufacturers',
  'robotSeries',
  'robots',
  'distributors',
  'useCases',
  'deployments',
  'articles',
  'articlePlacements',
  'media',
] as const satisfies readonly ParityCollection[];

/**
 * 承認済み identity transfer。`approvedBy` / `approvedAt` が無いものは承認記録として扱わない
 * （口頭確認だけを gate 通過にしない、という Task 0.5 の運用ルールと同じ扱い）。
 */
export interface IdentityTransfer {
  collection: ParityCollection;
  from: string;
  to: string;
  approvedBy: string;
  approvedAt: string;
  reason: string;
}

export function assertValidIdentityTransfers(value: unknown): asserts value is IdentityTransfer[] {
  if (!Array.isArray(value)) throw new Error('identity-transfers-invalid: expected an array');
  value.forEach((entry, index) => {
    const row = entry as Partial<IdentityTransfer>;
    const missing = (['collection', 'from', 'to', 'approvedBy', 'approvedAt', 'reason'] as const).filter(
      (key) => typeof row?.[key] !== 'string' || (row[key] as string).length === 0,
    );
    if (missing.length > 0) {
      throw new Error(`identity-transfers-invalid: entry ${index} missing ${missing.join(', ')}`);
    }
  });
}

export interface ConservationViolation {
  collection: ParityCollection;
  stableId: string;
  reason: 'missing-from-current' | 'transfer-target-missing';
  detail?: string;
}

export interface ConservationResult {
  ok: boolean;
  checkedIds: number;
  appliedTransfers: number;
  violations: ConservationViolation[];
}

/**
 * baseline の stableId 集合が現在の Payload snapshot の**部分集合**であることを検証する。
 * 承認済み transfer がある id は、transfer 先 id が存在すれば保全されたとみなす。
 */
export function verifyStableIdConservation(
  baseline: ContentSnapshot,
  current: ContentSnapshot,
  transfers: readonly IdentityTransfer[] = [],
): ConservationResult {
  const violations: ConservationViolation[] = [];
  let checkedIds = 0;
  let appliedTransfers = 0;

  const transferIndex = new Map<string, IdentityTransfer>();
  for (const transfer of transfers) transferIndex.set(`${transfer.collection}:${transfer.from}`, transfer);

  for (const collection of CONSERVED_COLLECTIONS) {
    const currentIds = new Set((current[collection] as readonly { id: string }[]).map((record) => record.id));
    for (const record of baseline[collection] as readonly { id: string }[]) {
      checkedIds += 1;
      if (currentIds.has(record.id)) continue;

      const transfer = transferIndex.get(`${collection}:${record.id}`);
      if (!transfer) {
        violations.push({ collection, stableId: record.id, reason: 'missing-from-current' });
        continue;
      }
      appliedTransfers += 1;
      if (!currentIds.has(transfer.to)) {
        violations.push({
          collection,
          stableId: record.id,
          reason: 'transfer-target-missing',
          detail: `approved transfer to "${transfer.to}" but that id does not exist either`,
        });
      }
    }
  }

  return { ok: violations.length === 0, checkedIds, appliedTransfers, violations };
}

// ─── CLI ─────────────────────────────────────────────────────────────────

const HELP = [
  'content:verify-conservation — 履歴 baseline の stableId 部分集合保全だけを検証する。',
  '',
  '  --manifest <path>            署名済み baseline envelope（必須）',
  '  --stable-id-subset           このモードを明示する（必須。責務を混ぜないための明示フラグ）',
  '  --identity-transfers <path>  承認済み identity transfer の JSON 配列',
  '  --allow-local-store          local-disk store の manifest を受け付ける（テスト用）',
  '',
  '全 collection の完全一致が要るときは content:verify-snapshot を使う（責務が別）。',
  '',
].join('\n');

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.has('help')) {
    process.stdout.write(HELP);
    return;
  }

  const manifestPath = args.get('manifest');
  if (typeof manifestPath !== 'string') throw new Error('content:verify-conservation requires --manifest <path>.');
  if (!args.has('stable-id-subset')) {
    throw new Error(
      'content:verify-conservation requires --stable-id-subset. It only verifies stable-id conservation; ' +
        'use content:verify-snapshot for full-parity verification.',
    );
  }

  // 必須修正6-10: bare manifest ではなく署名済み envelope を受け付ける。
  const envelope = JSON.parse(await readFile(manifestPath, 'utf8')) as unknown;
  assertValidEnvelope(envelope);
  const manifestSignature = await verifyManifestSignature(envelope);
  if (!manifestSignature.verified) {
    process.stderr.write(`FAIL manifestSignature: ${manifestSignature.detail}\n`);
    process.exitCode = 1;
    return;
  }

  const loaded = await loadVerifiedArtifact(envelope.manifest, { allowLocalStore: args.has('allow-local-store') });
  if (!('snapshot' in loaded)) {
    for (const failure of loaded.failures) process.stderr.write(`FAIL ${failure.check}: ${failure.detail}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write('cosign signature: verified\nsha256: matches artifact\n');

  let transfers: IdentityTransfer[] = [];
  const transfersPath = args.get('identity-transfers');
  if (typeof transfersPath === 'string') {
    const parsed = JSON.parse(await readFile(transfersPath, 'utf8')) as unknown;
    assertValidIdentityTransfers(parsed);
    transfers = parsed;
  }

  const { createPayloadContentSource } = await import('../lib/content/payloadSource.ts');
  const current = await createPayloadContentSource().readSnapshot();

  const result = verifyStableIdConservation(loaded.snapshot, current, transfers);
  process.stdout.write(
    `checked ${result.checkedIds} baseline stable ids, applied ${result.appliedTransfers} approved transfer(s), ` +
      `${result.violations.length} violation(s)\n`,
  );

  if (!result.ok) {
    for (const violation of result.violations.slice(0, 50)) {
      process.stderr.write(
        `FAIL ${violation.collection}/${violation.stableId}: ${violation.reason}` +
          `${violation.detail ? ` — ${violation.detail}` : ''}\n`,
      );
    }
    if (result.violations.length > 50) {
      process.stderr.write(`... ${result.violations.length - 50} more violations\n`);
    }
    process.exitCode = 1;
    return;
  }
  process.stdout.write('content:verify-conservation: OK — every baseline stable id is still present.\n');
}

if (isDirectRun(import.meta.url)) {
  await main();
  await exitCli();
}
