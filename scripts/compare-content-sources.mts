/**
 * content source parity 比較（`docs/plans/content-platform-migration-plan-v1.md` Task 5 Step 4）。
 *
 * `compareSnapshots()` は **純粋関数**（I/O・Payload・環境変数に一切触れない）。CLI 部分だけが
 * 動的 import で `lib/content/*` を読み込む。`payload.config.ts` は import 時に `buildConfig()` を
 * 評価して `DATABASE_URL` / `PAYLOAD_SECRET` を要求するため、静的 import にすると比較ロジックの
 * unit test まで DB 接続情報を要求してしまう。
 *
 * ## 比較対象（brief Step 4）
 *
 * - collectionごとの件数（`missing` / `extra` の裏返し。件数だけの検査も CLI が別途表示する）
 * - stable ID集合
 * - slug / previousSlugs（順序を含め完全一致。①ではURL waiverなし）
 * - publish status
 * - relationship ID集合と順序
 * - sources URL / checkedAt / reliability
 * - image rights metadata
 * - robot specs / evidence
 * - article body と placement
 *
 * 実装は「この列挙をホワイトリストにする」のではなく、**`updatedAt` 以外の全 domain field を
 * 比較し、上記が必ずその部分集合になる**ようにしている。列挙だけを見る実装だと、`description` や
 * `specs` 以外の本文 field が黙って落ちても parity 0 差分になり、cutover の安全網として弱いため。
 *
 * ## 除外（brief Step 4: 「日時、Payload内部ID、version metadataは比較対象から除外する」）
 *
 * - `updatedAt`: Payload が自分で管理する行更新時刻。import すると必ず変わる。
 * - Payload 内部ID / version metadata: canonical domain 型（`lib/content/domainTypes.ts`）が
 *   そもそも持たない。mapper が stableId へ解決済みで、両 source の snapshot に現れない。
 * - **コンテンツ由来の日時（`checkedAt` / `publishedAt` / `nextReviewBy`）は除外しない。**
 *   brief が `sources ... checkedAt` を明示的に比較対象へ挙げているため。ただし Payload の
 *   `type: 'date'` field は `'2026-07-16'` を timestamptz として保存し `'2026-07-16T00:00:00.000Z'`
 *   として読み戻すので、**表記ではなく時刻として**比較する（`DATE_FIELDS`）。
 */
import type { ContentSnapshot } from '../lib/content/contracts.ts';
import { deriveMediaFromSnapshot } from './import-content-to-payload.mts';
import { exitCli, isDirectRun, parseArgs } from './contentCliSupport.mts';

// ─── report 型 ────────────────────────────────────────────────────────────

/** 比較単位の collection 名。`ContentSnapshot` の key と一致させる。 */
export type ParityCollection =
  | 'manufacturers'
  | 'robotSeries'
  | 'robots'
  | 'distributors'
  | 'useCases'
  | 'deployments'
  | 'articles'
  | 'articlePlacements'
  | 'media'
  | 'siteSettings';

export interface ParityMissing {
  collection: ParityCollection;
  id: string;
}

export interface ParityChange {
  collection: ParityCollection;
  id: string;
  /** `sources[1].checkedAt` のような field path。 */
  field: string;
  expected: unknown;
  actual: unknown;
  /**
   * `slug` / `previousSlugs` / そこから導出した公開URL の差分。brief Step 4 の
   * 「1件でも差があれば exit 1 にし Task 9 へ進まない」対象。
   */
  urlCritical?: true;
}

export interface ParityBrokenReference {
  collection: ParityCollection;
  id: string;
  field: string;
  referencedCollection: ParityCollection;
  referencedId: string;
  /** どちら側の snapshot 内で解決できなかったか。 */
  side: 'expected' | 'actual';
}

export interface ParityReport {
  missing: ParityMissing[];
  extra: ParityMissing[];
  changed: ParityChange[];
  brokenReferences: ParityBrokenReference[];
}

// ─── 比較の下ごしらえ ──────────────────────────────────────────────────────

