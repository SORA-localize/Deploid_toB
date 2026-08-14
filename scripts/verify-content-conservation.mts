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
import {
  assertValidEnvelope,
  assertValidSignedJsonDocument,
  verifyJsonDocumentSignature,
  verifyManifestSignature,
} from './export-content-snapshot.mts';
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

/**
 * 必須修正10-6: transfer は**署名済み文書**として渡す。`baselineRunId` を持たせて、
 * ある baseline のために承認した transfer が別の baseline へ流用されないようにする。
 */
export interface IdentityTransferDocument {
  /** この transfer 群が承認された対象 baseline（manifest の `provenance.baselineRunId`）。 */
  baselineRunId: string;
  transfers: IdentityTransfer[];
}

const IDENTITY_TRANSFER_KEYS = ['collection', 'from', 'to', 'approvedBy', 'approvedAt', 'reason'] as const;

/**
 * 必須修正10-2: `approvedAt` を**厳密な日付**として検証する。
 * `YYYY-MM-DD`（暦として実在する日）か、ISO instant のどちらかだけを受け付ける。
 * 「日付らしい非空文字列」ではなく、**日付**であることを要求する。
 */
export function isStrictApprovalDate(value: string): boolean {
  const dayMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dayMatch) {
    const [, year, month, day] = dayMatch;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    return date.getUTCFullYear() === Number(year)
      && date.getUTCMonth() === Number(month) - 1
      && date.getUTCDate() === Number(day);
  }
  if (!/^\d{4}-\d{2}-\d{2}T[\d:.]+(Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
  return !Number.isNaN(Date.parse(value));
}

export class IdentityTransferError extends Error {
  constructor(public readonly problems: readonly string[]) {
    super(`identity-transfers-invalid: ${problems.join('; ')}`);
    this.name = 'IdentityTransferError';
  }
}

/**
 * 必須修正10-1〜10-4: identity transfer を `scripts/snapshotSchema.mts` と同じ厳密さで検証する。
 *
 * 監査の指摘（原文）:
 * > `collection`/`from`/`to`/`approvedBy`/`approvedAt`/`reason` が非空文字列であることしか
 * > 検査しない。`collection` が実在する collection 名かの検証なし、`approvedAt` が有効な日付かの
 * > 検証なし、`from !== to` の検証なし、同じ `from` を持つ重複 entry の検出なし
 * > （`transferIndex` は Map なので後着が黙って上書きする）、chain/cycle 検出なし。
 *
 * ここで拒否するもの:
 * - 未知 collection / 未知 field（typo を黙って捨てない）
 * - 日付でない `approvedAt`
 * - `from === to`（何も起きていない transfer を「承認済みの付け替え」として通さない）
 * - 同じ `from` の重複、同じ `to` の重複（重複は上書きではなくエラー）
 * - chain（a→b, b→c）と cycle（a→b, b→a）——どちらも「どの id がどこへ行ったか」が
 *   1手で決まらないので、機械判定に任せず人間の再承認へ倒す
 * - cross-collection（ある id が collection A では `from`、B では `to`）
 */
export function parseIdentityTransfers(value: unknown): IdentityTransfer[] {
  const problems: string[] = [];
  if (!Array.isArray(value)) throw new IdentityTransferError(['expected an array of transfers']);

  const transfers: IdentityTransfer[] = [];
  value.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      problems.push(`entry ${index}: expected an object`);
      return;
    }
    const row = entry as Record<string, unknown>;

    const unknownKeys = Object.keys(row).filter(
      (key) => !(IDENTITY_TRANSFER_KEYS as readonly string[]).includes(key),
    );
    if (unknownKeys.length > 0) problems.push(`entry ${index}: unknown field(s) ${unknownKeys.join(', ')}`);

    const missing = IDENTITY_TRANSFER_KEYS.filter(
      (key) => typeof row[key] !== 'string' || (row[key] as string).length === 0,
    );
    if (missing.length > 0) {
      problems.push(`entry ${index} missing ${missing.join(', ')}`);
      return;
    }

    // 必須修正10-1: collection は許可 enum のみ。
    if (!(CONSERVED_COLLECTIONS as readonly string[]).includes(row.collection as string)) {
      problems.push(
        `entry ${index}: unknown collection "${row.collection as string}" ` +
          `(expected one of ${CONSERVED_COLLECTIONS.join(', ')})`,
      );
    }
    // 必須修正10-2: 日付として検証する。
    if (!isStrictApprovalDate(row.approvedAt as string)) {
      problems.push(`entry ${index}: approvedAt "${row.approvedAt as string}" is not a real date (YYYY-MM-DD or ISO instant)`);
    }
    // 必須修正10-3: from === to は付け替えではない。
    if (row.from === row.to) {
      problems.push(`entry ${index}: from and to are the same id ("${row.from as string}")`);
    }

    transfers.push(entry as IdentityTransfer);
  });

  if (problems.length > 0) throw new IdentityTransferError(problems);

  // 必須修正10-3/10-4: 重複・chain・cycle・cross-collection。Map へ入れて上書きさせない。
  const fromKeys = new Map<string, number>();
  const toKeys = new Map<string, number>();
  const fromIds = new Map<string, ParityCollection>();
  const toIds = new Map<string, ParityCollection>();

  for (const [index, transfer] of transfers.entries()) {
    const fromKey = `${transfer.collection}:${transfer.from}`;
    const toKey = `${transfer.collection}:${transfer.to}`;
    if (fromKeys.has(fromKey)) {
      problems.push(
        `entry ${index}: duplicate transfer for ${fromKey} (already declared by entry ${fromKeys.get(fromKey)}). ` +
          'A stable id can only be transferred once; the later entry must not silently win.',
      );
    } else {
      fromKeys.set(fromKey, index);
    }
    if (toKeys.has(toKey)) {
      problems.push(
        `entry ${index}: two transfers target the same id ${toKey} (also entry ${toKeys.get(toKey)}). ` +
          'Merging two ids into one needs an explicit human decision per id, not an implicit collapse.',
      );
    } else {
      toKeys.set(toKey, index);
    }
    fromIds.set(transfer.from, transfer.collection);
    toIds.set(transfer.to, transfer.collection);
  }

  for (const transfer of transfers) {
    // chain / cycle: transfer 先がさらに別の transfer の元になっている。
    if (fromKeys.has(`${transfer.collection}:${transfer.to}`)) {
      problems.push(
        `${transfer.collection}: "${transfer.from}" -> "${transfer.to}" chains into another transfer of ` +
          `"${transfer.to}". Chains and cycles are rejected: record the final destination for each id instead.`,
      );
    }
    // cross-collection: 同じ id が別 collection の transfer にも現れる。
    const asTarget = toIds.get(transfer.from);
    if (asTarget !== undefined && asTarget !== transfer.collection) {
      problems.push(
        `"${transfer.from}" is transferred in ${transfer.collection} but is also a transfer target in ` +
          `${asTarget}. Identity never moves across collections.`,
      );
    }
  }

  if (problems.length > 0) throw new IdentityTransferError([...new Set(problems)]);
  return transfers;
}

