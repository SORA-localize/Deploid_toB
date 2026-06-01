import { getRegisteredTag, type TagKind, type TagValue } from '@/lib/tagRegistry';
import type { ReactNode } from 'react';

type TagChipTone = 'neutral' | 'success' | 'warning' | 'info';

interface TagChipProps<K extends TagKind = TagKind> {
  children?: ReactNode;
  kind?: K;
  value?: TagValue<K> | string;
  tone?: TagChipTone;
  className?: string;
}

const toneClasses: Record<TagChipTone, string> = {
  neutral: 'border-neutral-200 bg-neutral-100 text-neutral-700',
  success: 'border-green-200 bg-green-50 text-green-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
};

export function TagChip<K extends TagKind = TagKind>({
  children,
  kind,
  value,
  tone = 'neutral',
  className = '',
}: TagChipProps<K>) {
  const displayLabel = value && kind ? getRegisteredTag(kind, value)?.label ?? value : children;

  return (
    <span className={`inline-flex items-center border px-2 py-0.5 text-xs ${toneClasses[tone]} ${className}`}>
      {displayLabel}
    </span>
  );
}
