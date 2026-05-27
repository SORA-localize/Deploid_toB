import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs" aria-label="Breadcrumb">
      <Link
        href="/"
        className="uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        HOME
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          {item.href ? (
            <Link
              href={item.href}
              className="uppercase tracking-wide text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Link>
          ) : (
            <span className="uppercase tracking-wide text-foreground">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
