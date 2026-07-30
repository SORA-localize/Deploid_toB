import { describe, expect, it } from 'vitest';
import { getManufacturers, getRobots } from '@/lib/data';
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
});
