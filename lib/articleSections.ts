import type { ArticleSection } from '@/data/types';
import { articleSectionOrder } from '@/lib/display';
import { articleSectionLabels } from '@/lib/labels';

/** UIフィルタ型。データ型 ArticleSection に UI 専用の 'all' を加えたもの。 */
export type ArticleSectionFilter = ArticleSection | 'all';

export interface ArticleSectionTab {
  value: ArticleSectionFilter;
  label: string;
  description?: string;
}

/** タブごとの説明（ツールチップ）。section 値に紐づく。'all' は説明なし。 */
const articleSectionDescriptions: Record<ArticleSection, string> = {
  deployment: '実稼働・PoCの結果、現場導入レポート',
  business: '資金調達、量産、市場予測、価格、業界の動き',
  tech: '新モデル発表、技術デモ、性能分析',
  policy: '法規制、安全基準、行政の動き',
  entertainment: 'バイラル動画、一般向け話題、カルチャー',
};

export const ARTICLE_SECTION_TABS: ArticleSectionTab[] = [
  { value: 'all', label: 'すべて' },
  ...articleSectionOrder.map((value) => ({
    value,
    label: articleSectionLabels[value],
    description: articleSectionDescriptions[value],
  })),
];

export function normalizeArticleSectionParam(value: string | null): ArticleSectionFilter {
  return ARTICLE_SECTION_TABS.some((tab) => tab.value === value)
    ? (value as ArticleSectionFilter)
    : 'all';
}
