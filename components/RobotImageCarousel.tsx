'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ImageAsset, ImageRole } from '@/data/types';
import { imageRoleLabels, imageRoleOrder } from '@/lib/labels';
import { getDisplayableAsset } from '@/lib/media';
import { uiText } from '@/lib/uiText';

interface RobotImageCarouselProps {
  images?: Partial<Record<ImageRole, ImageAsset>>;
  /** BaseRecord.heroImage を hero スロットへ後方互換でフォールバック */
  fallbackHero?: ImageAsset;
}

export function RobotImageCarousel({ images, fallbackHero }: RobotImageCarouselProps) {
  const [idx, setIdx] = useState(0);
  const resolved: Partial<Record<ImageRole, ImageAsset>> = { ...images };
  if (!resolved.hero && fallbackHero) resolved.hero = fallbackHero;

  const slots = imageRoleOrder;
  const current = slots[idx];
  const img = getDisplayableAsset(resolved[current]);

  return (
    <div className="border border-neutral-300 overflow-hidden bg-white">
      <div className="relative">
        <div className="aspect-[16/9] bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center text-xs text-neutral-500 tracking-widest">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img.src} alt={img.alt} className="w-full h-full object-contain" />
          ) : (
            <span>[ {imageRoleLabels[current]} ]</span>
          )}
        </div>
        <button
          onClick={() => setIdx((i) => (i - 1 + slots.length) % slots.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white border border-neutral-300 transition-colors"
          aria-label="前の画像"
        >
          <ChevronLeft className="w-4 h-4 text-neutral-700" />
        </button>
        <button
          onClick={() => setIdx((i) => (i + 1) % slots.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white border border-neutral-300 transition-colors"
          aria-label="次の画像"
        >
          <ChevronRight className="w-4 h-4 text-neutral-700" />
        </button>
      </div>

      <div className="flex border-t border-neutral-300 overflow-x-auto">
        {slots.map((role, i) => {
          const hasImage = Boolean(getDisplayableAsset(resolved[role]));
          return (
            <button
              key={role}
              onClick={() => setIdx(i)}
              className={`flex-1 min-w-fit whitespace-nowrap px-3 py-2 text-[10px] uppercase tracking-widest border-r border-neutral-300 last:border-r-0 transition-colors ${
                i === idx
                  ? 'bg-neutral-900 text-white'
                  : hasImage
                    ? 'bg-white text-neutral-700 hover:bg-neutral-100'
                    : 'bg-neutral-50 text-neutral-400 hover:bg-neutral-100'
              }`}
              title={hasImage ? undefined : '未投入'}
            >
              {imageRoleLabels[role]}
            </button>
          );
        })}
      </div>

      {img?.credit && (
        <div className="px-3 py-2 border-t border-neutral-300 text-[10px] text-neutral-500">
          {uiText.common.credit}: {img.credit}
          {img.sourceUrl && (
            <>
              {' '}
              <a href={img.sourceUrl} target="_blank" rel="noreferrer" className="underline">
                {uiText.common.source}
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}
