'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, GripVertical, Star, X } from 'lucide-react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import type { CompareCardDragHandleProps } from '@/components/SortableCompareCard';
import type { ImageAsset, Robot } from '@/data/types';
import { TBD_LABEL } from '@/lib/labels';
import { getComparisonCoreRows, getComparisonDetailRows } from '@/lib/robotDisplay';
import { uiText } from '@/lib/uiText';

interface ComparisonRobotPanelProps {
  robot: Robot;
  manufacturerName?: string;
  manufacturerLogo?: ImageAsset; // 現在未使用（呼び出し元変更を避けるため維持）
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
  isFavorite,
  onFavoriteToggle,
  onRemove,
  dragHandleProps,
}: ComparisonRobotPanelProps) {
  const coreRows = getComparisonCoreRows(robot);
  const detailRows = getComparisonDetailRows(robot);

  const [popoverOpen, setPopoverOpen] = useState(false);

  // pointer:fine（マウス）デバイスのみ D&D を有効化。useEffect でクライアント判定し SSR との mismatch を回避。
  const [isPointerDevice, setIsPointerDevice] = useState(false);
  useEffect(() => {
    setIsPointerDevice(window.matchMedia('(pointer: fine)').matches);
  }, []);

  const canDrag = isPointerDevice && !!dragHandleProps;

  // 透過 PNG → hero ロール → heroImage の順でフォールバック
  const cardImage = robot.images?.transparent ?? robot.images?.hero ?? robot.heroImage;

  return (
    <article className="relative aspect-[5/7] w-full overflow-hidden rounded-lg bg-muted text-card-foreground">

      {/* ── 画像レイヤー ── */}
      {cardImage ? (
        <>
          {/* blur 背景 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cardImage.src}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl brightness-75 saturate-150"
          />
          {/* 前景 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cardImage.src}
            alt={cardImage.alt}
            className="absolute inset-0 h-full w-full object-contain object-center transition-transform duration-300"
          />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">{uiText.robots.mainImageMissing}</span>
        </div>
      )}

      {/* ── Popover trigger（画像全体を覆う z-0）── */}
      <PopoverPrimitive.Root open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            aria-label={uiText.comparison.detailsAria(robot.nameJa ?? robot.name)}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          />
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

      {/* ── top overlay: D&D ハンドル + 名前 + ★✕（z-10）── */}
      {/*
        overlay div の onClick が Popover を開く。デスクトップでは drag（6px以上移動）時は
        click が発火しないため Popover が開かない。モバイルでも同じ onClick でカバーできる。
        ★✕ の onClick は stopPropagation で overlay の onClick を止める。
      */}
      <div
        onClick={() => setPopoverOpen(true)}
        className={[
          'absolute top-0 inset-x-0 z-10',
          'flex items-start justify-between gap-2 px-2.5 pt-2 pb-8',
          'bg-gradient-to-b from-black/60 to-transparent',
          canDrag ? 'cursor-grab touch-none select-none active:cursor-grabbing' : '',
        ].join(' ').trim()}
        aria-label={canDrag ? uiText.comparison.reorderAria(robot.nameJa ?? robot.name) : undefined}
        title={canDrag ? uiText.comparison.reorderHint : undefined}
        {...(canDrag ? dragHandleProps!.attributes : {})}
        {...(canDrag ? dragHandleProps!.listeners : {})}
      >
        {/* ドラッグアイコン + ロボット名 */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <GripVertical className="h-3.5 w-3.5 shrink-0 text-white/50" aria-hidden="true" />
          <h3
            className="truncate text-xs font-semibold leading-tight text-white"
            title={robot.nameJa ?? robot.name}
          >
            {robot.nameJa ?? robot.name}
          </h3>
        </div>

        {/* ★ ✕ */}
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            aria-label={
              isFavorite
                ? uiText.favorites.ariaRemove(robot.nameJa ?? robot.name)
                : uiText.favorites.ariaAdd(robot.nameJa ?? robot.name)
            }
            aria-pressed={isFavorite}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle(robot.slug);
            }}
            className="rounded-sm p-1 text-white/70 transition-colors hover:bg-white/20 hover:text-white
                       focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
          >
            <Star className={`h-3.5 w-3.5 ${isFavorite ? 'fill-favorite text-favorite' : ''}`} />
          </button>
          <button
            type="button"
            aria-label={uiText.comparison.removeAria(robot.nameJa ?? robot.name)}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(robot.slug);
            }}
            className="rounded-sm p-1 text-white/70 transition-colors hover:bg-white/20 hover:text-white
                       focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── bottom overlay: メーカー名（z-10, pointer-events-none で Popover trigger に透過）── */}
      <div className="pointer-events-none absolute bottom-0 inset-x-0 z-10 px-2.5 pb-2 bg-gradient-to-t from-black/50 to-transparent">
        <p className="truncate text-right text-[10px] font-medium text-white/70">
          {manufacturerName ?? robot.manufacturerSlug}
        </p>
      </div>

    </article>
  );
}
