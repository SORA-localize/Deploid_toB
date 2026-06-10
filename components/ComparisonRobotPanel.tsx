'use client';

import Link from 'next/link';
import { ExternalLink, Star, X } from 'lucide-react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import type { CompareCardDragHandleProps } from '@/components/SortableCompareCard';
import type { ImageAsset, Robot } from '@/data/types';
import { deploymentStageLabels, TBD_LABEL } from '@/lib/labels';
import { getComparisonCoreRows, getComparisonDetailRows } from '@/lib/robotDisplay';
import { uiText } from '@/lib/uiText';
import { getDeploymentStageTone } from '@/lib/visualSemantics';
import { TagChip } from '@/components/TagChip';

interface ComparisonRobotPanelProps {
  robot: Robot;
  manufacturerName?: string;
  manufacturerLogo?: ImageAsset;
  isFavorite: boolean;
  onFavoriteToggle: (slug: string) => void;
  onRemove: (slug: string) => void;
  dragHandleProps?: CompareCardDragHandleProps;
}

function CompactList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-xs text-muted-foreground">{TBD_LABEL}</p>;
  return (
    <ul className="space-y-1 text-xs text-foreground">
      {items.map((item) => (
        <li key={item} className="flex gap-1.5">
          <span className="text-muted-foreground/70 shrink-0">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ComparisonRobotPanel({
  robot,
  manufacturerName,
  manufacturerLogo,
  isFavorite,
  onFavoriteToggle,
  onRemove,
  dragHandleProps,
}: ComparisonRobotPanelProps) {
  const coreRows = getComparisonCoreRows(robot);
  const detailRows = getComparisonDetailRows(robot);

  // 透過PNG → hero の順でフォールバック
  const cardImage = robot.images?.transparent ?? robot.images?.hero ?? robot.heroImage;

  return (
    <article className="flex flex-col border border-border bg-card text-card-foreground h-full relative">

      {/* ── ヘッダー（D&D ハンドル + keyboard sortable の入口）── */}
      <div
        className={`border-b border-border-subtle bg-muted px-3 py-2.5 flex items-start justify-between gap-3 ${
          dragHandleProps
            ? 'cursor-grab touch-none select-none active:cursor-grabbing'
            : ''
        }`}
        aria-label={dragHandleProps ? uiText.comparison.reorderAria(robot.nameJa ?? robot.name) : undefined}
        title={dragHandleProps ? uiText.comparison.reorderHint : undefined}
        {...dragHandleProps?.attributes}
        {...dragHandleProps?.listeners}
      >
        {/* 名前・メーカー */}
        <div className="min-w-0 flex-1">
          <h3
            className="text-sm font-semibold text-foreground leading-tight truncate"
            title={robot.nameJa ?? robot.name}
          >
            {robot.nameJa ?? robot.name}
          </h3>
          <ManufacturerLogoName
            name={manufacturerName ?? robot.manufacturerSlug}
            logo={manufacturerLogo}
            className="mt-0.5 text-xs text-muted-foreground"
            frameClassName="h-3.5 w-3.5 shrink-0"
            imageClassName="h-2.5 w-2.5"
          />
        </div>
        {/* ★ ✕ */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label={
              isFavorite
                ? uiText.favorites.ariaRemove(robot.nameJa ?? robot.name)
                : uiText.favorites.ariaAdd(robot.nameJa ?? robot.name)
            }
            aria-pressed={isFavorite}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onFavoriteToggle(robot.slug)}
            className="p-1 hover:bg-muted rounded-sm transition-colors text-muted-foreground hover:text-foreground"
          >
            <Star className={`h-3.5 w-3.5 ${isFavorite ? 'fill-favorite text-favorite' : ''}`} />
          </button>
          <button
            type="button"
            aria-label={uiText.comparison.removeAria(robot.nameJa ?? robot.name)}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onRemove(robot.slug)}
            className="p-1 hover:bg-muted rounded-sm transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── 画像エリア（Popover トリガー）── */}
      <PopoverPrimitive.Root>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            aria-label={uiText.comparison.detailsAria(robot.nameJa ?? robot.name)}
            onPointerDown={(e) => e.stopPropagation()}
            className="group relative flex-1 flex items-end justify-center bg-muted w-full
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                       min-h-[200px]"
          >
            {cardImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cardImage.src}
                alt={cardImage.alt}
                className="w-full h-full object-contain object-bottom absolute inset-0
                           transition-transform duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <span className="text-xs text-muted-foreground z-10">
                {uiText.robots.mainImageMissing}
              </span>
            )}
            {/* ホバーオーバーレイ */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200"
            />
            <span
              aria-hidden="true"
              className="relative z-10 mb-2 rounded-sm bg-card/80 px-2 py-0.5 text-[10px]
                         font-medium text-foreground opacity-0 group-hover:opacity-100
                         transition-opacity duration-200 backdrop-blur-sm"
            >
              {uiText.comparison.detailsLabel}
            </span>
          </button>
        </PopoverPrimitive.Trigger>

        {/* ── Popover 詳細パネル ── */}
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            side="bottom"
            align="start"
            sideOffset={4}
            collisionPadding={8}
            className="z-[var(--z-dropdown)] w-[min(400px,90vw)] max-h-[80vh] overflow-y-auto
                       border border-border bg-card text-card-foreground shadow-lg
                       data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
                       data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border p-3">
              <h4 className="text-sm font-semibold text-foreground truncate">
                {robot.nameJa ?? robot.name}
              </h4>
              <PopoverPrimitive.Close
                aria-label={uiText.comparison.closeDetail}
                className="shrink-0 p-1 text-muted-foreground hover:text-foreground rounded-sm transition-colors
                           focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" />
              </PopoverPrimitive.Close>
            </div>

            <div className="p-3 space-y-5">
              <section>
                <h5 className="mb-2 text-xs font-semibold text-foreground pb-1.5 border-b border-border-subtle">
                  {uiText.comparison.coreVariables}
                </h5>
                <dl className="space-y-2 text-xs">
                  {coreRows.map((row) => (
                    <div key={row.label} className="flex justify-between gap-3 border-b border-border-subtle pb-2 last:border-0 last:pb-0">
                      <dt className="shrink-0 text-muted-foreground">{row.label}</dt>
                      <dd className="text-right font-medium text-foreground break-words max-w-[65%]">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section>
                <h5 className="mb-2 text-xs font-semibold text-foreground pb-1.5 border-b border-border-subtle">
                  {uiText.comparison.detailedData}
                </h5>
                <dl className="space-y-2 text-xs">
                  {detailRows.map((row) => (
                    <div key={row.label} className="flex justify-between gap-3 border-b border-border-subtle pb-2 last:border-0 last:pb-0">
                      <dt className="shrink-0 text-muted-foreground">{row.label}</dt>
                      <dd className="text-right font-medium text-foreground break-words max-w-[65%]">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              {(robot.comparison.bestFit.length > 0 ||
                robot.comparison.notFit.length > 0 ||
                robot.comparison.strengths.length > 0 ||
                robot.comparison.constraints.length > 0) && (
                <section className="space-y-3">
                  {robot.comparison.bestFit.length > 0 && (
                    <div>
                      <h5 className="mb-1 text-xs font-semibold text-foreground">{uiText.compare.bestFit}</h5>
                      <CompactList items={robot.comparison.bestFit} />
                    </div>
                  )}
                  {robot.comparison.notFit.length > 0 && (
                    <div>
                      <h5 className="mb-1 text-xs font-semibold text-foreground">{uiText.compare.notFit}</h5>
                      <CompactList items={robot.comparison.notFit} />
                    </div>
                  )}
                  {robot.comparison.strengths.length > 0 && (
                    <div>
                      <h5 className="mb-1 text-xs font-semibold text-foreground">{uiText.compare.strengths}</h5>
                      <CompactList items={robot.comparison.strengths} />
                    </div>
                  )}
                  {robot.comparison.constraints.length > 0 && (
                    <div>
                      <h5 className="mb-1 text-xs font-semibold text-foreground">{uiText.compare.constraints}</h5>
                      <CompactList items={robot.comparison.constraints} />
                    </div>
                  )}
                </section>
              )}

              <Link
                href={`/robots/${robot.slug}`}
                className="flex items-center justify-between border border-border p-2.5 text-xs
                           text-foreground/80 hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                <span>{uiText.comparison.viewRobotPage}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </Link>
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {/* ── deploymentStage バッジ ── */}
      <div className="border-t border-border-subtle px-3 py-2 flex items-center gap-2">
        <TagChip tone={getDeploymentStageTone(robot.deploymentStage)} className="text-[10px] py-0.5">
          {deploymentStageLabels[robot.deploymentStage]}
        </TagChip>
      </div>

    </article>
  );
}
