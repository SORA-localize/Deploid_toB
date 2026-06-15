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
  const data: CompareRobotDragData = { type: 'robot', source: 'menu', id: robot.id };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: getDndItemId('menu', robot.id),
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
        'group flex min-h-10 w-full items-center justify-between gap-3 py-2 pr-3 text-left text-[11px] transition-colors border-l-2 disabled:cursor-not-allowed disabled:opacity-50',
        isSelected
          ? 'border-primary bg-primary/8 pl-[22px] text-primary hover:bg-primary/12'
          : 'border-transparent pl-[22px] text-foreground/70 hover:bg-muted/60 hover:text-foreground',
      )}
      style={{ opacity: isDragging ? 0.35 : undefined }}
    >
      <span aria-hidden="true" className="shrink-0 text-muted-foreground/60">
        └
      </span>
      <span
        className={cn(
          'min-w-0 flex-1 truncate',
          isSelected ? 'font-semibold text-primary' : 'text-foreground/70',
        )}
      >
        {robot.nameJa ?? robot.name}
      </span>
      <span className="flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden="true">
        {isSelected && (
          <X className="h-3.5 w-3.5 text-primary/70 group-hover:text-primary" />
        )}
      </span>
    </button>
  );
}

interface DraggableFavoriteCardProps {
  robot: Robot;
  manufacturerName?: string;
  manufacturerLogo?: Manufacturer['logo'];
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
}

export function DraggableFavoriteCard({
  robot,
  manufacturerName,
  manufacturerLogo,
  onRemove,
  onSelect,
}: DraggableFavoriteCardProps) {
  const data: CompareRobotDragData = { type: 'robot', source: 'favorite', id: robot.id };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: getDndItemId('favorite', robot.id),
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
        name={manufacturerName ?? robot.manufacturerId}
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
}: CompareDragOverlayCardProps) {
  return (
    <article
      className="pointer-events-none relative aspect-[5/7] w-full overflow-hidden
                 rounded-lg border border-dashed border-ring bg-card/70 opacity-60"
      aria-hidden="true"
    >
      {/* 画像エリアのスケルトン */}
      <div className="absolute inset-0 bg-muted/80" />

      {/* top overlay スケルトン */}
      <div
        className="absolute top-0 inset-x-0 z-10 flex items-center gap-2
                   px-2.5 pt-2 pb-8
                   bg-gradient-to-b from-black/40 to-transparent"
      >
        <div className="h-3 w-3 shrink-0 rounded-sm bg-white/20" />
        <div className="h-3 w-[55%] rounded-sm bg-white/20" />
      </div>

      {/* bottom overlay スケルトン */}
      <div
        className="absolute bottom-0 inset-x-0 z-10 flex justify-end px-2.5 pb-2
                   bg-gradient-to-t from-black/30 to-transparent"
      >
        <div className="h-2.5 w-16 rounded-sm bg-white/20" />
      </div>
    </article>
  );
}
