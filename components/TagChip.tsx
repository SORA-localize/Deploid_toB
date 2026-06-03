import { getRegisteredTag, type TagKind, type TagValue } from '@/lib/tagRegistry';
import { cn } from '@/lib/utils';
import {
  getTagKindTone,
  getVisualToneClassName,
  type VisualTone,
} from '@/lib/visualSemantics';
import type { ReactNode } from 'react';

export type TagChipTone = VisualTone;

interface TagChipProps<K extends TagKind = TagKind> {
  children?: ReactNode;
  kind?: K;
  value?: TagValue<K> | string;
  tone?: TagChipTone;
  className?: string;
}

export function TagChip<K extends TagKind = TagKind>({
  children,
  kind,
  value,
  tone,
  className = '',
}: TagChipProps<K>) {
  const displayLabel = value && kind ? getRegisteredTag(kind, value)?.label ?? value : children;
  const resolvedTone = tone ?? (kind ? getTagKindTone(kind) : 'neutral');

  return (
    <span
      className={cn(
        'inline-flex items-center border px-2 py-0.5 text-xs',
        getVisualToneClassName(resolvedTone),
        className,
      )}
    >
      {displayLabel}
    </span>
  );
}
