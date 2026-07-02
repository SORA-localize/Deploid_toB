import type { Article } from '@/data/types';
import { articleSectionLabels, articleTypeLabels } from '@/lib/labels';

export type ArticleShelf = 'all' | 'news' | 'manufacturer-guide' | 'robot-guide' | 'basics-guide';

export interface ArticleShelfTab {
  value: ArticleShelf;
  label: string;
  /** true のときタブは表示するがクリック不可・UI無効表示。コンテンツが揃ったらここを外す（Single Source of Truth）。 */
  disabled?: boolean;
}

export const ARTICLE_SHELF_TABS: ArticleShelfTab[] = [
  { value: 'all',                label: 'すべて' },
  { value: 'news',               label: 'ニュース' },
  { value: 'manufacturer-guide', label: 'メーカー解説' },
  { value: 'robot-guide',        label: 'ロボット解説' },
  { value: 'basics-guide',       label: '基礎知識', disabled: true },
];

export function getArticleShelf(article: Article): Exclude<ArticleShelf, 'all'> {
  if (article.type === 'manufacturer-guide') return 'manufacturer-guide';
  if (article.type === 'robot-guide') return 'robot-guide';
  if (article.type === 'basics-guide') return 'basics-guide';
  return 'news';
}

/**
 * カード・ヘッダーで読者向けに表示するラベル。
 * 解説・基礎知識は棚名をそのまま出す。ニュースは section ラベルで話題を示す。
 */
export function getArticleCardLabel(article: Article): string {
  const shelf = getArticleShelf(article);
  if (shelf !== 'news') return articleTypeLabels[article.type];
  return articleSectionLabels[article.section];
}

/** 'basics-guide' は 'all' にフォールバック（disabled タブへの直アクセス保護）。 */
export function normalizeArticleShelfParam(value: string | null): ArticleShelf {
  if (value === 'news' || value === 'manufacturer-guide' || value === 'robot-guide') {
    return value;
  }
  return 'all';
}

/**
 * 棚→一覧URLの正本。パンくず等のリンク生成はここを経由する。
 * normalizeArticleShelfParam が受け付けない棚（all / disabled中の basics-guide）は
 * クエリ無しの一覧へ落とし、無効な kind 付きURLを配らない。
 */
export function getArticleShelfHref(shelf: ArticleShelf): string {
  if (normalizeArticleShelfParam(shelf) !== shelf) return '/reports';
  return shelf === 'all' ? '/reports' : `/reports?kind=${shelf}`;
}
