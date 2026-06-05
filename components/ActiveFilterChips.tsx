'use client';

import { X } from 'lucide-react';

export interface ActiveFilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface ActiveFilterChipsProps {
  chips: ActiveFilterChip[];
}

export function ActiveFilterChips({ chips }: ActiveFilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="ml-auto flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground shrink-0">選択中:</span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          aria-label={`${chip.label} を解除`}
        >
          {chip.label}
          <X className="h-2.5 w-2.5 shrink-0" />
        </button>
      ))}
    </div>
  );
}
