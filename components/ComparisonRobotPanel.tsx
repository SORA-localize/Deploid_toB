'use client';

import Link from 'next/link';
import { ExternalLink, Star, X } from 'lucide-react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import type { CompareCardDragHandleProps } from '@/components/SortableCompareCard';
import type { ImageAsset, Robot } from '@/data/types';
import { japanAvailabilityLabels, TBD_LABEL } from '@/lib/labels';
import { getComparisonCoreRows, getComparisonDetailRows } from '@/lib/robotDisplay';
import { uiText } from '@/lib/uiText';

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
  const hero = robot.images?.hero ?? robot.heroImage;
  const distributorDisplay =
    robot.distributorJapan ?? japanAvailabilityLabels[robot.japanAvailability];

  return (
    <article className="flex flex-col border border-border bg-card text-card-foreground h-full relative">

      {/* ── ヘッダー（D&D ハンドル + keyboard sortable の入口）── */}
      <div
        className={`border-b border-border-subtle bg-muted p-3 flex flex-col gap-4 ${
          dragHandleProps
            ? 'cursor-grab touch-none select-none active:cursor-grabbing'
            : ''
        }`}
        aria-label={dragHandleProps ? uiText.comparison.reorderAria(robot.nameJa ?? robot.name) : undefined}
        title={dragHandleProps ? uiText.comparison.reorderHint : undefined}
        {...dragHandleProps?.attributes}
        {...dragHandleProps?.listeners}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3
              className="text-sm font-semibold text-foreground truncate"
              title={robot.nameJa ?? robot.name}
            >
              {robot.nameJa ?? robot.name}
            </h3>
            <ManufacturerLogoName
              name={manufacturerName ?? robot.manufacturerSlug}
              logo={manufacturerLogo}
              className="mt-1 text-xs text-muted-foreground"
              frameClassName="h-4 w-4 shrink-0"
              imageClassName="h-3 w-3"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label={
                isFavorite
                  ? uiText.favorites.ariaRemove(robot.nameJa ?? robot.name)
                  : uiText.favorites.ariaAdd(robot.nameJa ?? robot.name)
              }
              aria-pressed={isFavorite}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => onFavoriteToggle(robot.slug)}
              className="p-1.5 hover:bg-muted rounded-sm transition-colors text-muted-foreground hover:text-foreground"
            >
              <Star
                className={`h-4 w-4 ${
                  isFavorite ? 'fill-favorite text-favorite' : 'currentColor'
                }`}
              />
            </button>
            <button
              type="button"
              aria-label={uiText.comparison.removeAria(robot.nameJa ?? robot.name)}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => onRemove(robot.slug)}
              className="p-1.5 hover:bg-muted rounded-sm transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── サムネ（Popover トリガー）── */}
      <PopoverPrimitive.Root>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            aria-label={uiText.comparison.detailsAria(robot.nameJa ?? robot.name)}
            onPointerDown={(event) => event.stopPropagation()}
            className="group relative block w-full border-b border-border-subtle bg-muted
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="aspect-[3/2] w-full overflow-hidden flex items-center justify-center text-xs text-muted-foreground">
              {hero ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={hero.src}
                  alt={hero.alt}
                  className="h-full w-full object-contain transition-opacity duration-200 group-hover:opacity-80"
                />
              ) : (
                uiText.robots.mainImageMissing
              )}
            </div>
            {/* ホバーオーバーレイ（視覚的ヒントのみ） */}
            <div
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center
                         bg-black/0 group-hover:bg-black/20 transition-colors duration-200"
            >
              <span
                className="rounded-sm bg-card/90 px-2.5 py-1 text-xs font-medium text-foreground
                           opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                {uiText.comparison.detailsLabel}
              </span>
            </div>
          </button>
        </PopoverPrimitive.Trigger>

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
            {/* Popover ヘッダー */}
            <div className="flex items-center justify-between gap-3 border-b border-border p-3">
              <h4 className="text-sm font-semibold text-foreground truncate">
                {robot.nameJa ?? robot.name}
              </h4>
              <PopoverPrimitive.Close
                aria-label={uiText.comparison.closeDetail}
                className="shrink-0 p-1 text-muted-foreground hover:text-foreground
                           rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" />
              </PopoverPrimitive.Close>
            </div>

            <div className="p-3 space-y-5">
              {/* コアスペック */}
              <section>
                <h5 className="mb-2 text-xs font-semibold text-foreground pb-1.5 border-b border-border-subtle">
                  {uiText.comparison.coreVariables}
                </h5>
                <dl className="space-y-2 text-xs">
                  {coreRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between gap-3 border-b border-border-subtle pb-2 last:border-0 last:pb-0"
                    >
                      <dt className="shrink-0 text-muted-foreground">{row.label}</dt>
                      <dd className="text-right font-medium text-foreground break-words max-w-[65%]">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>

              {/* 詳細データ */}
              <section>
                <h5 className="mb-2 text-xs font-semibold text-foreground pb-1.5 border-b border-border-subtle">
                  {uiText.comparison.detailedData}
                </h5>
                <dl className="space-y-2 text-xs">
                  {detailRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between gap-3 border-b border-border-subtle pb-2 last:border-0 last:pb-0"
                    >
                      <dt className="shrink-0 text-muted-foreground">{row.label}</dt>
                      <dd className="text-right font-medium text-foreground break-words max-w-[65%]">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>

              {/* 適合情報（データある項目のみ） */}
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

              {/* 詳細ページリンク */}
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

      {/* ── 代理店フッター ── */}
      <div className="mt-auto border-t border-border-subtle p-3">
        <dl className="flex items-center justify-between gap-2 text-xs">
          <dt className="shrink-0 text-muted-foreground">{uiText.comparison.distributor}</dt>
          <dd className="text-right font-medium text-foreground truncate">{distributorDisplay}</dd>
        </dl>
      </div>

    </article>
  );
}
