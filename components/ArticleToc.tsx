import Link from 'next/link';
import { uiText } from '@/lib/uiText';

export interface ArticleTocItem {
  label: string;
  href: string;
}

interface ArticleTocProps {
  items: readonly ArticleTocItem[];
  backHref: string;
  backLabel: string;
}

export function ArticleToc({ items, backHref, backLabel }: ArticleTocProps) {
  return (
    <div className="sticky top-6">
      <div className="border border-neutral-300 bg-white p-4">
        <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-3 pb-2 border-b border-neutral-200">
          {uiText.common.contents}
        </h3>
        <nav className="space-y-1">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block text-xs text-neutral-700 hover:text-neutral-900 py-1.5 px-2 -mx-2 hover:bg-neutral-50 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="mt-4 pt-3 border-t border-neutral-200">
          <Link href={backHref} className="text-xs text-neutral-600 hover:text-neutral-900">
            ← {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
