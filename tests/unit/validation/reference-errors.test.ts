import { describe, expect, it } from 'vitest';
import { localContentSnapshot } from '@/lib/data/localContentSnapshot';
import { validateContentSnapshot } from '@/lib/validation/validateContentSnapshot';

describe('cross collection validation', () => {
  it('rejects a missing deployment manufacturer', () => {
    const snapshot = structuredClone(localContentSnapshot);
    snapshot.deployments[0].manufacturerId = 'missing-manufacturer';

    expect(validateContentSnapshot(snapshot).errors).toContain(
      `[missing] deployment "${snapshot.deployments[0].id}".manufacturerId -> "missing-manufacturer" は存在しません`,
    );
  });
});
