import { describe, expect, it } from 'vitest';
import { localContentSnapshot } from '@/lib/data/localContentSnapshot';

describe('localContentSnapshot', () => {
  it('exposes every current collection without changing identity', () => {
    expect(localContentSnapshot.robots).toHaveLength(63);
    expect(localContentSnapshot.manufacturers).toHaveLength(26);
    expect(localContentSnapshot.articles).toHaveLength(34);
    expect(localContentSnapshot.useCases).toHaveLength(44);
    expect(localContentSnapshot.deployments).toHaveLength(11);
    expect(localContentSnapshot.articlePlacements.length).toBeGreaterThan(0);
  });
});
