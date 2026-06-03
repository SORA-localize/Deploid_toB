import {
  closestCenter,
  pointerWithin,
  type CollisionDetection,
} from '@dnd-kit/core';

export type CompareDragSource = 'menu' | 'sheet' | 'favorite';
export type CompareDropTarget = 'menu' | 'sheet' | 'favorite';

export interface CompareRobotDragData extends Record<string, unknown> {
  type: 'robot';
  slug: string;
  source: CompareDragSource;
  target?: CompareDropTarget;
  dropType?: 'sheet-card';
}

export interface CompareColumnDropData extends Record<string, unknown> {
  type: 'column';
  target: CompareDropTarget;
  dropType: 'column';
}

export type CompareDropData =
  | { target: CompareDropTarget; dropType: 'column'; slug?: undefined }
  | { target: CompareDropTarget; dropType: 'sheet-card'; slug: string };

export const compareColumnIds = {
  menu: 'menu-column',
  sheet: 'sheet-column',
  favorite: 'fav-column',
} as const satisfies Record<CompareDropTarget, string>;

export const dndPrefixBySource = {
  menu: 'menu',
  sheet: 'sheet',
  favorite: 'fav',
} as const satisfies Record<CompareDragSource, string>;

export function getDndItemId(source: CompareDragSource, slug: string) {
  return `${dndPrefixBySource[source]}-${slug}`;
}

// シートカードの droppable id (sheet-{slug})。列 (sheet-column) は除外する。
const isSheetCardId = (id: string | number) =>
  id !== compareColumnIds.sheet && String(id).startsWith(`${dndPrefixBySource.sheet}-`);

export const compareCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);

  // 1) ポインタが乗っているシートカードを最優先(挿入位置を厳密に決めるため)。
  const pointerSheetCards = pointerCollisions.filter(({ id }) => isSheetCardId(id));
  if (pointerSheetCards.length > 0) return pointerSheetCards;

  // 2) シート列(カード間の隙間を含む)の上なら、最も近いシートカードに寄せる。
  //    これにより隙間でも over がカードになり、挿入位置が先頭に固定されない。
  if (pointerCollisions.some(({ id }) => id === compareColumnIds.sheet)) {
    const closestSheetCards = closestCenter(args).filter(({ id }) => isSheetCardId(id));
    if (closestSheetCards.length > 0) return closestSheetCards;
  }

  // 3) それ以外(メニュー/お気に入り列、空のシート等)は通常判定。
  return pointerCollisions.length > 0 ? pointerCollisions : closestCenter(args);
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function getRobotDragData(value: unknown): CompareRobotDragData | null {
  if (!isRecord(value)) return null;
  if (value.type !== 'robot') return null;
  if (typeof value.slug !== 'string') return null;
  if (value.source !== 'menu' && value.source !== 'sheet' && value.source !== 'favorite') {
    return null;
  }

  return {
    type: 'robot',
    slug: value.slug,
    source: value.source,
    target:
      value.target === 'menu' || value.target === 'sheet' || value.target === 'favorite'
        ? value.target
        : undefined,
    dropType: value.dropType === 'sheet-card' ? value.dropType : undefined,
  };
}

export function getDropData(value: unknown): CompareDropData | null {
  if (!isRecord(value)) return null;

  if (
    value.type === 'column' &&
    value.dropType === 'column' &&
    (value.target === 'menu' || value.target === 'sheet' || value.target === 'favorite')
  ) {
    return { target: value.target, dropType: 'column' };
  }

  if (
    value.type === 'robot' &&
    value.dropType === 'sheet-card' &&
    value.target === 'sheet' &&
    typeof value.slug === 'string'
  ) {
    return { target: 'sheet', dropType: 'sheet-card', slug: value.slug };
  }

  return null;
}
