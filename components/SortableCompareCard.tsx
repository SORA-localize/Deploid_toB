'use client';

import type { ReactNode } from 'react';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface CompareCardDragHandleProps {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  isDragging: boolean;
}

interface SortableCompareCardProps {
  slug: string;
  children: (dragHandleProps: CompareCardDragHandleProps) => ReactNode;
}

export function SortableCompareCard({ slug, children }: SortableCompareCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slug });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'relative opacity-80' : 'relative'}>
      <div
        id={`compare-card-${slug}`}
        className="rounded-sm transition-shadow duration-500"
      >
        {children({ attributes, listeners, isDragging })}
      </div>
    </div>
  );
}
