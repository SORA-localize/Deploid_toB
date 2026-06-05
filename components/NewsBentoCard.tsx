import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';
import { TagChip } from '@/components/TagChip';
import type { Report } from '@/data/types';
import { reportTypeLabels } from '@/lib/labels';
import { getReportTypeTone } from '@/lib/visualSemantics';
import { cn } from '@/lib/utils';

interface NewsBentoCardProps {
  report: Report;
  /** col-span-N などのグリッド配置クラス */
  className?: string;
  /** 大カード（画像大きく・タイトル大きく） */
  featured?: boolean;
}

export function NewsBentoCard({ report, className, featured = false }: NewsBentoCardProps) {
  const heroSrc = report.heroImage?.src;

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden border border-border bg-card transition-colors duration-200 hover:border-foreground/30',
        className,
      )}
    >
      {/* 画像 */}
      <div className={cn('overflow-hidden bg-muted', featured ? 'h-48 md:h-56' : 'h-32')}>
        {heroSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroSrc}
            alt={report.heroImage?.alt ?? ''}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/40">
              {reportTypeLabels[report.type]}
            </span>
          </div>
        )}
      </div>

      {/* テキスト */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <TagChip tone={getReportTypeTone(report.type)} className="text-[10px]">
            {reportTypeLabels[report.type]}
          </TagChip>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {report.publishedAt}
          </span>
        </div>

        <h2
          className={cn(
            'font-semibold leading-snug text-foreground',
            featured ? 'mb-3 text-lg line-clamp-3' : 'mb-2 text-sm line-clamp-2',
          )}
        >
          {report.titleJa ?? report.title}
        </h2>

        {featured && (
          <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {report.whyItMatters}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground">続きを読む</span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>

      {/* Accent bottom line */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-[2px] w-0 bg-primary transition-all duration-300 group-hover:w-full"
      />

      <Link href={`/reports/${report.slug}`} className="absolute inset-0 z-10" aria-hidden="true" tabIndex={-1} />
    </div>
  );
}
