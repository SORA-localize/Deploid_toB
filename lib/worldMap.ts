export interface Point {
  x: number;
  y: number;
}

export interface ProjectedManufacturer extends Point {
  slug: string;
}

export const HEADQUARTERS_CLUSTER_DISTANCE = 1.8;
export const ARC_END_MIN_DISTANCE = 2.6;

export function clusterProjectedManufacturers<T extends ProjectedManufacturer>(
  items: readonly T[],
  maxDistance = HEADQUARTERS_CLUSTER_DISTANCE,
): T[][] {
  const sorted = [...items].sort((a, b) => a.slug.localeCompare(b.slug));
  const parent = sorted.map((_, index) => index);
  const find = (index: number): number =>
    parent[index] === index ? index : (parent[index] = find(parent[index]));
  const union = (left: number, right: number) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot;
  };
  for (let left = 0; left < sorted.length; left += 1) {
    for (let right = left + 1; right < sorted.length; right += 1) {
      if (Math.hypot(sorted[left].x - sorted[right].x, sorted[left].y - sorted[right].y) <= maxDistance) {
        union(left, right);
      }
    }
  }
  const groups = new Map<number, T[]>();
  sorted.forEach((entry, index) => {
    const root = find(index);
    groups.set(root, [...(groups.get(root) ?? []), entry]);
  });
  return [...groups.values()].sort((a, b) => a[0].slug.localeCompare(b[0].slug));
}

export function createArcPath(start: Point, end: Point) {
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  const lift = Math.min(distance * 0.35, 26);
  const controlX = (start.x + end.x) / 2;
  const controlY = Math.min(start.y, end.y) - lift;
  return `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;
}

// points同士を相互に反発させてminDistanceを確保する。inputは変更せず、copy上で計算して返す。
export function deOverlap<T extends Point>(points: readonly T[], minDistance: number): T[] {
  const result = points.map((point) => ({ ...point }));
  for (let iter = 0; iter < 80; iter += 1) {
    let moved = false;
    for (let i = 0; i < result.length; i += 1) {
      for (let j = i + 1; j < result.length; j += 1) {
        let dx = result[j].x - result[i].x;
        let dy = result[j].y - result[i].y;
        let dist = Math.hypot(dx, dy);
        if (dist >= minDistance) continue;
        if (dist < 1e-6) {
          const angle = i * 2.399963229728653; // 完全一致は黄金角で決定的に分離
          dx = Math.cos(angle);
          dy = Math.sin(angle);
          dist = 1;
        }
        const push = (minDistance - dist) / 2;
        const ux = dx / dist;
        const uy = dy / dist;
        result[i].x -= ux * push;
        result[i].y -= uy * push;
        result[j].x += ux * push;
        result[j].y += uy * push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return result;
}

// movableをfixed（動かさない）とmovable同士からminDistanceだけ離す。inputは変更せず、copy上で計算して返す。
export function pushAway<T extends Point, F extends Point>(
  movable: readonly T[],
  fixed: readonly F[],
  minDistance: number,
): T[] {
  let result = movable.map((point) => ({ ...point }));
  for (let iter = 0; iter < 60; iter += 1) {
    let moved = false;
    for (let m = 0; m < result.length; m += 1) {
      for (let f = 0; f < fixed.length; f += 1) {
        let dx = result[m].x - fixed[f].x;
        let dy = result[m].y - fixed[f].y;
        let dist = Math.hypot(dx, dy);
        if (dist >= minDistance) continue;
        if (dist < 1e-6) {
          const angle = (m + f) * 2.399963229728653;
          dx = Math.cos(angle);
          dy = Math.sin(angle);
          dist = 1;
        }
        const push = minDistance - dist;
        result[m].x += (dx / dist) * push;
        result[m].y += (dy / dist) * push;
        moved = true;
      }
    }
    result = deOverlap(result, minDistance); // movable同士も離す
    if (!moved) break;
  }
  return result;
}