/** collection ごとの record を id で引ける形にする。 */
const RECORD_COLLECTIONS = [
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

/** Payload が `type: 'date'` として保存し、表記が変わりうる field 名。時刻として比較する。 */
const DATE_FIELDS = new Set(['checkedAt', 'publishedAt', 'nextReviewBy']);

/** 行の更新時刻。両 source で一致しえないため比較しない（brief Step 4）。 */
const EXCLUDED_TOP_LEVEL_FIELDS = new Set(['updatedAt']);

/**
 * collection 固有の除外。
 *
 * `media` の `url` / `filesize` / `width` / `height` / `mimeType` は **storage adapter が
 * 払い出す属性**であって content ではない。local `data/*.ts` 側の `ImageAsset.src`
 * （`/images/robots/x.png`）と Payload 側の upload URL（local disk なら
 * `/api/media/file/x.png`、Vercel Blob なら `https://<store>.public.blob.vercel-storage.com/...`）は
 * 定義上一致しないため、これらを比較対象に入れると media が全件 `changed` になる。
 * brief Step 4 が media について挙げているのは "image rights metadata" であり、
 * `id` / `filename` / `alt` / `rights` はここでも比較し続ける。
 * artifact そのものの改ざん検知は manifest の sha256 + cosign 署名が担う。
 */
const EXCLUDED_FIELDS_BY_COLLECTION: Partial<Record<ParityCollection, ReadonlySet<string>>> = {
  media: new Set(['url', 'filesize', 'width', 'height', 'mimeType']),
};

/** 公開URLの正本パターン（`src/app/(frontend)/**` の実ルート）。無い collection は URL を持たない。 */
const PUBLIC_URL_PREFIX: Partial<Record<ParityCollection, string>> = {
  manufacturers: '/manufacturers/',
  // `robots` と `robotSeries` は同じ `/robots/[slug]` namespace を共有する。
  robots: '/robots/',
  robotSeries: '/robots/',
  useCases: '/use-cases/',
  articles: '/reports/',
};

export function publicUrlFor(collection: ParityCollection, slug: string): string | undefined {
  const prefix = PUBLIC_URL_PREFIX[collection];
  return prefix === undefined ? undefined : `${prefix}${slug}`;
}

/** relationship field の宣言。参照整合性（`brokenReferences`）の検査に使う。 */
interface ReferenceRule {
  /** record からの参照値を field path つきで取り出す。 */
  extract: (record: Record<string, unknown>) => Array<{ field: string; target: ParityCollection; id: string }>;
}

function ref(
  field: string,
  target: ParityCollection,
  value: unknown,
): Array<{ field: string; target: ParityCollection; id: string }> {
  if (typeof value === 'string' && value.length > 0) return [{ field, target, id: value }];
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      typeof entry === 'string' && entry.length > 0 ? [{ field: `${field}[${index}]`, target, id: entry }] : [],
    );
  }
  return [];
}

const REFERENCE_RULES: Partial<Record<ParityCollection, ReferenceRule>> = {
  robotSeries: {
    extract: (record) => ref('manufacturerId', 'manufacturers', record.manufacturerId),
  },
  robots: {
    extract: (record) => [
      ...ref('manufacturerId', 'manufacturers', record.manufacturerId),
      ...ref('seriesId', 'robotSeries', record.seriesId),
      ...ref('supersededById', 'robots', record.supersededById),
    ],
  },
  distributors: {
    extract: (record) => [
      ...ref('handledManufacturerIds', 'manufacturers', record.handledManufacturerIds),
      ...ref('handledRobotIds', 'robots', record.handledRobotIds),
    ],
  },
  useCases: {
    extract: (record) => {
      const candidates = Array.isArray(record.candidateRobots) ? record.candidateRobots : [];
      return candidates.flatMap((candidate, index) => {
        const row = candidate as Record<string, unknown>;
        return [
          ...ref(`candidateRobots[${index}].robotId`, 'robots', row.robotId),
          ...ref(`candidateRobots[${index}].seriesId`, 'robotSeries', row.seriesId),
          ...ref(`candidateRobots[${index}].evidenceDeploymentIds`, 'deployments', row.evidenceDeploymentIds),
        ];
      });
    },
  },
  deployments: {
    extract: (record) => [
      ...ref('manufacturerId', 'manufacturers', record.manufacturerId),
      ...ref('robotId', 'robots', record.robotId),
      ...ref('relatedUseCaseIds', 'useCases', record.relatedUseCaseIds),
    ],
  },
  articles: {
    extract: (record) => {
      const guide = record.manufacturerGuideContent as { lineup?: Array<{ robotId?: string }> } | undefined;
      const lineup = Array.isArray(guide?.lineup) ? guide.lineup : [];
      return [
        ...ref('relatedRobotIds', 'robots', record.relatedRobotIds),
        ...ref('relatedManufacturerIds', 'manufacturers', record.relatedManufacturerIds),
        ...ref('relatedUseCaseIds', 'useCases', record.relatedUseCaseIds),
        ...lineup.flatMap((row, index) =>
          ref(`manufacturerGuideContent.lineup[${index}].robotId`, 'robots', row?.robotId),
        ),
      ];
    },
  },
  articlePlacements: {
    extract: (record) => ref('articleId', 'articles', record.articleId),
  },
};

