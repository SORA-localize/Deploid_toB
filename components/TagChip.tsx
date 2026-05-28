import type { ReactNode } from 'react';

type TagChipTone = 'neutral' | 'success' | 'warning' | 'info';

interface TagChipProps {
  children: ReactNode;
  tone?: TagChipTone;
  className?: string;
}

const toneClasses: Record<TagChipTone, string> = {
  neutral: 'border-neutral-200 bg-neutral-100 text-neutral-700',
  success: 'border-green-200 bg-green-50 text-green-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
};

export function TagChip({ children, tone = 'neutral', className = '' }: TagChipProps) {
  return (
    <span className={`inline-flex items-center border px-2 py-0.5 text-xs ${toneClasses[tone]} ${className}`}>
      {children}
    </span>
  );
}
