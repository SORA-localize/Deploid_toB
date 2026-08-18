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
 * cache化されているview」だけを載せる。まだcache化していないpage（`/compare` `/reports` 詳細等）
 * はここには現れない——載せてしまうと「宣言はあるが実装がない」という、これも同種の乖離になる。
 * Task 7で実際にcache化したのは5 view（brief必須の4つ + `distributors` collectionへの
 * 実consumerを与えるための manufacturer詳細）。他pageのcache化は将来のtaskの範囲
 * （`task-7-report.md` の Concerns 参照）。
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
    briefRow: 'Robot一覧・比較',
    tags: ['robots', 'manufacturers', 'robotSeries', 'media'],
  },
  {
    id: 'use-cases-list',
    sourceFile: 'src/app/(frontend)/use-cases/page.tsx',
    functionName: 'CachedUseCasesList',
    briefRow: 'UseCase一覧（+実装が実際に埋め込むrobots/deployments。briefの表は最低ケース）',
    tags: ['useCases', 'robots', 'deployments', 'media'],
  },
  {
    id: 'home',
    sourceFile: 'src/app/(frontend)/page.tsx',
    functionName: 'HomePage',
    briefRow: 'Home',
    tags: ['robots', 'manufacturers', 'useCases', 'deployments', 'articles', 'articlePlacements', 'media', 'settings'],
  },
  {
    id: 'for-manufacturers',
    sourceFile: 'src/app/(frontend)/for-manufacturers/page.tsx',
    functionName: 'ForManufacturersPage',
    briefRow: '(brief表に無い。実際に読む2 collectionのcountのみ)',
    tags: ['robots', 'manufacturers'],
  },
  {
    id: 'manufacturer-detail',
    sourceFile: 'src/app/(frontend)/manufacturers/[slug]/page.tsx',
    functionName: 'getCachedManufacturerDetailData',
    briefRow: 'Manufacturer詳細',
    tags: ['manufacturers', 'robots', 'robotSeries', 'distributors', 'articles', 'useCases', 'media'],
  },
];

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
