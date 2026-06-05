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
    <div className="site-container pb-2 flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-muted-foreground shrink-0">選択中:</span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1 border border-border px-2 py-0.5 text-xs text-foreground transition-colors hover:border-foreground/40 hover:text-muted-foreground"
          aria-label={`${chip.label} を解除`}
        >
          {chip.label}
          <X className="h-3 w-3 shrink-0" />
        </button>
      ))}
    </div>
  );
}
