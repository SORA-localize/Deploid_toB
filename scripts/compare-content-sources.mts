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

/**
 * 必須修正8-4: **Map 化する前に**全 collection の duplicate stable ID を検出する。
 *
 * `indexById()` は `Map.set` なので、同じ stable ID が2回現れると**後着が黙って前を上書き**する。
 * その結果、重複を含む snapshot は「件数は合わないのに差分ゼロ」あるいは「片方のレコードだけが
 * 比較され、もう片方が存在しないことに誰も気付かない」状態になっていた。件数検査
 * （`verifyCountConsistency`）と違い、これは**比較そのものの前提が壊れている**ことの検出なので、
 * `compareSnapshots()` の内部で必ず走る。
 *
 * 戻り値の 4 key（`missing` / `extra` / `changed` / `brokenReferences`）は brief Step 1 が固定した
 * 契約なので変えない。重複は `changed`（`field: 'duplicateStableId'`）として載せる——
 * `parityReportIsClean()` が false になり、CLI は exit 1 になる。
 */
export function collectDuplicateStableIds(
  snapshot: ContentSnapshot,
  side: 'expected' | 'actual',
): ParityChange[] {
  const changes: ParityChange[] = [];
  for (const collection of RECORD_COLLECTIONS) {
    const counts = new Map<string, number>();
    for (const record of snapshot[collection] as readonly { id: string }[]) {
      counts.set(String(record.id), (counts.get(String(record.id)) ?? 0) + 1);
    }
    for (const [id, occurrences] of counts) {
      if (occurrences < 2) continue;
      // 「stable ID は collection 内で1回だけ現れる」という不変条件に対する差分として書く。
      changes.push({ collection, id, field: `duplicateStableId(${side})`, expected: 1, actual: occurrences });
    }
  }
  return changes;
}

