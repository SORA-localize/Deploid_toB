import { describe, expect, it } from 'vitest';
import { filterPublished } from '@/lib/content/createContentRepository';
import { toDomainContentSnapshot } from '@/lib/content/localSource';
import { localContentSnapshot } from '@/lib/data/localContentSnapshot';
import { normalizeSearchText } from '@/lib/normalizeSearchText';
import { createManufacturerCatalogItems } from '@/lib/viewModels/manufacturers';

// Task 6: `@/lib/data`（削除済み）の代わりに、localSource.tsと同じlegacy→domain変換を通した
// fixtureを使う（createManufacturerCatalogItemsは純粋関数のためrepository/DBは不要）。
const snapshot = toDomainContentSnapshot(localContentSnapshot);
const manufacturers = filterPublished(snapshot.manufacturers);
const robots = filterPublished(snapshot.robots);

describe('manufacturer catalog view models', () => {
  it('exclude editorial evidence and full domain records', () => {
    const json = JSON.stringify(createManufacturerCatalogItems(manufacturers, robots));
    expect(json).not.toContain('"sources"');
    expect(json).not.toContain('"headquarters"');
    expect(json).not.toContain('"description"');
    expect(json).not.toContain('"notes"');
    expect(json).not.toContain('"sourceUrl"');
    expect(json).not.toContain('"rights"');
  });

  it('excludes body text values, not just their keys', () => {
    const items = createManufacturerCatalogItems(manufacturers, robots);
    const haystack = normalizeSearchText(items.map((item) => item.filter.searchText).join(' '));

    for (const manufacturer of manufacturers) {
      const bodyValues = [
        manufacturer.description,
        manufacturer.distributorNote,
        manufacturer.supportNote,
        manufacturer.procurementNote,
        manufacturer.vendorRiskNote,
        ...(manufacturer.domesticDistributors ?? []).map((distributor) => distributor.note),
      ];

      for (const value of bodyValues) {
        if (!value || value.length < 12) continue;
        expect(haystack).not.toContain(normalizeSearchText(value));
      }
    }
  });
});
