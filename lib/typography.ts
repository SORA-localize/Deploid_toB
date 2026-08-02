import { loadDefaultJapaneseParser } from 'budoux';

// Singleton instance to prevent parsing model recreation on every render/request
let parser: ReturnType<typeof loadDefaultJapaneseParser> | null = null;

export function getBudouXParser() {
  if (!parser) {
    parser = loadDefaultJapaneseParser();
  }
  return parser;
}

/**
 * Parses a Japanese string into an array of chunks separated by natural word boundaries.
 */
export function parseJapaneseText(text: string): string[] {
  if (!text) return [];
  const p = getBudouXParser();
  return p.parse(text);
}

/**
 * 改行で分けたうえで各行を分かち書きし、行ごとのチャンク配列にする。
 *
 * **この関数はserverでだけ呼ぶこと。** budoux のモデルは実測263,562バイトあり、
 * client componentのimport chainへ入れると catalog route の bundle に丸ごと乗る
 * （2026-08-02にNewsCard経由で実際に起きていた）。戻り値はプリミティブの配列なので
 * そのまま client component へ props で渡せる。
 */
export function segmentJapaneseLines(text: string): string[][] {
  if (!text) return [];
  return text.split('\n').map((line) => parseJapaneseText(line));
}
