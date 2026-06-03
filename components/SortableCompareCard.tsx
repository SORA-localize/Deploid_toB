'use client';

import type { ReactNode } from 'react';
import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { uiText } from '@/lib/uiText';

interface SortableCompareCardProps {
  slug: string;
  name: string;
  children: ReactNode;
}

export function SortableCompareCard({ slug, name, children }: SortableCompareCardProps) {
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
      <div className="mb-1 flex justify-end">
        <button
          type="button"
          aria-label={uiText.comparison.reorderAria(name)}
          title={uiText.comparison.reorderHint}
          className="inline-flex h-8 w-8 touch-none items-center justify-center border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div
        id={`compare-card-${slug}`}
        className="rounded-sm transition-shadow duration-500"
      >
        {children}
      </div>
    </div>
  );
}
