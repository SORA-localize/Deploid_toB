import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export interface RelatedLinkItem {
  href: string;
  title: string;
  description?: string;
}

interface RelatedLinkListProps {
  id: string;
  title?: string;
  ariaLabel?: string;
  items: readonly RelatedLinkItem[];
  titleLevel?: 'h2' | 'h3';
  /** 'compact' はサイドバー向け：見出し・説明文・カード装飾を省き、リンク行のみ表示する */
  variant?: 'card' | 'compact';
}

export function RelatedLinkList({
  id,
  title,
  ariaLabel,
  items,
  titleLevel = 'h2',
  variant = 'card',
}: RelatedLinkListProps) {
  if (variant === 'compact') {
    return (
      <nav aria-label={ariaLabel ?? title ?? id}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block break-words border-b border-border py-2 text-xs text-foreground/80 hover:text-foreground [overflow-wrap:anywhere] last:border-b-0"
          >
            {item.title}
          </Link>
        ))}
      </nav>
    );
  }

  const Heading = titleLevel;
  const headingId = `${id}-heading`;

  return (
    <section id={id} aria-labelledby={headingId} className="scroll-mt-site-header">
      <Heading id={headingId} className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title ?? ariaLabel ?? id}
      </Heading>
      <div className="divide-y divide-border">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-start justify-between gap-4 py-4 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50"
          >
            <div className="min-w-0 flex-1">
              <div className="mb-1 break-words text-sm font-semibold text-foreground [overflow-wrap:anywhere]">
                {item.title}
              </div>
              {item.description && (
                <p className="line-clamp-2 break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                  {item.description}
                </p>
              )}
            </div>
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </section>
  );
}
