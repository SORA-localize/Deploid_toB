import { describe, expect, it } from 'vitest';
import {
  HEADQUARTERS_CLUSTER_DISTANCE,
  clusterProjectedManufacturers,
  createArcPath,
  deOverlap,
  pushAway,
} from '@/lib/worldMap';

const item = (slug: string, x: number, y: number) => ({
  slug,
  x,
  y,
});

describe('clusterProjectedManufacturers', () => {
  it('clusters nearby headquarters without slug-specific rules', () => {
    const clusters = clusterProjectedManufacturers(
      [
        item('unitree', 169.5, 41.5692),
        item('agibot', 171, 40.7032),
        item('distant', 120, 30),
      ],
      HEADQUARTERS_CLUSTER_DISTANCE,
    );
    expect(clusters.map((cluster) => cluster.map(({ slug }) => slug))).toEqual([
      ['agibot', 'unitree'],
      ['distant'],
    ]);
  });

  it('is independent of input order', () => {
    const input = [
      item('a', 10, 10),
      item('b', 11, 10),
      item('c', 12, 10),
    ];
    const forward = clusterProjectedManufacturers(input, 1.1);
    const reverse = clusterProjectedManufacturers([...input].reverse(), 1.1);
    expect(reverse).toEqual(forward);
  });

  it('creates a deterministic quadratic arc path', () => {
    expect(createArcPath({ x: 10, y: 20 }, { x: 30, y: 20 }))
      .toBe('M 10 20 Q 20 13 30 20');
  });
});

describe('deOverlap / pushAway (no input mutation)', () => {
  it('deOverlap does not mutate its input array or element objects', () => {
    const input = [
      item('a', 10, 10),
      item('b', 10.5, 10),
      item('c', 11, 10),
    ];
    const clone = structuredClone(input);
    deOverlap(input, 5);
    expect(input).toEqual(clone);
  });

  it('pushAway does not mutate its movable/fixed input arrays or element objects', () => {
    const movable = [item('a', 10, 10), item('b', 11, 10)];
    const fixed = [item('f1', 10.2, 10), item('f2', 10.8, 10)];
    const movableClone = structuredClone(movable);
    const fixedClone = structuredClone(fixed);
    pushAway(movable, fixed, 5);
    expect(movable).toEqual(movableClone);
    expect(fixed).toEqual(fixedClone);
  });
});
