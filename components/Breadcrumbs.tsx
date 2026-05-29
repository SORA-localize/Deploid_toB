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
      <Link href="/" className="text-neutral-500 hover:text-neutral-900 uppercase tracking-wide">
        {uiText.common.home}
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="w-3 h-3 text-neutral-400" />
          {item.path ? (
            <Link
              href={item.path}
              className="text-neutral-500 hover:text-neutral-900 uppercase tracking-wide"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-neutral-900 uppercase tracking-wide">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
