import { cn } from '@/lib/utils';

export interface ManufacturerDetailSectionLink {
  label: string;
  href: string;
  count?: number;
}

interface ManufacturerDetailSectionNavProps {
  sections: readonly ManufacturerDetailSectionLink[];
  ariaLabel: string;
  variant?: 'inline' | 'sticky';
  activeHref?: string;
  className?: string;
}

export function ManufacturerDetailSectionNav({
  sections,
  ariaLabel,
  variant = 'inline',
  activeHref,
  className,
}: ManufacturerDetailSectionNavProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        'flex min-w-0 items-center overflow-x-auto text-xs',
        variant === 'inline' ? 'gap-5 border-b border-border' : 'gap-5',
        className,
      )}
    >
      {sections.map((section) => {
        const isActive = section.href === activeHref;
        return (
          <a
            key={section.href}
            href={section.href}
            aria-current={isActive ? 'location' : undefined}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap font-medium transition-colors hover:text-foreground',
              variant === 'inline'
                ? cn('py-3', isActive ? 'border-b-2 border-foreground text-foreground' : 'text-muted-foreground')
                : isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground',
            )}
          >
            <span>{section.label}</span>
            {typeof section.count === 'number' && (
              <span className="text-[10px] text-muted-foreground/80">({section.count})</span>
            )}
          </a>
        );
      })}
    </nav>
  );
}
