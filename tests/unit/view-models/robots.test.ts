import { describe, expect, it } from 'vitest';
import { getManufacturers, getRobots, getUseCases } from '@/lib/data';
import { createRobotCatalogItems } from '@/lib/viewModels/robots';

describe('robot catalog view models', () => {
  it('exclude editorial evidence and full domain records', () => {
    const json = JSON.stringify(
      createRobotCatalogItems(getRobots(), getManufacturers(), getUseCases()),
    );
    expect(json).not.toContain('"sources"');
    expect(json).not.toContain('"fieldEvidence"');
    expect(json).not.toContain('"comparison"');
    expect(json).not.toContain('"priceOffers"');
    expect(json).not.toContain('"sourceUrl"');
    expect(json).not.toContain('"rights"');
  });
});
