import { describe, expect, it } from 'vitest';
import { localContentSnapshot } from '@/lib/data/localContentSnapshot';
import { validateData } from '@/lib/validate';
import { validateContentSnapshot } from '@/lib/validation/validateContentSnapshot';

describe('validation compatibility', () => {
  it('keeps the current result byte-for-byte', () => {
    expect(validateContentSnapshot(localContentSnapshot)).toEqual(validateData());
  });
});
