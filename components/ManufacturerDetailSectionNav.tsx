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
  className?: string;
}

export function ManufacturerDetailSectionNav({
  sections,
  ariaLabel,
  variant = 'inline',
  className,
}: ManufacturerDetailSectionNavProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        'flex min-w-0 items-center overflow-x-auto text-xs',
        variant === 'inline'
          ? 'gap-5 border-b border-border'
          : 'gap-5',
        className,
      )}
    >
      {sections.map((section) => (
        <a
          key={section.href}
          href={section.href}
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap font-medium transition-colors hover:text-foreground',
            variant === 'inline'
              ? 'py-3 text-muted-foreground'
              : 'text-muted-foreground',
          )}
        >
          <span>{section.label}</span>
          {typeof section.count === 'number' && (
            <span className="text-[10px] text-muted-foreground/80">({section.count})</span>
          )}
        </a>
      ))}
    </nav>
  );
}
