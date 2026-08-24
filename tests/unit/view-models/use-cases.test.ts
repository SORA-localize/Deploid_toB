import { describe, expect, it } from 'vitest';
import { filterPublished } from '@/lib/content/createContentRepository';
import { toDomainContentSnapshot } from '@/lib/content/localSource';
import { localContentSnapshot } from '@/lib/data/localContentSnapshot';
import { normalizeSearchText } from '@/lib/normalizeSearchText';
import { createUseCaseCatalogItems } from '@/lib/viewModels/useCases';

// Task 6: `@/lib/data`（削除済み）の代わりに、localSource.tsと同じlegacy→domain変換を通した
// fixtureを使う（createUseCaseCatalogItemsは純粋関数のためrepository/DBは不要）。
const snapshot = toDomainContentSnapshot(localContentSnapshot);
const robots = filterPublished(snapshot.robots);
const useCases = filterPublished(snapshot.useCases);

describe('use case catalog view models', () => {
  const items = createUseCaseCatalogItems(useCases, robots);

  it('excludes editorial fields', () => {
    const json = JSON.stringify(items);
    expect(json).not.toContain('"sources"');
    expect(json).not.toContain('"candidateRobots"');
    expect(json).not.toContain('"capabilityNotes"');
    expect(json).not.toContain('"atAGlance"');
  });

  it('excludes body text values, not just their keys', () => {
    const haystack = normalizeSearchText(items.map((item) => item.filter.searchText).join(' '));

    for (const useCase of useCases) {
      const bodyValues: (string | undefined)[] = [
        useCase.overview,
        useCase.whyItMatters,
        useCase.whyHardToday,
        useCase.environmentRequirements,
        useCase.japanDeploymentConditions,
        ...Object.values(useCase.capabilityNotes),
      ];

      for (const value of bodyValues) {
        if (typeof value !== 'string' || value.length < 12) continue;
        expect(haystack).not.toContain(normalizeSearchText(value));
      }
    }
  });
});
