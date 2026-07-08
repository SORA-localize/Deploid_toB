import Image from 'next/image';
import Link from 'next/link';
import type { Article } from '@/data/types';
import { getArticleCardLabel } from '@/lib/articleShelves';
import { getDisplayableAsset } from '@/lib/media';
import { cn } from '@/lib/utils';

interface NewsFeatureCardProps {
  report: Article;
  className?: string;
}

export function NewsFeatureCard({ report, className }: NewsFeatureCardProps) {
  const hero = getDisplayableAsset(report.heroImage);

  return (
    <Link
      href={`/reports/${report.slug}`}
      className={cn(
        'group relative block h-full overflow-hidden rounded-xl border border-border bg-muted/30 transition-colors hover:border-foreground/30',
        className,
      )}
    >
      {hero ? (
        <Image
          src={hero.src}
          alt={hero.alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-1000 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
          <span className="text-sm text-muted-foreground">No Image</span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-end p-5">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="rounded-sm bg-signal px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-signal-foreground">
              {getArticleCardLabel(report)}
            </span>
            <time className="font-mono text-xs text-white/60">{report.publishedAt}</time>
          </div>

          <h2 className="line-clamp-2 text-base font-bold leading-tight text-white transition-colors group-hover:text-signal motion-reduce:transition-none">
            {report.titleJa ?? report.title}
          </h2>

          <p className="hidden line-clamp-2 text-xs leading-relaxed text-white/75 transition-colors group-hover:text-white motion-reduce:transition-none 2xl:block">
            {report.summary}
          </p>
        </div>
      </div>
    </Link>
  );
}
