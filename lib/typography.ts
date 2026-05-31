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
