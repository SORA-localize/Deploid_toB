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
  slug: string;
  id?: UniqueIdentifier;
  data?: Record<string, unknown>;
  children: (dragHandleProps: CompareCardDragHandleProps) => ReactNode;
}

export function SortableCompareCard({ slug, id, data, children }: SortableCompareCardProps) {
  const sortableId = id ?? slug;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId, data });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    // ドラッグ中は元の位置に薄いプレースホルダとして残り、着地点を示す。
    // 実際に持ち上がって動くカードは DragOverlay 側が描画する。
    <div ref={setNodeRef} style={style} className={isDragging ? 'relative opacity-40' : 'relative'}>
      <div
        id={`compare-card-${slug}`}
        className="rounded-lg transition-shadow duration-500"
      >
        {children({ attributes, listeners, isDragging })}
      </div>
    </div>
  );
}
