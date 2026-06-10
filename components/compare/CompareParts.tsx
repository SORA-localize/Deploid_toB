'use client';

import { type ReactNode } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { FavoriteCard } from '@/components/FavoriteCard';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import type { Manufacturer, Robot } from '@/data/types';
import {
  getDndItemId,
  type CompareColumnDropData,
  type CompareDropTarget,
  type CompareRobotDragData,
} from '@/lib/compare/dnd';
import { uiText } from '@/lib/uiText';
import { cn } from '@/lib/utils';

interface CompareDroppableAreaProps {
  id: string;
  target: CompareDropTarget;
  isHighlighted: boolean;
  children: (state: {
    setNodeRef: (element: HTMLElement | null) => void;
    isActive: boolean;
  }) => ReactNode;
}

export function CompareDroppableArea({
  id,
  target,
  isHighlighted,
  children,
}: CompareDroppableAreaProps) {
  const data: CompareColumnDropData = { type: 'column', target, dropType: 'column' };
  const { setNodeRef, isOver } = useDroppable({ id, data });

  return children({ setNodeRef, isActive: isOver || isHighlighted });
}

interface DraggableMenuRobotButtonProps {
  robot: Robot;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

export function DraggableMenuRobotButton({
  robot,
  isSelected,
  isDisabled,
  onClick,
}: DraggableMenuRobotButtonProps) {
  const data: CompareRobotDragData = { type: 'robot', source: 'menu', slug: robot.slug };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: getDndItemId('menu', robot.slug),
    data,
    disabled: isDisabled,
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      aria-label={
        isSelected
          ? uiText.comparison.removeAria(robot.nameJa ?? robot.name)
          : uiText.comparison.addAria(robot.nameJa ?? robot.name)
      }
      aria-pressed={isSelected}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'group flex w-full items-center justify-between gap-3 px-6 py-2.5 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        isSelected
          ? 'bg-primary/10 text-foreground hover:bg-primary/15'
          : 'text-foreground/80 hover:bg-muted',
      )}
      style={{ opacity: isDragging ? 0.35 : undefined }}
    >
      <span
        className={cn(
          'min-w-0 flex-1 truncate',
          isSelected ? 'font-semibold text-foreground' : 'text-foreground/80',
        )}
      >
        {robot.nameJa ?? robot.name}
      </span>
      <span className="flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden="true">
        {isSelected && (
          <X className="h-3.5 w-3.5 text-foreground/60 group-hover:text-foreground" />
        )}
      </span>
    </button>
  );
}

interface DraggableFavoriteCardProps {
  robot: Robot;
  manufacturerName?: string;
  manufacturerLogo?: Manufacturer['logo'];
  onRemove: (slug: string) => void;
  onSelect: (slug: string) => void;
}

export function DraggableFavoriteCard({
  robot,
  manufacturerName,
  manufacturerLogo,
  onRemove,
  onSelect,
}: DraggableFavoriteCardProps) {
  const data: CompareRobotDragData = { type: 'robot', source: 'favorite', slug: robot.slug };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: getDndItemId('favorite', robot.slug),
    data,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={uiText.comparison.addAria(robot.nameJa ?? robot.name)}
      className={cn('rounded-sm transition-opacity', isDragging && 'opacity-40')}
    >
      <FavoriteCard
        robot={robot}
        manufacturerName={manufacturerName}
        manufacturerLogo={manufacturerLogo}
        onRemove={onRemove}
        onSelect={onSelect}
      />
    </div>
  );
}

interface CompareDragOverlayCardProps {
  robot: Robot;
  manufacturerName?: string;
  manufacturerLogo?: Manufacturer['logo'];
}

export function CompareDragOverlayCard({
  robot,
  manufacturerName,
  manufacturerLogo,
}: CompareDragOverlayCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0.85, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1.03 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className="pointer-events-none w-56 rounded-sm border border-ring bg-card p-3 text-card-foreground shadow-2xl"
    >
      <h3 className="truncate text-sm font-semibold" title={robot.nameJa ?? robot.name}>
        {robot.nameJa ?? robot.name}
      </h3>
      <ManufacturerLogoName
        name={manufacturerName ?? robot.manufacturerSlug}
        logo={manufacturerLogo}
        className="mt-1 text-xs text-muted-foreground"
        frameClassName="h-4 w-4 shrink-0"
        imageClassName="h-3 w-3"
      />
    </motion.div>
  );
}

export function CompareInsertionPreviewCard({
  robot,
  manufacturerName,
  manufacturerLogo,
}: CompareDragOverlayCardProps) {
  return (
    <article
      className="pointer-events-none flex h-full flex-col border border-dashed border-ring bg-card/70 text-card-foreground opacity-60 shadow-sm"
      aria-hidden="true"
    >
      <div className="border-b border-border-subtle bg-muted/80 p-3">
        <h3 className="truncate text-sm font-semibold text-foreground" title={robot.nameJa ?? robot.name}>
          {robot.nameJa ?? robot.name}
        </h3>
        <ManufacturerLogoName
          name={manufacturerName ?? robot.manufacturerSlug}
          logo={manufacturerLogo}
          className="mt-1 text-xs text-muted-foreground"
          frameClassName="h-4 w-4 shrink-0"
          imageClassName="h-3 w-3"
        />
      </div>
      <div className="border-b border-border-subtle bg-card px-3 py-2 text-center text-xs font-medium text-muted-foreground">
        {uiText.comparison.addToSheet}
      </div>
      <div className="aspect-[3/2] border-b border-border-subtle bg-muted/80" />
      <div className="mt-auto space-y-2.5 p-3">
        <div className="h-3 w-24 bg-muted" />
        <div className="h-3 w-full bg-muted" />
        <div className="h-3 w-4/5 bg-muted" />
      </div>
    </article>
  );
}
