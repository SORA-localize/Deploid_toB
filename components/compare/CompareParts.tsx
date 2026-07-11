'use client';

import { Star, X } from 'lucide-react';
import type { Robot } from '@/data/types';
import { uiText } from '@/lib/uiText';
import { cn } from '@/lib/utils';

interface MenuRobotButtonProps {
  robot: Robot;
  isSelected: boolean;
  isDisabled: boolean;
  /** お気に入り登録済み表示（表示のみ。誤タップ防止のため、この行から★の操作はさせない） */
  isFavorite?: boolean;
  onClick: () => void;
}

/**
 * メーカーメニューの機体行。行クリックで比較シートへ追加/解除する。
 * D&D のドラッグ元ではない（カラム間の移動はクリック操作。計画 §8.7）。
 * 追加できることはホバー/フォーカスで現れる「追加」ラベルで示す（タッチでは常時表示）。
 */
export function MenuRobotButton({
  robot,
  isSelected,
  isDisabled,
  isFavorite = false,
  onClick,
}: MenuRobotButtonProps) {
  return (
    <button
      type="button"
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
      {isFavorite && (
        <Star
          className="h-3 w-3 shrink-0 fill-favorite text-favorite"
          aria-hidden="true"
        />
      )}
      <span className="flex h-4 shrink-0 items-center justify-center" aria-hidden="true">
        {isSelected ? (
          <X className="h-3.5 w-3.5 text-primary/70 group-hover:text-primary" />
        ) : (
          <span className="text-[10px] font-medium text-primary opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100">
            {uiText.comparison.addToSheet}
          </span>
        )}
      </span>
    </button>
  );
}
