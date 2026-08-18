/**
 * `docs/plans/content-platform-migration-plan-v1.md` Task 7 Step 5.5。
 *
 * `lib/content/cacheDependencies.ts` を唯一の依存表として、表の宣言と各ソースファイルの
 * 実際の `cacheTag(contentTags.X)` 呼び出しを機械的に突き合わせる。表と実装のどちらかだけを
 * 変えると、このテストが落ちる（Task 6で起きた「機械ゲートの文言と実装の乖離」の再発防止）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALL_CONTENT_TAG_KEYS, allDependencyTagKeys, cachedViewDependencies } from '../../lib/content/cacheDependencies';
import { contentTags, type ContentTagKey } from '../../lib/content/cacheTags';

const REPO_ROOT = path.resolve(__dirname, '../..');

function readSource(relativePath: string): string {
  const fullPath = path.join(REPO_ROOT, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`cacheDependencies.ts references a source file that does not exist: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

/** `cacheTag(contentTags.X)` 呼び出しをsource文字列から抽出する（1 file = 1 cached関数前提）。 */
function extractCacheTagKeys(source: string): ContentTagKey[] {
  const pattern = /cacheTag\(contentTags\.(\w+)\)/g;
  const found: ContentTagKey[] = [];
  for (const match of source.matchAll(pattern)) {
    found.push(match[1] as ContentTagKey);
  }
  return found;
}

describe('cacheDependencies.ts ⇄ 実装の整合性', () => {
  it('表の全idが重複なく1回だけ登録されている', () => {
    const ids = cachedViewDependencies.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('表の全tagキーは contentTags に実在する', () => {
    const validKeys = new Set(Object.keys(contentTags));
    for (const entry of cachedViewDependencies) {
      for (const tag of entry.tags) {
        expect(validKeys.has(tag), `${entry.id}: unknown tag key "${tag}"`).toBe(true);
      }
    }
  });

  it.each(cachedViewDependencies)(
    '$id ($sourceFile): source中の実際のcacheTag()呼び出しが表のtag集合と完全一致する',
    (entry) => {
      const source = readSource(entry.sourceFile);

      expect(source, `${entry.sourceFile} must contain 'use cache' — it is not actually a cached view`).toMatch(
        /'use cache'/,
      );

      const actualTags = extractCacheTagKeys(source);
      const actualSet = new Set(actualTags);
      const expectedSet = new Set(entry.tags);

      // 表に無いtagが実装に有る（表が古い＝乖離）
      for (const tag of actualSet) {
        expect(expectedSet.has(tag), `${entry.id}: source calls cacheTag(contentTags.${tag}) but the table doesn't declare it`).toBe(
          true,
        );
      }
      // 表に有るtagが実装に無い（実装が古い、またはcacheTag呼び出し漏れ＝乖離）
      for (const tag of expectedSet) {
        expect(actualSet.has(tag), `${entry.id}: the table declares "${tag}" but source never calls cacheTag(contentTags.${tag})`).toBe(
          true,
        );
      }

      // 同じtagを2回呼んでいないか（cacheTag自体は複数回呼んでも害はないが、表との1:1対応を
      // 崩さないため、重複呼び出しが紛れ込んだら気づけるようにしておく）。
      expect(actualTags.length, `${entry.id}: duplicate cacheTag() calls for the same key`).toBe(actualSet.size);
    },
  );

  it('全9 collection + settings（10 tag）に、少なくとも1つのcached view consumerがある', () => {
    const covered = allDependencyTagKeys();
    const missing = ALL_CONTENT_TAG_KEYS.filter((key) => !covered.has(key));
    expect(missing, `these content tags have zero cached-view consumers: ${missing.join(', ')}`).toEqual([]);
  });

  it('ALL_CONTENT_TAG_KEYS は contentTags の実際のkey集合と一致する（片方だけ更新されていないか）', () => {
    expect(new Set(ALL_CONTENT_TAG_KEYS)).toEqual(new Set(Object.keys(contentTags)));
    expect(ALL_CONTENT_TAG_KEYS.length).toBe(10);
  });
});