/** 署名済み文書の中身（`{ baselineRunId, transfers }`）を検証する（必須修正10-6）。 */
export function parseIdentityTransferDocument(value: unknown): IdentityTransferDocument {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new IdentityTransferError([
      'expected a signed identity transfer document { baselineRunId, transfers }. A bare JSON array of ' +
        'transfers is a self-attested claim, not an approval (必須修正10-5).',
    ]);
  }
  const document = value as Partial<IdentityTransferDocument>;
  const problems: string[] = [];
  if (typeof document.baselineRunId !== 'string' || document.baselineRunId.length === 0) {
    problems.push('baselineRunId is required so an approval cannot be reused for a different baseline');
  }
  const unknownKeys = Object.keys(document).filter((key) => !['baselineRunId', 'transfers'].includes(key));
  if (unknownKeys.length > 0) problems.push(`unknown field(s) ${unknownKeys.join(', ')}`);
  if (problems.length > 0) throw new IdentityTransferError(problems);

  return { baselineRunId: document.baselineRunId as string, transfers: parseIdentityTransfers(document.transfers) };
}

/**
 * 後方互換の名前（既存の呼び出し元とテストが使っている）。中身は厳密検証になった。
 */
export function assertValidIdentityTransfers(value: unknown): asserts value is IdentityTransfer[] {
  parseIdentityTransfers(value);
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

  // 必須修正10-4: **重複を Map で上書きしない**。以前はここが `Map.set` の素通しで、同じ
  // `collection:from` を持つ2件目が黙って1件目を置き換えていた（= 「承認した宛先」と「実際に
  // 適用される宛先」が食い違う）。index を作る前に厳密検証を通し、重複があれば例外にする。
  parseIdentityTransfers(transfers as unknown);
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
  '  --identity-transfers <path>  **署名済み** identity transfer 文書',
  '                               （{ document: { baselineRunId, transfers }, signature }）',
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

  // 必須修正10-5/10-6: identity transfer は**署名済み文書**でしか受け付けない。
  // 「`approvedBy: "誰か"` と書いた JSON」は承認ではなく自己申告であり、それだけで
  // 消失した stable ID を「保全済み」にはできない。
  let transfers: IdentityTransfer[] = [];
  const transfersPath = args.get('identity-transfers');
  if (typeof transfersPath === 'string') {
    const signed = JSON.parse(await readFile(transfersPath, 'utf8')) as unknown;
    try {
      assertValidSignedJsonDocument(signed);
    } catch (error) {
      process.stderr.write(
        `FAIL identityTransferSignature: ${(error as Error).message}. An identity transfer manifest must be ` +
          'a cosign-signed document ({ document: { baselineRunId, transfers }, signature }); a plain JSON ' +
          'array of self-attested approvals is not accepted (必須修正10-5).\n',
      );
      process.exitCode = 1;
      return;
    }

    const signature = await verifyJsonDocumentSignature(signed);
    if (!signature.verified) {
      process.stderr.write(`FAIL identityTransferSignature: ${signature.detail}\n`);
      process.exitCode = 1;
      return;
    }

    let document: IdentityTransferDocument;
    try {
      document = parseIdentityTransferDocument(signed.document);
    } catch (error) {
      process.stderr.write(`FAIL identityTransfers: ${(error as Error).message}\n`);
      process.exitCode = 1;
      return;
    }

    // 承認は「この baseline に対して」出されたもの。別 baseline へ流用させない。
    if (document.baselineRunId !== envelope.manifest.provenance.baselineRunId) {
      process.stderr.write(
        `FAIL identityTransferBaseline: the approval is for baseline "${document.baselineRunId}" but this ` +
          `run verifies baseline "${envelope.manifest.provenance.baselineRunId}".\n`,
      );
      process.exitCode = 1;
      return;
    }

    transfers = document.transfers;
    process.stdout.write(`identity transfers: ${transfers.length} approved and signed for this baseline\n`);
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
