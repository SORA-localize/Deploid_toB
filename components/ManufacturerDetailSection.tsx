import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ManufacturerDetailSectionProps {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ManufacturerDetailSection({
  id,
  eyebrow,
  title,
  description,
  action,
  children,
  className,
}: ManufacturerDetailSectionProps) {
  return (
    <section
      id={id}
      className={cn('scroll-mt-site-header border-b border-border py-8', className)}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          {eyebrow && (
            <p className="mb-2 text-xs font-medium text-muted-foreground">{eyebrow}</p>
          )}
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
