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
    <nav className="flex items-center gap-2 text-xs mb-6">
      <Link href="/" className="text-muted-foreground hover:text-foreground">
        {uiText.common.home}
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="w-3 h-3 text-muted-foreground/70" />
          {item.path ? (
            <Link
              href={item.path}
              className="text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
