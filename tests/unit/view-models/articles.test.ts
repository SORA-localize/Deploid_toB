import { describe, expect, it } from 'vitest';
import { getArticles } from '@/lib/data';
import { normalizeSearchText } from '@/lib/normalizeSearchText';
import { createArticleCatalogItems } from '@/lib/viewModels/articles';

describe('article catalog view models', () => {
  const items = createArticleCatalogItems(getArticles());

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

    for (const article of getArticles()) {
      const bodyValues = [article.whyItMatters, ...(article.keyTakeaways ?? [])];
      for (const value of bodyValues) {
        if (!value || value.length < 12) continue;
        expect(haystack).not.toContain(normalizeSearchText(value));
      }
    }
  });
});
