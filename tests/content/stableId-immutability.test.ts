import { describe, expect, it } from 'vitest';
import { immutableStableId } from '@/lib/payload/access';

describe('immutableStableId', () => {
  it('rejects changing an existing stableId', () => {
    expect(immutableStableId({ data: { stableId: 'new' }, doc: { stableId: 'old' } } as never)).toBe(false);
  });

  it('allows creation and unchanged updates', () => {
    expect(immutableStableId({ data: { stableId: 'new' }, doc: undefined } as never)).toBe(true);
    expect(immutableStableId({ data: { stableId: 'same' }, doc: { stableId: 'same' } } as never)).toBe(true);
  });
});