/** restore preflight（必須修正6-3）も同じ規則で broken reference を数えるため export する。 */
export function collectBrokenReferences(
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

  // 必須修正8-4: **Map 化より先に**重複 stable ID を見る。`indexById()` に渡した時点で
  // 後着が前を上書きしてしまい、以降どの検査からも重複は見えなくなる。
  report.changed.push(
    ...collectDuplicateStableIds(expected, 'expected'),
    ...collectDuplicateStableIds(actual, 'actual'),
  );

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

// ─── 件数の別々の検証（必須修正8-5） ───────────────────────────────────────

export interface CountConsistencyFailure {
  check: string;
  detail: string;
}

/**
 * 必須修正8-5: **raw array length / unique ID count / manifest count / Payload count を
 * 別々に**検証する。
 *
 * 1つの `countRecords()` だけを4箇所で使い回すと、「配列に重複があるので length は合うが
 * 一意 ID は足りない」「manifest の件数は snapshot と合っているが Payload には入っていない」と
 * いった食い違いが、どれも同じ1つの数字に畳まれて見えなくなる。4つを別々の名前で突き合わせる。
 */
export function verifyCountConsistency(args: {
  snapshot: ContentSnapshot;
  /** manifest の `recordCounts`（あれば）。 */
  manifestCounts?: Record<string, number>;
  /** Payload から読み直した snapshot（あれば）。 */
  payloadSnapshot?: ContentSnapshot;
}): CountConsistencyFailure[] {
  const failures: CountConsistencyFailure[] = [];
  const uniqueIds = (snapshot: ContentSnapshot, collection: ParityCollection) =>
    new Set((snapshot[collection] as readonly { id: string }[]).map((record) => String(record.id))).size;

  for (const collection of RECORD_COLLECTIONS) {
    const rawLength = (args.snapshot[collection] as readonly unknown[]).length;
    const unique = uniqueIds(args.snapshot, collection);
    if (rawLength !== unique) {
      failures.push({
        check: 'uniqueStableIdCount',
        detail: `${collection}: the array holds ${rawLength} records but only ${unique} distinct stable ids`,
      });
    }

    if (args.manifestCounts) {
      const declared = args.manifestCounts[collection];
      if (declared !== undefined && declared !== rawLength) {
        failures.push({
          check: 'manifestCount',
          detail: `${collection}: manifest says ${declared}, the artifact array holds ${rawLength}`,
        });
      }
    }

    if (args.payloadSnapshot) {
      const payloadLength = (args.payloadSnapshot[collection] as readonly unknown[]).length;
      const payloadUnique = uniqueIds(args.payloadSnapshot, collection);
      if (payloadLength !== rawLength) {
        failures.push({
          check: 'payloadCount',
          detail: `${collection}: the artifact array holds ${rawLength} records, Payload returns ${payloadLength}`,
        });
      }
      if (payloadLength !== payloadUnique) {
        failures.push({
          check: 'payloadUniqueStableIdCount',
          detail: `${collection}: Payload returns ${payloadLength} records but only ${payloadUnique} distinct stable ids`,
        });
      }
    }
  }

  return failures;
}

// ─── media review の waiver（必須修正8-6） ─────────────────────────────────

/**
 * 必須修正8-6: **mediaReview が残っていたら既定で exit 1**。通すのは
 * 「人間が承認した waiver がある場合だけ」で、その waiver は**署名か承認済み digest に
 * 結び付いている**必要がある。
 *
 * これまでは要確認項目を report に載せるだけで exit 0 だったため、「誰も見ていない要確認項目」を
 * 抱えたまま次工程へ進めた。waiver は `mediaReviewSha256`（要確認項目そのものの digest）を含むので、
 * **承認したのとは別の項目**が後から増えた場合は digest が変わり、waiver は効かなくなる。
 */
export interface MediaReviewWaiver {
  /** `sha256(canonicalJson(items))`。承認した内容そのものに結び付ける。 */
  mediaReviewSha256: string;
  waivedBy: string;
  waivedAt: string;
  reason: string;
}

export function assertValidMediaReviewWaiver(value: unknown): asserts value is MediaReviewWaiver {
  const waiver = value as Partial<MediaReviewWaiver> | null;
  if (!waiver || typeof waiver !== 'object') throw new Error('media-waiver-invalid: not an object');
  const problems: string[] = [];
  if (typeof waiver.mediaReviewSha256 !== 'string' || !/^[0-9a-f]{64}$/.test(waiver.mediaReviewSha256)) {
    problems.push('mediaReviewSha256');
  }
  for (const key of ['waivedBy', 'reason'] as const) {
    if (typeof waiver[key] !== 'string' || (waiver[key] as string).length === 0) problems.push(key);
  }
  if (typeof waiver.waivedAt !== 'string' || Number.isNaN(Date.parse(waiver.waivedAt))) problems.push('waivedAt');
  if (problems.length > 0) throw new Error(`media-waiver-invalid: ${problems.join(', ')}`);
}

/** waiver が結び付く digest。項目の順序に依存しないよう、正規化した JSON から取る。 */
export function mediaReviewDigest(items: readonly MediaReviewItem[], sha256: (value: string) => string): string {
  const normalized = [...items]
    .map((item) => ({ kind: item.kind, stableId: item.stableId, src: item.src, detail: item.detail }))
    .sort((a, b) => (a.stableId < b.stableId ? -1 : a.stableId > b.stableId ? 1 : 0));
  return sha256(JSON.stringify(normalized));
}

export interface MediaReviewGateResult {
  ok: boolean;
  failures: Array<{ check: string; detail: string }>;
}

/**
 * 必須修正8-6 の判定本体（純粋関数）。署名検証そのものは呼び出し側（cosign が要る）が行い、
 * その結果を `signatureVerified` として渡す。
 */
export function checkMediaReviewGate(args: {
  items: readonly MediaReviewItem[];
  waiver?: MediaReviewWaiver;
  /** waiver の cosign 署名が検証済みか。**未検証の waiver は無いものとして扱う**。 */
  signatureVerified?: boolean;
  actualDigest?: string;
}): MediaReviewGateResult {
  if (args.items.length === 0) return { ok: true, failures: [] };

  if (!args.waiver) {
    return {
      ok: false,
      failures: [
        {
          check: 'mediaReview',
          detail:
            `${args.items.length} media item(s) still need a human decision. Resolve them, or pass a signed ` +
            'waiver (--media-waiver) that a human approved for exactly these items.',
        },
      ],
    };
  }

  if (args.signatureVerified !== true) {
    return {
      ok: false,
      failures: [
        {
          check: 'mediaWaiverSignature',
          detail: 'the media review waiver is not signed by the approval key, so it is not an approval.',
        },
      ],
    };
  }

  if (args.actualDigest !== args.waiver.mediaReviewSha256) {
    return {
      ok: false,
      failures: [
        {
          check: 'mediaWaiverDigest',
          detail:
            `the waiver approves media review digest ${args.waiver.mediaReviewSha256}, but the current review ` +
            `items hash to ${args.actualDigest}. Something changed after the approval — re-approve explicitly.`,
        },
      ],
    };
  }

  return { ok: true, failures: [] };
}

// ─── --skip-media の適用範囲（必須修正8-7） ────────────────────────────────

/**
 * 必須修正8-7: `--skip-media` は **local development 専用**。Task 9 / managed environment では拒否する。
 *
 * `--skip-media` は「Payload 側の media を比較対象から外す」ので、media が丸ごと欠けていても
 * parity が通ってしまう。cutover の判断材料としては危険で、開発中に media hosting を後回しに
 * したいときだけのもの。判定は**呼び出し側が偽装できない材料**を優先する:
 * `_environment_marker`（DB 自身の申告）> DATABASE_URL の host > NODE_ENV / VERCEL_ENV。
 */
export function assertSkipMediaAllowed(context: {
  databaseUrl?: string;
  nodeEnv?: string;
  vercelEnv?: string;
  deploymentEnv?: string;
  /** DB 自身の申告（読めた場合）。 */
  environmentMarker?: 'production' | 'preview' | null;
}): void {
  const refuse = (why: string): never => {
    throw new Error(
      `skip-media-refused: --skip-media drops media from the comparison entirely, so it is only allowed ` +
        `during local development. ${why}`,
    );
  };

  if (context.environmentMarker === 'production' || context.environmentMarker === 'preview') {
    refuse(`This database identifies itself as "${context.environmentMarker}" via _environment_marker.`);
  }
  if (context.vercelEnv || context.deploymentEnv) {
    refuse(`This run is inside a managed deployment (VERCEL_ENV/DEPLOYMENT_ENV is set).`);
  }
  if (context.nodeEnv === 'production') refuse('NODE_ENV is "production".');
  if (context.databaseUrl) {
    let hostname: string;
    try {
      hostname = new URL(context.databaseUrl).hostname;
    } catch {
      refuse('DATABASE_URL is not a valid connection URL, so the target cannot be shown to be local.');
      return;
    }
    if (!['localhost', '127.0.0.1', '::1'].includes(hostname)) {
      refuse(`DATABASE_URL points at "${hostname}", which is not a local development database.`);
    }
  } else {
    refuse('DATABASE_URL is not set, so the target cannot be shown to be a local development database.');
  }
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
        '  --skip-media         local 側の派生 media 比較を行わない（**local development 専用**）',
        '  --media-waiver <path>  要確認 media を人間が承認した署名済み waiver（無ければ exit 1）',
        '',
        'local source を撤去したあと（Task 9）は実行できない。② は content:verify-snapshot /',
        'content:verify-conservation を使い、bare content:compare を使わない（brief Step 5）。',
        '',
      ].join('\n'),
    );
    return;
  }

  // 必須修正8-7: `--skip-media` は local development 専用。**接続する前に**環境で判定し、
  // 接続後に DB 自身の申告（`_environment_marker`）でもう一度確かめる。
  if (args.has('skip-media')) {
    assertSkipMediaAllowed({
      databaseUrl: process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      deploymentEnv: process.env.DEPLOYMENT_ENV,
    });
  }

  const { createLocalContentSource } = await import('../lib/content/localSource.ts');
  const { createPayloadContentSource } = await import('../lib/content/payloadSource.ts');

  const localSource = createLocalContentSource();
  const payloadSource = createPayloadContentSource();

  const expected = await localSource.readSnapshot();
  const actual = await payloadSource.readSnapshot();

  if (args.has('skip-media')) {
    const { getPayload } = await import('payload');
    const { default: config } = await import('../payload.config.ts');
    const { readEnvironmentMarker } = await import('./restore-preflight.mts');
    const payload = await getPayload({ config });
    try {
      assertSkipMediaAllowed({
        databaseUrl: process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        deploymentEnv: process.env.DEPLOYMENT_ENV,
        environmentMarker: (await readEnvironmentMarker(payload))?.environment ?? null,
      });
    } finally {
      await payload.destroy();
    }
  }

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

  // 必須修正8-5: 件数は「4つの別々の数」として突き合わせる。
  const countFailures = verifyCountConsistency({ snapshot: expected, payloadSnapshot: actual });
  for (const failure of countFailures) process.stderr.write(`FAIL ${failure.check}: ${failure.detail}\n`);

  // 必須修正8-6: 残っている要確認 media は既定で exit 1。署名済み waiver があるときだけ通す。
  const gate = await evaluateMediaReviewGate(mediaReview, args.get('media-waiver'));
  for (const failure of gate.failures) process.stderr.write(`FAIL ${failure.check}: ${failure.detail}\n`);

  const jsonPath = args.get('json');
  if (typeof jsonPath === 'string') {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    process.stdout.write(`\nwrote JSON report: ${jsonPath}\n`);
  }

  if (!parityReportIsClean(parity) || countFailures.length > 0 || !gate.ok) {
    process.stderr.write('\ncontent:compare failed — differences or unresolved review items. Do not proceed to Task 9.\n');
    process.exitCode = 1;
  }
}

