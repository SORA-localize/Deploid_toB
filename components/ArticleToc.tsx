'use client';

import { useEffect, useState } from 'react';
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
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting);
        if (visibleEntry) {
          setActiveId(visibleEntry.target.id);
        }
      },
      { rootMargin: '-10% 0px -80% 0px' },
    );

    items.forEach((item) => {
      const id = item.href.replace('#', '');
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  return (
    <div className="sticky top-6">
      <div className="border border-neutral-300 bg-white p-4">
        <h3 className="text-xs font-semibold text-neutral-900 mb-3 pb-2 border-b border-neutral-200">
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
                className={`block text-xs py-1.5 px-2 -mx-2 transition-all duration-200 ${
                  isActive
                    ? 'text-accent font-semibold bg-accent/5 border-l-2 border-accent'
                    : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                {item.label}
              </a>
            );
          })}
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
