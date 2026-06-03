'use client';

import type { ReactNode } from 'react';
import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
  UniqueIdentifier,
} from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

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
    // アクティブカードはポインタに1:1で追従させたいので transition を切る。
    // 周囲カードの整列アニメは dnd-kit の transition に任せる。
    transition: isDragging ? 'none' : transition,
    zIndex: isDragging ? 30 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        id={`compare-card-${slug}`}
        className={cn('rounded-sm transition-shadow duration-200', isDragging && 'shadow-2xl')}
      >
        {children({ attributes, listeners, isDragging })}
      </div>
    </div>
  );
}
