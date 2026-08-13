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
 * - **コンテンツ由来の日付（`checkedAt` / `publishedAt` / `nextReviewBy`）は除外しないどころか、
 *   最も厳しく比較する。** brief が `sources ... checkedAt` を明示的に比較対象へ挙げており、
 *   かつ Task 5 の migration `20260812_080919_date_only_content_fields_to_text` でこれらの列を
 *   `text` にしたため、Payload は書いた文字列をそのまま返す。よって**厳密な文字列一致**で見る。
 *   （以前は `type: 'date'` が `'2026-07-16'` を `'2026-07-16T00:00:00.000Z'` にして返すため
 *   instant として比較していた。その緩さは `Date.parse('2025-05') === Date.parse('2025-05-01')` を
 *   同値にしてしまい、**月精度の日付を日精度へ丸める silent な損失を parity 0 差分にする**。
 *   その損失こそ migration が防ぐために存在するので、緩さは残さない。）
 */
import type { ContentSnapshot } from '../lib/content/contracts.ts';
import { deriveMediaFromSnapshot, type MediaCandidate as MediaDerivationCandidate } from './import-content-to-payload.mts';
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

/**
 * 暦日（instant ではない）として持つコンテンツ日付。migration
 * `20260812_080919_date_only_content_fields_to_text` で `text` 列にしてあるため、
 * **正規化も丸めもせず厳密な文字列一致で比較する**。`'2025-05'`（月精度）と `'2025-05-01'` は
 * 別の値として差分に出る。ここを緩めると、日付を丸める regression が parity をすり抜ける。
 */
export const STRICT_DATE_FIELDS: ReadonlySet<string> = new Set(['checkedAt', 'publishedAt', 'nextReviewBy']);

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
 * 値を再帰的に比較する。**すべての leaf は厳密比較（`!==`）**で、日付だけを緩めるような
 * 例外は持たない（`STRICT_DATE_FIELDS` の説明を参照）。
 */
