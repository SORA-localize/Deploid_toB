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
    <div id={id} className="border border-neutral-300 bg-white p-6 scroll-mt-6">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">{title}</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block p-4 border border-neutral-300 hover:border-neutral-500 transition-colors"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-neutral-900 mb-1">{item.title}</div>
                {item.description && (
                  <p className="text-sm text-neutral-700 line-clamp-2">{item.description}</p>
                )}
              </div>
              <ArrowRight className="w-5 h-5 text-neutral-400 flex-shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
