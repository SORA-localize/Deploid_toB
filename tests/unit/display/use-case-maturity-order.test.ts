import { describe, expect, it } from 'vitest';
import { useCaseMaturityOrder } from '@/lib/display';
import { maturityLabels } from '@/lib/labels';

describe('useCaseMaturityOrder', () => {
  it('contains every maturity exactly once', () => {
    expect(new Set(useCaseMaturityOrder)).toEqual(new Set(Object.keys(maturityLabels)));
    expect(new Set(useCaseMaturityOrder).size).toBe(useCaseMaturityOrder.length);
  });
});
