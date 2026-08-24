import { describe, expect, it } from 'vitest';
import { filterPublished } from '@/lib/content/createContentRepository';
import { toDomainContentSnapshot } from '@/lib/content/localSource';
import { localContentSnapshot } from '@/lib/data/localContentSnapshot';
import { normalizeSearchText } from '@/lib/normalizeSearchText';
import { createArticleCatalogItems } from '@/lib/viewModels/articles';

// Task 6: `@/lib/data`（削除済み）の代わりに、localSource.tsと同じlegacy→domain変換を通した
// fixtureを使う（createArticleCatalogItemsは純粋関数のためrepository/DBは不要）。
const snapshot = toDomainContentSnapshot(localContentSnapshot);
const articles = filterPublished(snapshot.articles);

describe('article catalog view models', () => {
  const items = createArticleCatalogItems(articles);

  it('excludes editorial fields', () => {
    const json = JSON.stringify(items);
    expect(json).not.toContain('"sources"');
    expect(json).not.toContain('"body"');
    expect(json).not.toContain('"manufacturerGuideContent"');
    expect(json).not.toContain('"relatedRobotIds"');
    expect(json).not.toContain('"keyTakeaways"');
    expect(json).not.toContain('"rights"');
  });

  it('excludes body text values, not just their keys', () => {
    const haystack = normalizeSearchText(items.map((item) => item.searchText).join(' '));

    for (const article of articles) {
      const bodyValues = [article.whyItMatters, ...(article.keyTakeaways ?? [])];
      for (const value of bodyValues) {
        if (!value || value.length < 12) continue;
        expect(haystack).not.toContain(normalizeSearchText(value));
      }
    }
  });
});