// ─── 値の比較 ─────────────────────────────────────────────────────────────

/** `undefined` と `null` はどちらも「値なし」として同一視する（domain 型は `null` を使わない）。 */
function isAbsent(value: unknown): boolean {
  return value === undefined || value === null;
}

/**
 * 日時 field を「表記」ではなく「時刻」として比べる。Payload の `type: 'date'` が
 * `'2026-07-16'` を `'2026-07-16T00:00:00.000Z'` として読み戻すのを差分にしないため。
 * どちらかが日時としてparseできない場合は文字列としてそのまま比較する（雑に一致扱いしない）。
 */
function dateValuesEqual(a: unknown, b: unknown): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a === b) return true;
  const left = Date.parse(a);
  const right = Date.parse(b);
  if (Number.isNaN(left) || Number.isNaN(right)) return false;
  return left === right;
}

function diffValues(
  path: string,
  fieldName: string,
  expected: unknown,
  actual: unknown,
  out: Array<{ field: string; expected: unknown; actual: unknown }>,
): void {
  if (isAbsent(expected) && isAbsent(actual)) return;
  if (isAbsent(expected) !== isAbsent(actual)) {
    out.push({ field: path, expected, actual });
    return;
  }

  if (DATE_FIELDS.has(fieldName) && dateValuesEqual(expected, actual)) return;

  if (Array.isArray(expected) || Array.isArray(actual)) {
    if (!Array.isArray(expected) || !Array.isArray(actual)) {
      out.push({ field: path, expected, actual });
      return;
    }
    // 順序も比較対象（brief: 「relationship ID集合と順序」「previousSlugs（順序を含め完全一致）」）。
    if (expected.length !== actual.length) {
      out.push({ field: `${path}.length`, expected: expected.length, actual: actual.length });
    }
    const length = Math.max(expected.length, actual.length);
    for (let index = 0; index < length; index += 1) {
      diffValues(`${path}[${index}]`, fieldName, expected[index], actual[index], out);
    }
    return;
  }

  const expectedIsObject = typeof expected === 'object';
  const actualIsObject = typeof actual === 'object';
  if (expectedIsObject || actualIsObject) {
    if (!expectedIsObject || !actualIsObject) {
      out.push({ field: path, expected, actual });
      return;
    }
    const left = expected as Record<string, unknown>;
    const right = actual as Record<string, unknown>;
    const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort();
    for (const key of keys) {
      diffValues(`${path}.${key}`, key, left[key], right[key], out);
    }
    return;
  }

  if (expected !== actual) out.push({ field: path, expected, actual });
}

function diffRecords(
  expected: Record<string, unknown>,
  actual: Record<string, unknown>,
  collection?: ParityCollection,
): Array<{ field: string; expected: unknown; actual: unknown }> {
  const out: Array<{ field: string; expected: unknown; actual: unknown }> = [];
  const collectionExcluded = collection ? EXCLUDED_FIELDS_BY_COLLECTION[collection] : undefined;
  const keys = [...new Set([...Object.keys(expected), ...Object.keys(actual)])].sort();
  for (const key of keys) {
    if (EXCLUDED_TOP_LEVEL_FIELDS.has(key)) continue;
    if (collectionExcluded?.has(key)) continue;
    diffValues(key, key, expected[key], actual[key], out);
  }
  return out;
}

/** `slug` / `previousSlugs` / 導出公開URL に触れる差分か。 */
function isUrlCritical(field: string): boolean {
  return field === 'slug' || field === 'publicUrl' || field.startsWith('slug.') || field.startsWith('previousSlugs');
}

function indexById(records: readonly unknown[]): Map<string, Record<string, unknown>> {
  const map = new Map<string, Record<string, unknown>>();
  for (const record of records) {
    const row = record as Record<string, unknown>;
    map.set(String(row.id), row);
  }
  return map;
}

