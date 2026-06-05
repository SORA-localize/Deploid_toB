export const REPORT_PAGE_PARAM = 'page';
export const REPORTS_PER_PAGE = 8;

export function getReportPageCount(totalItems: number) {
  return Math.max(1, Math.ceil(totalItems / REPORTS_PER_PAGE));
}

export function normalizeReportPageParam(value: string | null, pageCount: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(parsed, pageCount);
}

export function getReportPageItems<T>(items: readonly T[], page: number) {
  const start = (page - 1) * REPORTS_PER_PAGE;
  return items.slice(start, start + REPORTS_PER_PAGE);
}

export function getReportPaginationPages(currentPage: number, pageCount: number) {
  const maxVisible = 5;
  if (pageCount <= maxVisible) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const half = Math.floor(maxVisible / 2);
  const start = Math.max(1, Math.min(currentPage - half, pageCount - maxVisible + 1));
  return Array.from({ length: maxVisible }, (_, index) => start + index);
}
