import { describe, expect, it } from 'vitest';
import { validateData } from '@/lib/validate';

describe('current content baseline', () => {
  it('has no blocking validation errors', () => {
    expect(validateData().errors).toEqual([]);
  });
});
