import MiniSearch from 'minisearch';
import type { Article, UseCase } from '@/data/types';
import { createReportSearchDocument, createUseCaseSearchDocument } from '@/lib/search';

// 日本語は空白で区切られないため、MiniSearch 既定のトークナイザでは語に分割できない。
// Intl.Segmenter('ja') の単語境界分割をインデックス時・検索時の両方で使う（同一トークナイザが必須）。
const segmenter =
  typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter('ja', { granularity: 'word' })
    : null;

/** 日本語を含むテキストを語に分割する。Segmenter があれば単語境界で、無ければ区切り文字で分割。 */
export function tokenizeJa(text: string): string[] {
  const lower = text.toLowerCase();
  if (!segmenter) {
    return lower.split(/[\s　、。・,.!?！？「」『』（）()/]+/).filter(Boolean);
  }
  const tokens: string[] = [];
  for (const segment of segmenter.segment(lower)) {
    if (segment.isWordLike) tokens.push(segment.segment);
  }
  return tokens;
}

interface SearchIndexDocument {
  id: string;
  text: string;
}

export type ArticleSearchIndex = MiniSearch<SearchIndexDocument>;
export type UseCaseSearchIndex = MiniSearch<SearchIndexDocument>;

const SEARCH_OPTIONS = { prefix: true, fuzzy: 0.2, combineWith: 'AND' as const };

export function createArticleSearchIndex(reports: readonly Article[]): ArticleSearchIndex {
  const index = new MiniSearch<SearchIndexDocument>({
    fields: ['text'],
    tokenize: tokenizeJa,
    searchOptions: SEARCH_OPTIONS,
  });
  index.addAll(
    reports.map((report) => ({
      id: report.slug,
      // 検索対象テキストは lib/search.ts の SearchDocument に集約（title/summary/whyItMatters/タグlabel 等）。
      text: createReportSearchDocument(report).fields.join(' '),
    })),
  );
  return index;
}

/** クエリにマッチする記事 slug の集合を返す。空クエリは null（＝テキスト絞り込みなし＝全件通過）。 */
export function searchArticleSlugs(index: ArticleSearchIndex, query: string): Set<string> | null {
  if (!query.trim()) return null;
  return new Set(index.search(query).map((result) => String(result.id)));
}

export function createUseCaseSearchIndex(useCases: readonly UseCase[]): UseCaseSearchIndex {
  const index = new MiniSearch<SearchIndexDocument>({
    fields: ['text'],
    tokenize: tokenizeJa,
    searchOptions: SEARCH_OPTIONS,
  });
  index.addAll(
    useCases.map((useCase) => ({
      id: useCase.slug,
      text: createUseCaseSearchDocument(useCase).fields.join(' '),
    })),
  );
  return index;
}

/** クエリにマッチする用途 slug の集合を返す。空クエリは null（＝テキスト絞り込みなし＝全件通過）。 */
export function searchUseCaseSlugs(index: UseCaseSearchIndex, query: string): Set<string> | null {
  if (!query.trim()) return null;
  return new Set(index.search(query).map((result) => String(result.id)));
}
