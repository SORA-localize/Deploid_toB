import { describe, expect, it } from 'vitest';
import { getManufacturers, getRobots } from '@/lib/data';
import { normalizeSearchText } from '@/lib/normalizeSearchText';
import { createManufacturerCatalogItems } from '@/lib/viewModels/manufacturers';

describe('manufacturer catalog view models', () => {
  it('exclude editorial evidence and full domain records', () => {
    const json = JSON.stringify(createManufacturerCatalogItems(getManufacturers(), getRobots()));
    expect(json).not.toContain('"sources"');
    expect(json).not.toContain('"headquarters"');
    expect(json).not.toContain('"description"');
    expect(json).not.toContain('"notes"');
    expect(json).not.toContain('"sourceUrl"');
    expect(json).not.toContain('"rights"');
  });

  it('excludes body text values, not just their keys', () => {
    const items = createManufacturerCatalogItems(getManufacturers(), getRobots());
    const haystack = normalizeSearchText(items.map((item) => item.filter.searchText).join(' '));

    for (const manufacturer of getManufacturers()) {
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
