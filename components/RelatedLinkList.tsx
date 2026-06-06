import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export interface RelatedLinkItem {
  href: string;
  title: string;
  description?: string;
}

interface RelatedLinkListProps {
  id: string;
  title: string;
  items: readonly RelatedLinkItem[];
}

export function RelatedLinkList({ id, title, items }: RelatedLinkListProps) {
  return (
    <div id={id} className="border border-border bg-card p-6 scroll-mt-site-header">
      <h2 className="text-lg font-semibold text-foreground mb-4">{title}</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block p-4 border border-border hover:border-foreground/40 transition-colors"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-foreground mb-1">{item.title}</div>
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                )}
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground/70 flex-shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
