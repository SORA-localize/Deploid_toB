'use client';

import { Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useCarousel } from '@/components/uilayouts/carousel';
import { uiText } from '@/lib/uiText';
import { cn } from '@/lib/utils';

/**
 * carousel の自動再生を止める／再開するボタン。`<Carousel>` の内側で使う。
 *
 * WCAG 2.2.2（Pause, Stop, Hide）は、5秒を超えて自動的に動き続けるコンテンツへ
 * 停止手段を求める。この carousel は 5000ms 間隔で自動送りするため、hover や drag
 * だけでなく明示的に操作できるボタンが要る。
 *
 * 表示状態は (1) このボタンの操作結果を直接反映し、(2) あわせて plugin の
 * `autoplay:play` / `autoplay:stop` も購読する。`stopOnInteraction: true` のため
 * prev/next や drag でも autoplay は止まるので、外部要因の停止にも追従したい。
 * ただし実測でこの event が listener へ届かない事象があったため、(1) を主とする。
 */
export function CarouselAutoplayButton({ className }: { className?: string }) {
  const { emblaApi } = useCarousel();
  const autoplay = emblaApi?.plugins()?.autoplay;
  // autoplay を積んでいれば再生中で始まる。以降は plugin の event に追従する。
  const [isPlaying, setIsPlaying] = useState(true);

  // carousel.tsx の select handler と同じ形（useEffect で on / off、state は event から更新）。
  const syncPlaying = useCallback(() => {
    setIsPlaying(emblaApi?.plugins()?.autoplay?.isPlaying() ?? false);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('autoplay:play', syncPlaying).on('autoplay:stop', syncPlaying);
    return () => {
      emblaApi.off('autoplay:play', syncPlaying).off('autoplay:stop', syncPlaying);
    };
  }, [emblaApi, syncPlaying]);

  const toggle = useCallback(() => {
    const plugin = emblaApi?.plugins()?.autoplay;
    if (!plugin) return;
    const playing = plugin.isPlaying();
    if (playing) plugin.stop();
    else plugin.play();
    // plugin の event だけに頼らず、この操作の結果を直接反映する。
    // 実測（2026-08-03）で autoplay:play / autoplay:stop が listener へ届かず、
    // ボタンの表示だけが古いまま残る事象を確認したため。
    setIsPlaying(!playing);
  }, [emblaApi]);

  // autoplay を積んでいない（reduced motion 等）ときは操作対象が無いので描画しない。
  if (!autoplay) return null;

  const label = isPlaying
    ? uiText.home.carousel.pauseAutoplay
    : uiText.home.carousel.resumeAutoplay;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60 motion-reduce:transition-none',
        className,
      )}
    >
      {isPlaying ? (
        <Pause className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Play className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
