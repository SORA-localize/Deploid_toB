'use client';

import Link from 'next/link';
import { TagChip } from '@/components/TagChip';
import type { UseCase } from '@/data/types';
import type { UseCaseCardEvidenceSummary } from '@/lib/useCaseEvidence';
import { maturityLabels } from '@/lib/labels';
import { getUseCaseMaturityTone } from '@/lib/visualSemantics';

interface UseCaseCardProps {
  useCase: UseCase;
  evidenceSummary?: UseCaseCardEvidenceSummary;
  robotNames?: string[];
}

// robots/manufacturers と同じグリッド密度で並ぶことを前提にしたコンパクトな縦カード
// （以前の featured/list 2バリアントは、横幅いっぱいの行カードがグリッドと噛み合わず
//   カードが肥大化する原因だったため統合した）。
export function UseCaseCard({ useCase: u, evidenceSummary, robotNames }: UseCaseCardProps) {
  const maturityTone = getUseCaseMaturityTone(u.maturityLevel);
  const maturityLabel = maturityLabels[u.maturityLevel];

  return (
    <div className="card-data group relative isolate flex h-full min-h-[148px] flex-col overflow-hidden">
      {/* Shimmer + accent line はRobotCard/ManufacturerCardと同じ演出。
          tilt と pointer追従glow は motion 依存だったため除去した（RobotCard と同じ判断）。 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-30 w-[100%] -translate-x-full -skew-x-12 bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-[200%] motion-reduce:hidden"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 z-40 h-[2px] w-0 bg-primary transition-all duration-500 group-hover:w-full motion-reduce:transition-none"
      />

      <Link href={`/use-cases/${u.slug}`} className="relative z-10 flex h-full flex-col p-4">
        <h4 className="mb-1.5 line-clamp-2 text-base font-semibold text-foreground">
          {u.titleJa ?? u.title}
        </h4>
        <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {u.subtitle ?? u.summary}
        </p>
        <div className="mt-auto flex min-w-0 flex-wrap items-center gap-1.5 pt-2">
          <TagChip tone={maturityTone} className="shrink-0 px-1.5 py-0 text-[10px]">
            {maturityLabel}
          </TagChip>
          {evidenceSummary && (
            <TagChip tone={evidenceSummary.tone} className="min-w-0 max-w-full truncate px-1.5 py-0 text-[10px]">
              {evidenceSummary.label}
            </TagChip>
          )}
          {robotNames && robotNames.length > 0 && (
            <span className="min-w-0 truncate text-[11px] text-muted-foreground/80">
              {robotNames.join('・')}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
