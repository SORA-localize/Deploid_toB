import type { Article, UseCase } from '@/data/types';
import type { TagKind } from '@/lib/tagRegistry';
import { uiText } from '@/lib/uiText';

/**
 * 宣言的なファセット定義（記事フィルタの単一正本）。
 * 1ファセット追加は「ここに1エントリ＋lib/tagRegistry.ts に値登録」で済む。
 * src/app/reports/page.tsx（URL読取）・ReportsBrowser（状態）・lib/articleFilters.ts（絞り込み）・
 * FacetFilterBar（選択肢/件数/0件無効化/チップ）はこの配列を反復するので、個別の追記は不要。
 */
export interface FacetConfig<T extends { slug: string }> {
  /** URLパラメータ名（= フィルタキー）。 */
  key: string;
  /** タグの種類。ラベル解決・表示順に使う。 */
  kind: TagKind;
  /** ドロップダウンの見出し。 */
  label: string;
  /** 「すべて」選択肢のラベル。 */
  allLabel: string;
  /** レコードからこのファセットの値配列を取り出す。 */
  getValues: (item: T) => readonly string[];
}

/** 記事一覧（/reports）のファセット。section はタブ（粗い主題軸）で別管理。 */
export const ARTICLE_FACETS: readonly FacetConfig<Article>[] = [
  {
    key: 'theme',
    kind: 'theme',
    label: uiText.filters.theme,
    allLabel: uiText.common.allThemes,
    getValues: (article) => article.themeTags ?? [],
  },
  {
    key: 'industry',
    kind: 'industry',
    label: uiText.filters.industry,
    allLabel: uiText.common.allIndustries,
    getValues: (article) => article.industryTags ?? [],
  },
  {
    key: 'region',
    kind: 'region',
    label: uiText.filters.region,
    allLabel: uiText.common.allRegions,
    getValues: (article) => article.regionTags ?? [],
  },
];

/** 用途一覧（/use-cases）のファセット。domain は primary/secondary を横断して探す。 */
export const USE_CASE_FACETS: readonly FacetConfig<UseCase>[] = [
  {
    key: 'domain',
    kind: 'use-case-domain',
    label: uiText.filters.domain,
    allLabel: uiText.common.allDomains,
    getValues: (useCase) => [useCase.primaryDomain, ...(useCase.secondaryDomains ?? [])],
  },
  {
    key: 'industry',
    kind: 'industry',
    label: uiText.filters.industry,
    allLabel: uiText.common.allIndustries,
    getValues: (useCase) => useCase.industryTags ?? [],
  },
  {
    key: 'task',
    kind: 'task',
    label: uiText.filters.task,
    allLabel: uiText.common.allTasks,
    getValues: (useCase) => useCase.taskTags ?? [],
  },
];
