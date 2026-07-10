'use client';

import type { ReactNode } from 'react';
import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
  UniqueIdentifier,
} from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface CompareCardDragHandleProps {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  isDragging: boolean;
}

interface SortableCompareCardProps {
  /** ロボットの不変id（DOM要素id `compare-card-<id>` とハイライトに使う） */
  robotId: string;
  /** dnd-kit 用の識別子。未指定なら robotId を使う */
  sortableId?: UniqueIdentifier;
  data?: Record<string, unknown>;
  /** ルート要素に追加するクラス（比較表のセル内余白など） */
  className?: string;
  children: (dragHandleProps: CompareCardDragHandleProps) => ReactNode;
}

export function SortableCompareCard({ robotId, sortableId, data, className, children }: SortableCompareCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId ?? robotId, data });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    // ドラッグ中は元の位置に薄いプレースホルダとして残り、着地点を示す。
    // 実際に持ち上がって動くカードは DragOverlay 側が描画する。
    <div
      ref={setNodeRef}
      style={style}
      className={[isDragging ? 'relative opacity-40' : 'relative', className].filter(Boolean).join(' ')}
    >
      <div
        id={`compare-card-${robotId}`}
        className="rounded-lg transition-shadow duration-500"
      >
        {children({ attributes, listeners, isDragging })}
      </div>
    </div>
  );
}
