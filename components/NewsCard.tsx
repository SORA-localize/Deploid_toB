import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';
import { BudouXText } from '@/components/BudouXText';
import { TagChip } from '@/components/TagChip';
import type { Article } from '@/data/types';
import { getArticleCardLabel } from '@/lib/articleShelves';
import { getDisplayableAsset } from '@/lib/media';
import { getArticleTypeTone } from '@/lib/visualSemantics';
import { cn } from '@/lib/utils';

interface NewsCardProps {
  report: Article;
  className?: string;
}

export function NewsCard({ report, className }: NewsCardProps) {
  const hero = getDisplayableAsset(report.heroImage);

  return (
    <div
      className={cn(
        'card-editorial group relative flex h-full flex-row sm:flex-col',
        className,
      )}
    >
      {/* 画像エリア */}
      <div className="relative hidden sm:block sm:w-28 sm:flex-none sm:self-stretch sm:border-r sm:border-border sm:overflow-hidden sm:bg-muted md:w-auto md:aspect-video md:border-r-0">
        {hero ? (
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            sizes="(max-width: 768px) 112px, 280px"
            className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
              {getArticleCardLabel(report)}
            </span>
          </div>
        )}
      </div>

      {/* テキストエリア */}
      <div className="flex flex-1 flex-col p-3 sm:p-4 min-w-0">
        <div className="mb-2 flex items-center gap-2">
          <TagChip tone={getArticleTypeTone(report.type)} className="text-[10px]">
            {getArticleCardLabel(report)}
          </TagChip>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {report.publishedAt}
          </span>
        </div>

        <h3 className="mb-2 line-clamp-3 text-sm font-semibold leading-snug text-foreground">
          <BudouXText text={report.titleJa ?? report.title} />
        </h3>

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
          <div className="flex flex-wrap gap-1">
            {(report.themeTags ?? []).slice(0, 2).map((tag) => (
              <TagChip key={tag} kind="theme" value={tag} className="text-[10px]" />
            ))}
          </div>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none" />
        </div>
      </div>

      {/* Accent bottom line */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-[2px] w-0 bg-primary transition-all duration-300 group-hover:w-full motion-reduce:transition-none"
      />

      <Link href={`/reports/${report.slug}`} className="absolute inset-0 z-20" aria-hidden="true" tabIndex={-1} />
    </div>
  );
}
