/**
 * cache依存表の唯一の正本（`docs/plans/content-platform-migration-plan-v1.md` Task 7 Step 5.5）。
 *
 * ## なぜこの表が要るのか
 *
 * `'use cache'` を付けたpage/componentが実際に呼ぶ `cacheTag()` の集合と、この表が宣言する
 * 集合が食い違うと、片方だけを更新して他方を放置しても**誰にも気づかれない**——Task 6で
 * 実際に起きた「機械ゲートの文言と実装の乖離」と同種の失敗パターン。そこで
 * `tests/content/cache-dependencies.test.ts` が、この表の宣言と各ソースファイルの実際の
 * `cacheTag(contentTags.X)` 呼び出しをソースコードから機械的に読み取って突き合わせる。
 * 表とコードのどちらかだけを変えると、このテストが落ちる。
 *
 * ## この表に載る条件
 *
 * 「brief Step 3の依存表に載っている行」ではなく、「実際に `'use cache'` + `cacheTag()` で
 * cache化されているview」だけを載せる。まだcache化していないpageはここには現れない
 * ——載せてしまうと「宣言はあるが実装がない」という、これも同種の乖離になる。
 *
 * **tagの集合は「そのcached関数が実際に呼ぶrepositoryメソッドが読むcollection」だけにする。**
 * brief Step 3の依存表を機械的にコピーしない——実際に読まないcollectionへ`cacheTag()`を
 * 呼ぶことは「見せかけの紐付け」であり、Step 5.5が防ごうとしている乖離そのもの
 * （Task 7 fix round 1 / Critical 2でreviewerが指摘、`distributors`で発覚したが、
 * 同じ観点で洗い直した結果`robotSeries`/`media`も同じ状態だった。下のKNOWN_GAPS参照）。
 *
 * Task 7で実際にcache化したのは11 view（brief Step 3の依存表11行のうち「Series詳細」を除く
 * 10行 + `/for-manufacturers`）。「Series詳細」はrobot-series単体を解決するpage自体が
 * 実装時点で存在しないため対象外（`docs/plans/content-platform-migration-plan-v1.md` の
 * Task 7セクション注記参照）。
 */
import { contentTags, type ContentTagKey } from './cacheTags';

export interface CachedViewDependency {
  /** 人間可読なID。テストの失敗メッセージで使う。 */
  id: string;
  /** repo rootからの相対path。 */
  sourceFile: string;
  /** そのfile内で `'use cache'` を持つ関数名（ドキュメント用途。突き合わせはfile単位で行う）。 */
  functionName: string;
  /** brief Step 3の依存表の対応行（無ければ「brief表に無い」ことを明示する）。 */
  briefRow: string;
  /** この関数が実際に呼ぶべき `cacheTag(contentTags.X)` の集合。 */
  tags: readonly ContentTagKey[];
}

export const cachedViewDependencies: readonly CachedViewDependency[] = [
  {
    id: 'robots-list',
    sourceFile: 'src/app/(frontend)/robots/page.tsx',
    functionName: 'CachedRobotsList',
    briefRow: 'Robot一覧・比較（briefの表は robotSeries, media も挙げるが実装は読まない）',
    tags: ['robots', 'manufacturers', 'useCases'],
  },
  {
    id: 'robot-detail',
    sourceFile: 'src/app/(frontend)/robots/[slug]/page.tsx',
    functionName: 'getCachedRobotDetailData',
    briefRow: 'Robot詳細（briefの表は robotSeries, media も挙げるが実装は読まない）',
    tags: ['robots', 'manufacturers', 'useCases'],
  },
  {
    id: 'manufacturers-list',
    sourceFile: 'src/app/(frontend)/manufacturers/page.tsx',
    functionName: 'CachedManufacturersList',
    briefRow: 'Manufacturer一覧（briefの表は media も挙げるが実装は読まない）',
    tags: ['manufacturers', 'robots'],
  },
  {
    id: 'manufacturer-detail',
    sourceFile: 'src/app/(frontend)/manufacturers/[slug]/page.tsx',
    functionName: 'getCachedManufacturerDetailData',
    briefRow: 'Manufacturer詳細（briefの表は distributors, robotSeries, media も挙げるが実装は読まない）',
    tags: ['manufacturers', 'robots', 'articles', 'useCases'],
  },
  {
    id: 'use-cases-list',
    sourceFile: 'src/app/(frontend)/use-cases/page.tsx',
    functionName: 'CachedUseCasesList',
    briefRow: 'UseCase一覧（briefの表は media のみだが、実装が実際に埋め込むrobots/deploymentsを足す）',
    tags: ['useCases', 'robots', 'deployments'],
  },
  {
    id: 'use-case-detail',
    sourceFile: 'src/app/(frontend)/use-cases/[slug]/page.tsx',
    functionName: 'getCachedUseCaseDetailData',
    briefRow: 'UseCase詳細（briefの表は robotSeries, media も挙げるが実装は読まない）',
    tags: ['useCases', 'robots', 'articles', 'deployments', 'manufacturers'],
  },
  {
    id: 'reports-list',
    sourceFile: 'src/app/(frontend)/reports/page.tsx',
    functionName: 'CachedReportsList',
    briefRow: 'Report一覧（briefの表は media も挙げるが実装は読まない。settingsは実装が実際に読むため足す）',
    tags: ['articles', 'articlePlacements', 'settings'],
  },
  {
    id: 'report-detail',
    sourceFile: 'src/app/(frontend)/reports/[slug]/page.tsx',
    functionName: 'getCachedReportDetailData',
    briefRow: 'Report詳細（briefの表は robotSeries, media も挙げるが実装は読まない）',
    tags: ['articles', 'robots', 'manufacturers', 'useCases'],
  },
  {
    id: 'home',
    sourceFile: 'src/app/(frontend)/page.tsx',
    functionName: 'HomePage',
    briefRow: 'Home（briefの表は media も挙げるが実装は読まない）',
    tags: ['robots', 'manufacturers', 'useCases', 'deployments', 'articles', 'articlePlacements', 'settings'],
  },
  {
    id: 'sitemap',
    sourceFile: 'src/app/sitemap.ts',
    functionName: 'sitemap',
    briefRow: 'sitemap / search index（briefの表は robotSeries, settings も挙げるが実装は読まない）',
    tags: ['robots', 'manufacturers', 'useCases', 'articles'],
  },
  {
    id: 'for-manufacturers',
    sourceFile: 'src/app/(frontend)/for-manufacturers/page.tsx',
    functionName: 'ForManufacturersPage',
    briefRow: '(brief表に無い。実際に読む2 collectionのcountのみ)',
    tags: ['robots', 'manufacturers'],
  },
];

