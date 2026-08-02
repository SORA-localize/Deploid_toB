/**
 * 検索文字列の正規化（正本）。
 *
 * `lib/search.ts` から切り出した最小module。`lib/search.ts` は4つの
 * `create*SearchDocument()` と `lib/tags` / `lib/labels` を抱えており、この1関数を
 * 使うためだけに import すると catalog route の client bundle へ30KB以上が乗るため、
 * 依存を持たない独立moduleにしてある。**ここに他moduleへの import を足さないこと。**
 */
export type SearchPrimitive = string | number | null | undefined;

export function normalizeSearchText(value: SearchPrimitive) {
  return String(value ?? '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
}
