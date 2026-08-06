'use client';

import Link from 'next/link';
import { CardHoverEffects } from '@/components/CardHoverEffects';
import { TagChip } from '@/components/TagChip';
import type { UseCaseCatalogItem } from '@/lib/viewModels/useCases';

interface UseCaseCardProps {
  item: UseCaseCatalogItem;
}

// robots/manufacturers と同じグリッド密度で並ぶことを前提にしたコンパクトな縦カード
// （以前の featured/list 2バリアントは、横幅いっぱいの行カードがグリッドと噛み合わず
//   カードが肥大化する原因だったため統合した）。
export function UseCaseCard({ item }: UseCaseCardProps) {
  const { evidence, robotNames } = item;

  return (
    <div className="card-data group relative isolate flex h-full min-h-[148px] flex-col overflow-hidden">
      <CardHoverEffects />

      <Link href={item.href} className="relative z-10 flex h-full flex-col p-4">
        <h4 className="mb-1.5 line-clamp-2 text-base font-semibold text-foreground">
          {item.title}
        </h4>
        <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {item.lead}
        </p>
        <div className="mt-auto flex min-w-0 flex-wrap items-center gap-1.5 pt-2">
          <TagChip tone={item.maturity.tone} className="shrink-0 px-1.5 py-0 text-[10px]">
            {item.maturity.label}
          </TagChip>
          {evidence && (
            <TagChip tone={evidence.tone} className="min-w-0 max-w-full truncate px-1.5 py-0 text-[10px]">
              {evidence.label}
            </TagChip>
          )}
          {robotNames.length > 0 && (
            <span className="min-w-0 truncate text-[11px] text-muted-foreground/90">
              {robotNames.join('・')}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
