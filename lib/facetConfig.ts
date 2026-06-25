import type { Article } from '@/data/types';
import type { TagKind } from '@/lib/tagRegistry';
import { uiText } from '@/lib/uiText';

/**
 * 宣言的なファセット定義（記事フィルタの単一正本）。
 * 1ファセット追加は「ここに1エントリ＋lib/tagRegistry.ts に値登録」で済む。
 * src/app/reports/page.tsx（URL読取）・ReportsBrowser（状態）・lib/articleFilters.ts（絞り込み）・
 * FacetFilterBar（選択肢/件数/0件無効化/チップ）はこの配列を反復するので、個別の追記は不要。
 */
export interface FacetConfig {
  /** URLパラメータ名（= フィルタキー）。 */
  key: string;
  /** タグの種類。ラベル解決・表示順に使う。 */
  kind: TagKind;
  /** ドロップダウンの見出し。 */
  label: string;
  /** 「すべて」選択肢のラベル。 */
  allLabel: string;
  /** 記事からこのファセットの値配列を取り出す。 */
  getValues: (article: Article) => readonly string[];
}

/** 記事一覧（/reports）のファセット。section はタブ（粗い主題軸）で別管理。 */
export const ARTICLE_FACETS: readonly FacetConfig[] = [
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
