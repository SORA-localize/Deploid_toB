'use client';

import type { Article } from '@/data/types';
import { articleTypeLabels } from '@/lib/labels';
import { getDisplayableAsset } from '@/lib/media';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Carousel, 
  Slider, 
  SliderContainer, 
  SliderDotButton, 
  SliderNextButton, 
  SliderPrevButton,
  useCarousel
} from './uilayouts/carousel';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';
import { useEffect, useState } from 'react';

interface NewsHeroCarouselProps {
  reports: Article[];
  className?: string;
}

// 内部コンポーネント: スムーズなタイマー連動型インジケーター
function ProgressIndicators({ count }: { count: number }) {
  const { selectedIndex } = useCarousel();
  const [active, setActive] = useState(selectedIndex);

  // 表示上の整合性をとるための同期
  useEffect(() => {
    setActive(selectedIndex);
  }, [selectedIndex]);

  return (
    <div className="absolute top-0 left-0 right-0 z-20 flex gap-1.5 p-3 px-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-0.5 flex-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
          <div 
            className={cn(
              "h-full bg-signal transition-all ease-linear",
            )}
            style={{
              // 現在のスライドなら 5秒かけて 100% へ、それ以外は 0% または 100% 固定
              width: active === index ? '100%' : (active > index ? '100%' : '0%'),
              transitionDuration: active === index ? '5000ms' : '0ms'
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function NewsHeroCarousel({ reports, className }: NewsHeroCarouselProps) {
  if (!reports || reports.length === 0) return null;

  return (
    <div className={cn("relative w-full overflow-hidden rounded-xl border border-border bg-muted/30 group/carousel", className)}>
      <Carousel
        options={{ loop: true }}
        plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
        className="w-full h-full"
      >
        {/* リッチなインジケーター */}
        <ProgressIndicators count={reports.length} />

        {/* outer overflow-hidden div に height:100% を渡し、inner flex div に h-full を渡すことで高さチェーンを繋ぐ */}
        <SliderContainer className="cursor-grab active:cursor-grabbing h-full" style={{ height: '100%' }}>
          {reports.map((report) => {
            const hero = getDisplayableAsset(report.heroImage);
            return (
              <Slider key={report.id} className="w-full h-full">
                <Link href={`/reports/${report.slug}`} className="group block relative w-full h-full overflow-hidden">
                  {/* Background Image */}
                  {hero ? (
                    <Image
                      src={hero.src}
                      alt={hero.alt}
                      fill
                      priority
                      sizes="100vw"
                      className="object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">No Image</span>
                    </div>
                  )}

                  {/* Gradient Overlay: より深く、文字を読みやすく */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  {/* Content Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 lg:p-12">
                    <div className="max-w-4xl space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-signal text-signal-foreground rounded-sm">
                          {articleTypeLabels[report.type]}
                        </span>
                        <time className="text-xs text-white/60 font-mono">
                          {report.publishedAt}
                        </time>
                      </div>

                      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight transition-colors group-hover:text-signal line-clamp-2">
                        {report.titleJa || report.title}
                      </h2>

                      <p className="text-sm md:text-base text-white/80 line-clamp-2 max-w-2xl hidden transition-colors group-hover:text-white md:block">
                        {report.summary}
                      </p>
                    </div>
                  </div>
                </Link>
              </Slider>
            );
          })}
        </SliderContainer>

        {/* Navigation Controls: ホバー時のみ表示してスッキリさせる */}
        <div className="absolute bottom-6 right-6 flex items-center gap-4 z-10 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-2">
            <SliderPrevButton className="h-10 w-10 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md transition-colors border border-white/10">
              <ChevronLeft className="h-5 w-5" />
            </SliderPrevButton>
            <SliderNextButton className="h-10 w-10 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md transition-colors border border-white/10">
              <ChevronRight className="h-5 w-5" />
            </SliderNextButton>
          </div>
        </div>

        {/* Bottom Dots: 補助的な位置確認 */}
        <div className="absolute bottom-6 left-6 z-10 flex items-center gap-2">
           <SliderDotButton className="gap-1.5" activeClass="bg-white" />
        </div>
      </Carousel>
    </div>
  );
}
