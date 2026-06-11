export const ARTICLE_PAGE_PARAM = 'page';
export const ARTICLES_PER_PAGE = 12; // xl (4列) × 3行 — responsive hook で上書きされる

export function getArticlePageCount(totalItems: number, perPage = ARTICLES_PER_PAGE) {
  return Math.max(1, Math.ceil(totalItems / perPage));
}

export function normalizeReportPageParam(value: string | null, pageCount: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(parsed, pageCount);
}

export function getArticlePageItems<T>(items: readonly T[], page: number, perPage = ARTICLES_PER_PAGE) {
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
}

export function getArticlePaginationPages(currentPage: number, pageCount: number) {
  const maxVisible = 5;
  if (pageCount <= maxVisible) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const half = Math.floor(maxVisible / 2);
  const start = Math.max(1, Math.min(currentPage - half, pageCount - maxVisible + 1));
  return Array.from({ length: maxVisible }, (_, index) => start + index);
}
