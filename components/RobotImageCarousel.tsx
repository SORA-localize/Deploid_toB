'use client';

import { ChevronLeft, ChevronRight, CameraOff } from 'lucide-react';
import Image from 'next/image';
import type { ImageAsset, ImageRole } from '@/data/types';
import { imageRoleLabels, imageRoleOrder } from '@/lib/labels';
import { getDisplayableAsset } from '@/lib/media';
import { uiText } from '@/lib/uiText';
import { cn } from '@/lib/utils';
import {
  Carousel,
  Slider,
  SliderContainer,
  SliderNextButton,
  SliderPrevButton,
  useCarousel,
} from './uilayouts/carousel';

interface RobotImageCarouselProps {
  images?: Partial<Record<ImageRole, ImageAsset>>;
  fallbackHero?: ImageAsset;
}

type Slide = {
  role: ImageRole;
  asset: ReturnType<typeof getDisplayableAsset> | null;
};

// 上部セグメント型のポジションインジケーター（選択中スロットを強調）
function SlotIndicators({ count }: { count: number }) {
  const { selectedIndex, onDotButtonClick } = useCarousel();
  return (
    <div className="absolute left-0 right-0 top-0 z-20 flex gap-1.5 p-3 px-4">
      {Array.from({ length: count }).map((_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onDotButtonClick(index)}
          className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/25 backdrop-blur-sm"
          aria-label={`画像 ${index + 1} へ`}
          aria-current={index === selectedIndex ? 'true' : undefined}
        >
          <span
            className={cn(
              'block h-full bg-primary transition-all duration-300',
              index === selectedIndex ? 'w-full' : 'w-0',
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function RobotImageCarousel({ images, fallbackHero }: RobotImageCarouselProps) {
  const resolved: Partial<Record<ImageRole, ImageAsset>> = { ...images };
  if (!resolved.hero && fallbackHero) resolved.hero = fallbackHero;

  // 全役割スロットを保持。画像が無いスロットは「申請中」プレースホルダーとして表示する
  const slides: Slide[] = imageRoleOrder.map((role) => ({
    role,
    asset: getDisplayableAsset(resolved[role]) ?? null,
  }));
  const hasAnyImage = slides.some((s) => s.asset);

  // 画像が1枚も無い場合はカルーセルにせず単一プレースホルダー
  if (!hasAnyImage) {
    return (
      <div className="relative h-[280px] sm:h-[360px] md:h-[420px] w-full overflow-hidden rounded-xl border border-border bg-muted">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
          <CameraOff className="mb-3 h-10 w-10 opacity-20" />
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] opacity-60">
            {uiText.robots.imageRequested}
          </span>
        </div>
      </div>
    );
  }

  const hasMultiple = slides.length > 1;

  return (
    <div className="group/carousel relative w-full overflow-hidden rounded-xl border border-border bg-muted/30">
      <Carousel
        options={{ loop: hasMultiple }}
        className="h-[280px] sm:h-[360px] md:h-[420px] w-full"
        aria-label="ロボット画像カルーセル"
      >
        {hasMultiple && <SlotIndicators count={slides.length} />}

        <SliderContainer
          className="h-full cursor-grab active:cursor-grabbing"
          style={{ height: '100%' }}
        >
          {slides.map(({ role, asset }) => (
            <Slider key={role} className="relative h-full w-full">
              {asset ? (
                <>
                  {/* 背景：拡大ぼかし（画像比率がバラついても余白を埋める） */}
                  <Image
                    src={asset.src}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 60vw"
                    className="pointer-events-none scale-110 select-none object-cover blur-2xl brightness-75 saturate-150"
                  />
                  {/* 前景：全身が欠けないよう contain */}
                  <Image
                    src={asset.src}
                    alt={asset.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 60vw"
                    className="z-10 object-contain"
                  />
                </>
              ) : (
                /* 未投入スロット：申請中プレースホルダー */
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground">
                  <CameraOff className="mb-3 h-9 w-9 opacity-20" />
                  <span className="text-[11px] font-medium uppercase tracking-[0.2em] opacity-60">
                    {uiText.robots.imageRequested}
                  </span>
                  <span className="mt-1 text-xs opacity-50">
                    {uiText.robots.mainImageMissing}
                  </span>
                </div>
              )}

              {/* 左上：役割ラベル */}
              <div className="absolute left-4 top-6 z-20">
                <span
                  className={cn(
                    'inline-flex items-center rounded-sm px-2.5 py-1 text-[11px] font-medium tracking-wide backdrop-blur-sm',
                    asset
                      ? 'bg-black/45 text-white'
                      : 'border border-border bg-background/70 text-muted-foreground',
                  )}
                >
                  {imageRoleLabels[role]}
                </span>
              </div>

              {/* 右下：クレジット */}
              {asset?.credit && (
                <div className="absolute bottom-3 right-4 z-20 rounded-sm bg-black/30 px-1.5 py-0.5 text-[10px] text-white/80 backdrop-blur-sm">
                  {uiText.common.credit}: {asset.credit}
                  {asset.sourceUrl && (
                    <>
                      {' '}
                      <a
                        href={asset.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {uiText.common.source}
                      </a>
                    </>
                  )}
                </div>
              )}
            </Slider>
          ))}
        </SliderContainer>

        {/* prev/next（ホバー時のみ表示） */}
        {hasMultiple && (
          <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2 opacity-100 transition-opacity duration-300 motion-reduce:transition-none md:opacity-0 md:group-hover/carousel:opacity-100 md:focus-within:opacity-100">
            <SliderPrevButton className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60 disabled:opacity-30">
              <ChevronLeft className="h-5 w-5" />
            </SliderPrevButton>
            <SliderNextButton className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60 disabled:opacity-30">
              <ChevronRight className="h-5 w-5" />
            </SliderNextButton>
          </div>
        )}
      </Carousel>
    </div>
  );
}
