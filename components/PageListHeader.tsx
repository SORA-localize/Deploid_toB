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
    <div className={className}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-6 mb-2">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {action && (
          <div className="shrink-0 w-full sm:w-96">
            {action}
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">{description}</p>
    </div>
  );
}
