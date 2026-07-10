'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, GripVertical, Star, X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import type { CompareCardDragHandleProps } from '@/components/SortableCompareCard';
import type { Robot } from '@/data/types';
import { getDisplayableAsset } from '@/lib/media';
import { EMPTY_VALUE_LABEL } from '@/lib/labels';
import { getComparisonCoreRows, getComparisonDetailRows } from '@/lib/robotDisplay';
import { uiText } from '@/lib/uiText';

interface ComparisonRobotPanelProps {
  robot: Robot;
  manufacturerName?: string;
  isFavorite: boolean;
  onFavoriteToggle: (id: string) => void;
  onRemove: (id: string) => void;
  dragHandleProps?: CompareCardDragHandleProps;
}

function CompactList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-xs text-muted-foreground">{EMPTY_VALUE_LABEL}</p>;
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
  const cardImage = getDisplayableAsset(robot.images?.transparent ?? robot.images?.hero ?? robot.heroImage);

  return (
    // 比較表の列ヘッダーとして使うコンパクトカード。スペック本体は下の表が担うため、
    // ここは「どのロボットか」の識別（画像+名前+★✕+ドラッグ）と詳細ドロワーの入口に徹する。
    <article className="group relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted text-card-foreground">

      {/* ── 画像レイヤー: blur 背景 < グラデーション < ロボット前景 < 操作UI ── */}
      {cardImage ? (
        <>
          {/* blur 背景 */}
          <Image
            src={cardImage.src}
            alt=""
            aria-hidden="true"
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="pointer-events-none z-0 scale-110 object-cover blur-2xl brightness-[85] saturate-150"
          />
          {/* 前景 */}
          <Image
            src={cardImage.src}
            alt={cardImage.alt}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="pointer-events-none z-20 object-contain object-center transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
          />
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">{uiText.robots.mainImageMissing}</span>
        </div>
      )}

      {/* ── ホバー暗転オーバーレイ（pointer-events-none）── */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-black/0 transition-colors duration-300 group-hover:bg-black/20 motion-reduce:transition-none" aria-hidden="true" />

      {/* ── 背景グラデーション: ロボット前景より下、テキストより下 ── */}
      <div
        className="pointer-events-none absolute top-0 inset-x-0 z-10 h-20 bg-gradient-to-b from-black/60 to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 inset-x-0 z-10 h-16 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />

      {/* ── Dialog trigger（画像全体を覆う z-0）── */}
      <DialogPrimitive.Root open={popoverOpen} onOpenChange={setPopoverOpen}>
        <DialogPrimitive.Trigger asChild>
          <button
            type="button"
            aria-label={uiText.comparison.detailsAria(robot.nameJa ?? robot.name)}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          />
        </DialogPrimitive.Trigger>

        {/* ── 右スライドイン詳細パネル ── */}
        <DialogPrimitive.Portal>
          {/* 背景オーバーレイ */}
          <DialogPrimitive.Overlay
            className="fixed inset-0 z-[var(--z-modal)] bg-black/30
                       data-[state=open]:animate-in data-[state=open]:fade-in-0
                       data-[state=closed]:animate-out data-[state=closed]:fade-out-0
                       duration-300 motion-reduce:animate-none"
          />
          {/* 右パネル本体 */}
          <DialogPrimitive.Content
            className="fixed right-0 top-0 z-[var(--z-modal)] h-dvh max-h-dvh w-[min(420px,90vw)]
                       bg-card border-l border-border shadow-xl overflow-y-auto
                       flex flex-col
                       focus:outline-none
                       data-[state=open]:animate-in data-[state=open]:slide-in-from-right
                       data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right
                       duration-300 ease-out motion-reduce:animate-none"
          >
            {/* a11y 用 visually-hidden タイトル */}
            <DialogPrimitive.Title className="sr-only">
              {robot.nameJa ?? robot.name}
            </DialogPrimitive.Title>

            {/* パネルヘッダー */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3
                            border-b border-border bg-card px-4 py-3">
              <h4 className="text-sm font-semibold text-foreground truncate">
                {robot.nameJa ?? robot.name}
              </h4>
              <DialogPrimitive.Close
                aria-label={uiText.comparison.closeDetail}
                className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground rounded-sm transition-colors
                           focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            {/* パネル本文 */}
            <div className="flex-1 px-4 py-4 space-y-6">
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
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* ── top overlay: D&D ハンドル + 名前 + ★✕（z-30）── */}
      {/*
        overlay div の onClick が Popover を開く。デスクトップでは drag（6px以上移動）時は
        click が発火しないため Popover が開かない。モバイルでも同じ onClick でカバーできる。
        ★✕ の onClick は stopPropagation で overlay の onClick を止める。
      */}
      <div
        onClick={() => setPopoverOpen(true)}
        className={[
          'absolute top-0 inset-x-0 z-30',
          'flex items-start justify-between gap-2 px-2.5 pt-2 pb-8',
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
            className="truncate text-sm font-semibold leading-tight text-white"
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
              onFavoriteToggle(robot.id);
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
              onRemove(robot.id);
            }}
            className="rounded-sm p-1 text-white/70 transition-colors hover:bg-white/20 hover:text-white
                       focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── bottom overlay: メーカー名（ホバーで表示 / z-30）── */}
      <div className="pointer-events-none absolute bottom-0 inset-x-0 z-30 px-2.5 pb-2
                      opacity-100 transition-opacity duration-300 motion-reduce:transition-none sm:opacity-0 sm:group-hover:opacity-100">
        <p className="truncate text-right text-[11px] font-medium text-white/90">
          {manufacturerName ?? robot.manufacturerId}
        </p>
      </div>

    </article>
  );
}
