import type { Article } from '@/data/types';
import { getArticleCardLabel, getArticleShelf, type ArticleShelf } from '@/lib/articleShelves';
import { createArticleCatalogSearchText } from '@/lib/catalog/search';
import { getDisplayableAsset } from '@/lib/media';
import { segmentJapaneseLines } from '@/lib/typography';
import { getArticleTypeTone } from '@/lib/visualSemantics';
import type { CatalogImage, CatalogTag } from './shared';

export interface ArticleCatalogItem {
  id: string;
  slug: string;
  href: string;
  /** card見出し。`titleJa ?? title` を解決済み。 */
  title: string;
  /**
   * タイトルの分かち書き結果。budoux（実測263,562バイト）を client bundle へ
   * 持ち込まないため server 側で解決する。`lib/typography.ts` は client 到達禁止
   * （scripts/check-client-import-graph.mjs）。
   */
  titleSegments: string[][];
  summary: string;
  publishedAt: string;
  /** card の種別チップ。label は shelf に応じて type/section を出し分けた結果。 */
  type: CatalogTag;
  shelf: Exclude<ArticleShelf, 'all'>;
  themeTags: string[];
  heroImage?: CatalogImage;
  searchText: string;
}

/**
 * 記事一覧のview model。clientへ渡すのはこれだけで、raw `Article` は渡さない。
 *
 * `whyItMatters` / `keyTakeaways` / `body` / `manufacturerGuideContent` /
 * `sources` / `relatedRobotIds` は含めない。
 *
 * `summary` を全件に持たせるのは「cardに表示するから」ではない。`NewsCard` は
 * summary を描画せず、描画するのは hero/feature に選ばれた数件だけである。
 * それでも全件に持たせるのは、**placement が server 側で決まり VM の形を
 * placement 依存にしたくないため**と、記事数が少なく全件保持のコストが
 * 許容範囲だからである。この理由付けを誤ると次に同じ判断をする人が誤って一般化する。
 */
export function createArticleCatalogItems(articles: readonly Article[]): ArticleCatalogItem[] {
  return articles.map((article) => {
    const hero = getDisplayableAsset(article.heroImage);
    const title = article.titleJa ?? article.title;

    return {
      id: article.id,
      slug: article.slug,
      href: `/reports/${article.slug}`,
      title,
      titleSegments: segmentJapaneseLines(title),
      summary: article.summary,
      publishedAt: article.publishedAt,
      type: {
        label: getArticleCardLabel(article),
        tone: getArticleTypeTone(article.type),
      },
      shelf: getArticleShelf(article),
      themeTags: [...(article.themeTags ?? [])],
      // rights / source metadata は持ち込まず src と alt だけへ写像する。
      heroImage: hero ? { src: hero.src, alt: hero.alt } : undefined,
      searchText: createArticleCatalogSearchText(article),
    };
  });
}
