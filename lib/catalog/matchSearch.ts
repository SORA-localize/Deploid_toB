import { normalizeSearchText } from '@/lib/normalizeSearchText';

/**
 * catalog searchText に対する絞り込み判定。空白区切りの全語が含まれるかを見る。
 * 関連度rankingは持たない（一覧の絞り込み専用）。
 *
 * `lib/catalog/search.ts` から分けてあるのは、あちらが label map 群を import する
 * server専用moduleであり、client側のfilterがそれを引き込まないようにするため。
 */
export function matchesCatalogSearch(searchText: string, query: string): boolean {
  const terms = normalizeSearchText(query).split(' ').filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = normalizeSearchText(searchText);
  return terms.every((term) => haystack.includes(term));
}
