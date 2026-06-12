'use client';

import Link from 'next/link';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { TagChip } from '@/components/TagChip';
import type { Article } from '@/data/types';
import { articleTypeLabels } from '@/lib/labels';
import { getArticleTypeTone } from '@/lib/visualSemantics';
import { cn } from '@/lib/utils';

interface NewsCardProps {
  report: Article;
  className?: string;
}

export function NewsCard({ report, className }: NewsCardProps) {
  const heroSrc = report.heroImage?.src;

  return (
    <div
      className={cn(
        'card-editorial group relative flex h-full flex-row sm:flex-col',
        className,
      )}
    >
      {/* 画像エリア */}
      <div className="w-20 flex-none self-stretch border-r border-border overflow-hidden bg-muted sm:w-28 md:w-auto md:aspect-video md:border-r-0">
        {heroSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroSrc}
            alt={report.heroImage?.alt ?? ''}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
              {articleTypeLabels[report.type]}
            </span>
          </div>
        )}
      </div>

      {/* テキストエリア */}
      <div className="flex flex-1 flex-col p-3 sm:p-4 min-w-0">
        <div className="mb-2 flex items-center gap-2">
          <TagChip tone={getArticleTypeTone(report.type)} className="text-[10px]">
            {articleTypeLabels[report.type]}
          </TagChip>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {report.publishedAt}
          </span>
          {report.readingTimeMin && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {report.readingTimeMin}分
            </span>
          )}
        </div>

        <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {report.titleJa ?? report.title}
        </h3>

        <p className="mb-3 hidden line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:block">
          {report.summary}
        </p>

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
          <div className="flex flex-wrap gap-1">
            {report.tags.slice(0, 2).map((tag) => (
              <TagChip key={tag} kind="article" value={tag} className="text-[10px]" />
            ))}
          </div>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>

      {/* Accent bottom line */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-[2px] w-0 bg-primary transition-all duration-300 group-hover:w-full"
      />

      <Link href={`/reports/${report.slug}`} className="absolute inset-0 z-20" aria-hidden="true" tabIndex={-1} />
    </div>
  );
}
