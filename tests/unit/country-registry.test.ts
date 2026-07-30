import { describe, expect, it } from 'vitest';
import { getCountryDisplay } from '@/lib/countryRegistry';

describe('getCountryDisplay', () => {
  it('returns registered Japanese label and ISO code', () => {
    expect(getCountryDisplay('China')).toEqual({ name: '中国', alpha3: 'CHN' });
  });

  it('uses a deterministic fallback for an unknown country', () => {
    expect(getCountryDisplay('Brazil')).toEqual({ name: 'Brazil', alpha3: 'BRA' });
  });
});