/**
 * 必須修正8-6: waiver ファイル（署名済み JSON 文書）を読み、**署名を検証してから** gate に渡す。
 * 署名機構は `scripts/export-content-snapshot.mts` のものを再利用する（cosign + AWS KMS 鍵）。
 *
 * review fix round 1 / Important #4: **この関数自体をテスト対象にする**ために export する。
 * 修正前は gate のテストが `signatureVerified` を boolean リテラルで注入するだけで、
 * 「ファイルを読んで cosign で検証する」この経路が一度も実行されていなかった——
 * つまり偽造署名を持つ waiver ファイルが実際に拒否されることを、誰も確かめていなかった。
 */
export async function evaluateMediaReviewGate(
  items: readonly MediaReviewItem[],
  waiverPath: string | true | undefined,
): Promise<MediaReviewGateResult> {
  if (items.length === 0) return { ok: true, failures: [] };

  const { parseSignedJsonDocument, sha256Hex, verifyJsonDocumentSignature } = await import(
    './export-content-snapshot.mts'
  );
  const actualDigest = mediaReviewDigest(items, sha256Hex);

  if (typeof waiverPath !== 'string') {
    return checkMediaReviewGate({ items, actualDigest });
  }

  const { readFile } = await import('node:fs/promises');
  const raw = JSON.parse(await readFile(waiverPath, 'utf8')) as unknown;
  let signed: Awaited<ReturnType<typeof parseSignedJsonDocument>>;
  try {
    signed = parseSignedJsonDocument(raw);
    assertValidMediaReviewWaiver(signed.document);
  } catch (error) {
    return { ok: false, failures: [{ check: 'mediaWaiverSchema', detail: (error as Error).message }] };
  }

  const signature = await verifyJsonDocumentSignature(signed);
  return checkMediaReviewGate({
    items,
    waiver: signed.document as MediaReviewWaiver,
    signatureVerified: signature.verified,
    actualDigest,
  });
}

if (isDirectRun(import.meta.url)) {
  await main();
  await exitCli();
}