function collectBrokenReferences(
  snapshot: ContentSnapshot,
  side: 'expected' | 'actual',
): ParityBrokenReference[] {
  const known = new Map<ParityCollection, Set<string>>();
  for (const collection of RECORD_COLLECTIONS) {
    known.set(
      collection,
      new Set((snapshot[collection] as readonly { id: string }[]).map((record) => record.id)),
    );
  }

  const broken: ParityBrokenReference[] = [];
  for (const collection of RECORD_COLLECTIONS) {
    const rule = REFERENCE_RULES[collection];
    if (!rule) continue;
    for (const record of snapshot[collection] as readonly unknown[]) {
      const row = record as Record<string, unknown>;
      for (const reference of rule.extract(row)) {
        if (known.get(reference.target)?.has(reference.id)) continue;
        broken.push({
          collection,
          id: String(row.id),
          field: reference.field,
          referencedCollection: reference.target,
          referencedId: reference.id,
          side,
        });
      }
    }
  }
  return broken;
}

/**
 * 2つの `ContentSnapshot` を比較する。`expected` は移行元（① では local TS、round-trip では
 * export した snapshot）、`actual` は移行先（Payload）。
 *
 * 差分が1件も無ければ `{ missing: [], extra: [], changed: [], brokenReferences: [] }` を返す。
 */
export function compareSnapshots(expected: ContentSnapshot, actual: ContentSnapshot): ParityReport {
  const report: ParityReport = { missing: [], extra: [], changed: [], brokenReferences: [] };

  for (const collection of RECORD_COLLECTIONS) {
    const left = indexById(expected[collection] as readonly unknown[]);
    const right = indexById(actual[collection] as readonly unknown[]);

    for (const id of left.keys()) {
      if (!right.has(id)) report.missing.push({ collection, id });
    }
    for (const id of right.keys()) {
      if (!left.has(id)) report.extra.push({ collection, id });
    }

    for (const [id, expectedRecord] of left) {
      const actualRecord = right.get(id);
      if (!actualRecord) continue;

      for (const difference of diffRecords(expectedRecord, actualRecord, collection)) {
        report.changed.push({
          collection,
          id,
          ...difference,
          ...(isUrlCritical(difference.field) ? { urlCritical: true as const } : {}),
        });
      }

      // 導出公開URL（brief Step 4: 「そこから導出した公開URL」）。`slug` 差分の裏返しだが、
      // URLの導出規則そのものが変わった場合もここで落とせるよう独立して比較する。
      const expectedUrl = publicUrlFor(collection, String(expectedRecord.slug ?? ''));
      const actualUrl = publicUrlFor(collection, String(actualRecord.slug ?? ''));
      if (expectedUrl !== actualUrl) {
        report.changed.push({
          collection,
          id,
          field: 'publicUrl',
          expected: expectedUrl,
          actual: actualUrl,
          urlCritical: true,
        });
      }
    }
  }

  // `siteSettings` と `articleIndexPlacementLimits` は id を持たない単一値。
  for (const difference of diffRecords(
    expected.siteSettings as unknown as Record<string, unknown>,
    actual.siteSettings as unknown as Record<string, unknown>,
  )) {
    report.changed.push({ collection: 'siteSettings', id: 'site-settings', ...difference });
  }
  for (const difference of diffRecords(
    expected.articleIndexPlacementLimits as unknown as Record<string, unknown>,
    actual.articleIndexPlacementLimits as unknown as Record<string, unknown>,
  )) {
    report.changed.push({
      collection: 'siteSettings',
      id: 'article-index-placement-limits',
      ...difference,
    });
  }

  report.brokenReferences.push(...collectBrokenReferences(expected, 'expected'));
  report.brokenReferences.push(...collectBrokenReferences(actual, 'actual'));

  return report;
}

/** collection ごとの件数（manifest の `recordCounts` と CLI 表示の両方が使う）。 */
export function countRecords(snapshot: ContentSnapshot): Record<string, number> {
  return {
    manufacturers: snapshot.manufacturers.length,
    robots: snapshot.robots.length,
    robotSeries: snapshot.robotSeries.length,
    distributors: snapshot.distributors.length,
    useCases: snapshot.useCases.length,
    deployments: snapshot.deployments.length,
    articles: snapshot.articles.length,
    articlePlacements: snapshot.articlePlacements.length,
    media: snapshot.media.length,
    siteSettings: 1,
  };
}

