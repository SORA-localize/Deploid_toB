'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSharedActiveSection } from '@/lib/activeSectionContext';
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
  const ids = useMemo(() => items.map((item) => item.href.replace('#', '')), [items]);
  const activeId = useSharedActiveSection(ids);

  return (
    <div className="sticky top-site-header-gap">
      <div className="py-3">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {uiText.common.contents}
        </h3>
        <nav className="space-y-1">
          {items.map((item) => {
            const id = item.href.replace('#', '');
            const isActive = activeId === id;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`block border-l-2 py-1.5 pl-2 pr-1 text-xs transition-colors duration-200 ${
                  isActive
                    ? 'border-primary font-semibold text-foreground'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
        <div className="mt-5">
          <Link href={backHref} className="text-xs text-muted-foreground hover:text-foreground">
            ← {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
