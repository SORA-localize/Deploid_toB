import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { uiText } from '@/lib/uiText';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1 sm:gap-2 text-xs mb-6 min-w-0 overflow-hidden">
      <Link href="/" className="text-muted-foreground hover:text-foreground shrink-0">
        {uiText.common.home}
      </Link>
      {items.map((item, index) => (
        <div
          key={index}
          className={`flex items-center gap-1 sm:gap-2 ${item.path ? 'shrink-0' : 'min-w-0 overflow-hidden'}`}
        >
          <ChevronRight className="w-3 h-3 text-muted-foreground/70 shrink-0" />
          {item.path ? (
            <Link
              href={item.path}
              className="text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground truncate">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