export function parityReportIsClean(report: ParityReport): boolean {
  return (
    report.missing.length === 0 &&
    report.extra.length === 0 &&
    report.changed.length === 0 &&
    report.brokenReferences.length === 0
  );
}

const MAX_PRINTED_ENTRIES = 40;

export function formatParityReport(report: ParityReport): string {
  const lines: string[] = [];
  lines.push(
    `missing=${report.missing.length} extra=${report.extra.length} ` +
      `changed=${report.changed.length} brokenReferences=${report.brokenReferences.length}`,
  );

  const urlCritical = report.changed.filter((change) => change.urlCritical);
  if (urlCritical.length > 0) {
    lines.push('', `URL-critical differences (slug / previousSlugs / public URL): ${urlCritical.length}`);
    for (const change of urlCritical.slice(0, MAX_PRINTED_ENTRIES)) {
      lines.push(
        `  ${change.collection}/${change.id} ${change.field}: ` +
          `${JSON.stringify(change.expected)} -> ${JSON.stringify(change.actual)}`,
      );
    }
  }

  const section = (title: string, entries: readonly unknown[], render: (entry: never) => string) => {
    if (entries.length === 0) return;
    lines.push('', `${title}: ${entries.length}`);
    for (const entry of entries.slice(0, MAX_PRINTED_ENTRIES)) lines.push(`  ${render(entry as never)}`);
    if (entries.length > MAX_PRINTED_ENTRIES) {
      lines.push(`  ... ${entries.length - MAX_PRINTED_ENTRIES} more (see the JSON report)`);
    }
  };

  section('missing (in expected, absent from actual)', report.missing, (entry: ParityMissing) => `${entry.collection}/${entry.id}`);
  section('extra (in actual, absent from expected)', report.extra, (entry: ParityMissing) => `${entry.collection}/${entry.id}`);
  section(
    'changed',
    report.changed.filter((change) => !change.urlCritical),
    (change: ParityChange) =>
      `${change.collection}/${change.id} ${change.field}: ${JSON.stringify(change.expected)} -> ${JSON.stringify(change.actual)}`,
  );
  section(
    'brokenReferences',
    report.brokenReferences,
    (entry: ParityBrokenReference) =>
      `[${entry.side}] ${entry.collection}/${entry.id} ${entry.field} -> ${entry.referencedCollection}/${entry.referencedId}`,
  );

  return lines.join('\n');
}

// ─── CLI ─────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.has('help')) {
    process.stdout.write(
      [
        'content:compare — ① cutover 前の「local TS vs Payload」parity 比較専用。',
        '',
        '  --json <path>        差分レポートをJSONで書き出す',
        '  --skip-media         local 側の派生 media 比較を行わない（media hosting を後続で扱う場合）',
        '',
        'local source を撤去したあと（Task 9）は実行できない。② は content:verify-snapshot /',
        'content:verify-conservation を使い、bare content:compare を使わない（brief Step 5）。',
        '',
      ].join('\n'),
    );
    return;
  }

  const { createLocalContentSource } = await import('../lib/content/localSource.ts');
  const { createPayloadContentSource } = await import('../lib/content/payloadSource.ts');

  const localSource = createLocalContentSource();
  const payloadSource = createPayloadContentSource();

  const expected = await localSource.readSnapshot();
  const actual = await payloadSource.readSnapshot();

  // local `data/*.ts` は `media` 配列を持たない（`lib/data/localContentSnapshot.ts`）。
  // Payload 側の media は importer が record 内の `ImageAsset` から決定的に導出して作る。
  // 比較元にも同じ導出を当てないと、media が丸ごと `extra` として出てしまう。
  if (!args.has('skip-media')) {
    expected.media = deriveMediaFromSnapshot(expected).filter((candidate) => candidate.hostable).map((candidate) => candidate.asset);
  } else {
    actual.media = [];
  }

  const report = compareSnapshots(expected, actual);

  process.stdout.write(`${formatParityReport(report)}\n`);

  const jsonPath = args.get('json');
  if (typeof jsonPath === 'string') {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    process.stdout.write(`\nwrote JSON report: ${jsonPath}\n`);
  }

  if (!parityReportIsClean(report)) {
    process.stderr.write('\ncontent:compare failed — differences found. Do not proceed to Task 9.\n');
    process.exitCode = 1;
  }
}

if (isDirectRun(import.meta.url)) {
  await main();
  await exitCli();
}