function diffValues(
  path: string,
  expected: unknown,
  actual: unknown,
  out: Array<{ field: string; expected: unknown; actual: unknown }>,
): void {
  if (isAbsent(expected) && isAbsent(actual)) return;
  if (isAbsent(expected) !== isAbsent(actual)) {
    out.push({ field: path, expected, actual });
    return;
  }

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
      diffValues(`${path}[${index}]`, expected[index], actual[index], out);
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
      diffValues(`${path}.${key}`, left[key], right[key], out);
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
    diffValues(key, expected[key], actual[key], out);
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

/**
 * parity report に載せる「人間の確認が要る」media 項目（brief Step 3:
 * 「取得不能または権利未確定の画像は自動公開せず、**parity reportの要確認項目として残す**」）。
 *
 * `compareSnapshots()` の戻り値は brief Step 1 が固定した4 key のままにし（契約を変えない）、
 * こちらは `content:compare` が出力する envelope 側に載せる。**フィルタで消さずに必ず残す**のが
 * 要点で、`content:import` の stdout を読んだ人にしか見えない状態にはしない
 * （Task 9 が archive するのは compare の JSON なので、そこに痕跡が無いと後から辿れない）。
 */
export interface MediaReviewItem {
  kind: 'unhostable-image' | 'conflicting-image-rights';
  stableId: string;
  src: string;
  detail: string;
  /** この画像を参照しているレコード（`robots/unitree-g1.heroImage` 形式）。 */
  usedBy: string[];
}

/** `content:compare` が出力する全体。parity 本体と要確認項目を分けて持つ。 */
export interface ContentCompareReport {
  parity: ParityReport;
  mediaReview: MediaReviewItem[];
}

/**
 * snapshot から media の要確認項目を集める。**parity の差分ではない**（Payload 側に
 * 無いのが正しい状態なので `missing` には出さない）が、放置してはいけないので必ず報告する。
 */
export function collectMediaReviewItems(candidates: readonly MediaDerivationCandidate[]): MediaReviewItem[] {
  const items: MediaReviewItem[] = [];

  for (const candidate of candidates) {
    if (candidate.hostable) continue;
    items.push({
      kind: 'unhostable-image',
      stableId: candidate.asset.id,
      src: candidate.src,
      detail: candidate.reason ?? 'not-hostable',
      usedBy: candidate.usedBy,
    });
  }

  // 同じ src に複数の rights metadata が付いていると、同一ファイルが別レコードとして
  // 複数回 upload される（brief の「src + rights metadata で重複排除」をそのまま実装した帰結）。
  const bySrc = new Map<string, MediaDerivationCandidate[]>();
  for (const candidate of candidates) {
    bySrc.set(candidate.src, [...(bySrc.get(candidate.src) ?? []), candidate]);
  }
  for (const [src, group] of bySrc) {
    if (group.length < 2) continue;
    items.push({
      kind: 'conflicting-image-rights',
      stableId: group.map((candidate) => candidate.asset.id).sort().join(', '),
      src,
      detail:
        `the same file carries ${group.length} different rights metadata values, so it is uploaded ` +
        `${group.length} times as separate media records. Normalise the rights (usually checkedAt) ` +
        'or change the dedupe rule before the cutover.',
      usedBy: [...new Set(group.flatMap((candidate) => candidate.usedBy))].sort(),
    });
  }

  return items;
}

export function formatMediaReview(items: readonly MediaReviewItem[]): string {
  if (items.length === 0) return 'media review items: none';
  const lines = [`REVIEW REQUIRED — media items needing a human decision: ${items.length}`];
  const unhostable = items.filter((item) => item.kind === 'unhostable-image');
  const conflicting = items.filter((item) => item.kind === 'conflicting-image-rights');

  if (unhostable.length > 0) {
    lines.push(
      '',
      `  not imported into the media collection (rights unconfirmed or unfetchable): ${unhostable.length}`,
      '  these images are intentionally NOT auto-published; clear the rights or drop the reference.',
    );
    for (const item of unhostable.slice(0, MAX_PRINTED_ENTRIES)) {
      lines.push(`    ${item.src}: ${item.detail}${item.usedBy[0] ? ` (used by ${item.usedBy[0]})` : ''}`);
    }
    if (unhostable.length > MAX_PRINTED_ENTRIES) {
      lines.push(`    ... ${unhostable.length - MAX_PRINTED_ENTRIES} more (see the JSON report)`);
    }
  }

  if (conflicting.length > 0) {
    lines.push('', `  same file with conflicting rights metadata (duplicate uploads): ${conflicting.length}`);
    for (const item of conflicting.slice(0, MAX_PRINTED_ENTRIES)) {
      lines.push(`    ${item.src} -> ${item.stableId}`);
    }
    if (conflicting.length > MAX_PRINTED_ENTRIES) {
      lines.push(`    ... ${conflicting.length - MAX_PRINTED_ENTRIES} more (see the JSON report)`);
    }
  }

  return lines.join('\n');
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
  //   - hostable な candidate は「Payload にあるはず」の集合なので比較対象にする。
  //   - hostable でない candidate は Payload に無いのが正しいので比較対象から外すが、
  //     **消さずに要確認項目として report へ載せる**（brief Step 3）。
  let mediaReview: MediaReviewItem[] = [];
  if (!args.has('skip-media')) {
    const candidates = deriveMediaFromSnapshot(expected);
    expected.media = candidates.filter((candidate) => candidate.hostable).map((candidate) => candidate.asset);
    mediaReview = collectMediaReviewItems(candidates);
  } else {
    actual.media = [];
  }

  const parity = compareSnapshots(expected, actual);
  const report: ContentCompareReport = { parity, mediaReview };

  process.stdout.write(`${formatParityReport(parity)}\n`);
  process.stdout.write(`\n${formatMediaReview(mediaReview)}\n`);

  const jsonPath = args.get('json');
  if (typeof jsonPath === 'string') {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    process.stdout.write(`\nwrote JSON report: ${jsonPath}\n`);
  }

  if (!parityReportIsClean(parity)) {
    process.stderr.write('\ncontent:compare failed — differences found. Do not proceed to Task 9.\n');
    process.exitCode = 1;
  }
}

if (isDirectRun(import.meta.url)) {
  await main();
  await exitCli();
}
