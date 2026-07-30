import type { ManufacturerLogoVariant } from '@/lib/manufacturerLogo';
import type { SearchDocument } from '@/lib/search';
import { normalizeSearchText } from '@/lib/search';
import type { VisualTone } from '@/lib/visualSemantics';

export interface CatalogImage {
  src: string;
  alt: string;
}

export interface CatalogLogoAsset {
  src: string;
  alt: string;
  credit?: string;
  aspectRatio?: number;
}

export interface CatalogLogo {
  asset?: CatalogLogoAsset;
  resolvedVariant?: ManufacturerLogoVariant;
}

export interface CatalogTag {
  label: string;
  tone: VisualTone;
}

export interface CatalogFact {
  key: string;
  label: string;
  value: string;
  href?: string;
}

/**
 * SearchDocument.fields をカタログVMへ永続化する1本のテキストへ畳み込む。
 * SearchDocument自体（tags/urlなど）はサーバー専用の中間表現なので、
 * クライアントへ渡すVMには持ち込まずこの文字列だけを残す。
 */
export function createCatalogSearchText(document: SearchDocument): string {
  return document.fields.join(' ');
}

/** createCatalogSearchText() で作った検索テキストに対する includes 判定。matchesSearchDocument のVM版。 */
export function matchesCatalogSearchText(query: string, searchText: string): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;
  return normalizeSearchText(searchText).includes(normalizedQuery);
}
