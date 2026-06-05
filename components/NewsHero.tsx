import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';
import { TagChip } from '@/components/TagChip';
import type { Report } from '@/data/types';
import { reportTypeLabels } from '@/lib/labels';
import { getReportTypeTone } from '@/lib/visualSemantics';

interface NewsHeroProps {
  report: Report;
}

export function NewsHero({ report }: NewsHeroProps) {
  const heroSrc = report.heroImage?.src;

  return (
    <Link href={`/reports/${report.slug}`} className="group block border border-border bg-card hover:border-foreground/30 transition-colors duration-200">
      {/* 画像 */}
      <div className="aspect-video w-full overflow-hidden bg-muted">
        {heroSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroSrc}
            alt={report.heroImage?.alt ?? ''}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground/40">
              {reportTypeLabels[report.type]}
            </span>
          </div>
        )}
      </div>

      {/* テキスト */}
      <div className="p-6 md:p-8">
        <div className="mb-3 flex items-center gap-3">
          <TagChip tone={getReportTypeTone(report.type)}>
            {reportTypeLabels[report.type]}
          </TagChip>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {report.publishedAt}
          </span>
          {report.author && (
            <span className="text-xs text-muted-foreground">{report.author}</span>
          )}
        </div>

        <h2 className="mb-3 text-2xl font-semibold leading-tight text-foreground md:text-3xl">
          {report.titleJa ?? report.title}
        </h2>

        <p className="mb-4 max-w-3xl text-sm leading-relaxed text-muted-foreground line-clamp-2">
          {report.whyItMatters}
        </p>

        <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-transform group-hover:translate-x-0.5">
          続きを読む
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>

      {/* Accent bottom line */}
      <div
        aria-hidden="true"
        className="h-[2px] w-0 bg-primary transition-all duration-300 group-hover:w-full"
      />
    </Link>
  );
}