/**
 * `distributors` / `robotSeries` / `media` が「全collectionに最低1 consumer」の対象から
 * 外れている理由（Task 7 fix round 1 / Critical 2、ユーザー承認済み）。
 *
 * brief Step 3の依存表はこの3つを複数行の依存として挙げているが、実装時点でどのcached view
 * も実際にはこの3 collectionを読まない:
 *
 * - **`distributors`**: 画面に出る「取扱代理店」は`Manufacturer.domesticDistributors`という
 *   別の埋め込みfieldで、`Distributor` collectionとは無関係。cutover時点で実データも0件
 *   （`docs/plans/content-platform-migration-plan-v1.md` 1409行目）。
 * - **`robotSeries`**: `robot-series` を単体で解決するpage（「Series詳細」）が実装時点で
 *   存在しない。`Robot.seriesId`はrobot自身のfieldとして`robots`タグの範囲内で扱われ、
 *   `robotSeries` collection自体（`listRobotSeries`等）を呼ぶpage/componentが無い。
 * - **`media`**: `Media` collectionの読み取りメソッド（`listMedia` / `getMediaById` /
 *   `listRelatedMedia`）をどのpage/componentも一度も呼ばない。各collectionの
 *   `heroImage` / `images` / `logos`はそのcollection自身に埋め込まれたJSON/groupフィールドで、
 *   `Media`collectionへのPayload relationshipではない（`collections/Robots.ts`の`images`
 *   field定義、`lib/payload/access.ts`の`imageAssetField()`参照）。
 *
 * 以前は`cacheTag(contentTags.distributors)`のような、Step 5.5の「全collectionに
 * 最低1 consumer」を機械的に満たすための**見せかけの紐付け**を足していた（reviewerの
 * Critical指摘で`distributors`が発覚。同じ観点で全cached viewを洗い直した結果、
 * `robotSeries`/`media`も同じ状態だったため、fix round 1で合わせて外した）。
 *
 * 「本物のconsumerを作る」ことは新規UI機能追加でありTask 7の範囲外と判断し、ユーザーに
 * 確認・承認を得た上で、ここに**既知の例外**として明示する——表と実装を無理に一致させて
 * 誤魔化すのではなく、「まだ実consumerが無い」という事実を機械的に検証可能な形で残す。
 *
 * これらのcollectionを実際に使うUIができた時点で、対応する例外を消し、該当する
 * `cachedViewDependencies` エントリへ実際の`cacheTag()`呼び出しを足すこと。
 */
export const KNOWN_GAPS: ReadonlyMap<ContentTagKey, string> = new Map([
  [
    'distributors',
    'distributors collectionはcutover時点でどのページからも読まれておらず実データも0件。' +
      '本物のconsumerを作ることは新規UI機能追加でありTask 7の範囲外（ユーザー承認済み、' +
      'task-7-report.md fix round 1参照）。',
  ],
  [
    'robotSeries',
    'robot-seriesを単体で解決するpage（Series詳細）が実装時点で存在しない。robots collectionの' +
      'seriesId fieldはrobotsタグの範囲内で扱われ、robotSeries collection自体を読むpageが無い' +
      '（task-7-report.md fix round 1参照）。',
  ],
  [
    'media',
    'Media collectionの読み取りメソッド（listMedia/getMediaById/listRelatedMedia）を' +
      'どのpage/componentも呼ばない。heroImage/images/logosは各collection自身の埋め込み' +
      'field（Media collectionへのrelationshipではない）（task-7-report.md fix round 1参照）。',
  ],
]);

/** 全エントリのtagを合わせた集合。9 collection + settingsの全カバレッジ検査に使う。 */
export function allDependencyTagKeys(): Set<ContentTagKey> {
  const set = new Set<ContentTagKey>();
  for (const entry of cachedViewDependencies) {
    for (const tag of entry.tags) set.add(tag);
  }
  return set;
}

/** `contentTags` の全key（10個）。 */
export const ALL_CONTENT_TAG_KEYS: readonly ContentTagKey[] = Object.keys(contentTags) as ContentTagKey[];
