import { describe, expect, it } from 'vitest';
import { getRobots, getUseCases } from '@/lib/data';
import { normalizeSearchText } from '@/lib/normalizeSearchText';
import { createUseCaseCatalogItems } from '@/lib/viewModels/useCases';

describe('use case catalog view models', () => {
  const items = createUseCaseCatalogItems(getUseCases(), getRobots());

  it('excludes editorial fields', () => {
    const json = JSON.stringify(items);
    expect(json).not.toContain('"sources"');
    expect(json).not.toContain('"candidateRobots"');
    expect(json).not.toContain('"capabilityNotes"');
    expect(json).not.toContain('"atAGlance"');
  });

  it('excludes body text values, not just their keys', () => {
    const haystack = normalizeSearchText(items.map((item) => item.filter.searchText).join(' '));

    for (const useCase of getUseCases()) {
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
