import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageListHeaderProps {
  title: string;
  description: string;
  className?: string;
  action?: ReactNode;
}

export function PageListHeader({ title, description, className = 'mb-5', action }: PageListHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-6', className)}>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold text-foreground mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">{description}</p>
      </div>
      {action && (
        <div className="shrink-0 w-full sm:w-64 sm:pt-1">
          {action}
        </div>
      )}
    </div>
  );
}
