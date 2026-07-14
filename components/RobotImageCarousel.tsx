'use client';

import { ChevronLeft, ChevronRight, CameraOff } from 'lucide-react';
import Image from 'next/image';
import type { Robot } from '@/data/types';
import { imageRoleLabels } from '@/lib/labels';
import {
  getDisplayableRobotImages,
  type DisplayableRobotImage,
} from '@/lib/robotMedia';
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
  robot: Pick<Robot, 'images'>;
}

function SlotIndicators({ count }: { count: number }) {
  const { selectedIndex, onDotButtonClick } = useCarousel();
  return (
    <div className="absolute inset-x-0 top-0 z-20 flex gap-1.5 px-4 py-3">
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

function RobotImageFrame({
  image,
  withIndicators = false,
}: {
  image: DisplayableRobotImage;
  withIndicators?: boolean;
}) {
  const { role, asset } = image;
  return (
    <>
      <Image
        src={asset.src}
        alt=""
        aria-hidden="true"
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 60vw"
        className="pointer-events-none scale-110 select-none object-cover blur-2xl brightness-75 saturate-150"
      />
      <Image
        src={asset.src}
        alt={asset.alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 60vw"
        className="z-10 object-contain"
      />

      <div className={cn('absolute left-4 z-20', withIndicators ? 'top-6' : 'top-4')}>
        <span className="inline-flex items-center rounded-sm bg-black/45 px-2.5 py-1 text-[11px] font-medium tracking-wide text-white backdrop-blur-sm">
          {imageRoleLabels[role]}
        </span>
      </div>

      {asset.credit && (
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
    </>
  );
}

export function RobotImageCarousel({ robot }: RobotImageCarouselProps) {
  const images = getDisplayableRobotImages(robot);

  if (images.length === 0) {
    return (
      <div className="relative h-[280px] w-full overflow-hidden rounded-xl border border-border bg-muted sm:h-[360px] md:h-[420px]">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
          <CameraOff className="mb-3 h-10 w-10 opacity-20" />
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] opacity-60">
            {uiText.robots.imageRequested}
          </span>
        </div>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="relative h-[280px] w-full overflow-hidden rounded-xl border border-border bg-muted/30 sm:h-[360px] md:h-[420px]">
        <RobotImageFrame image={images[0]} />
      </div>
    );
  }

  return (
    <div className="group/carousel relative w-full overflow-hidden rounded-xl border border-border bg-muted/30">
      <Carousel
        options={{ loop: true }}
        className="h-[280px] w-full sm:h-[360px] md:h-[420px]"
        aria-label="ロボット画像カルーセル"
      >
        <SlotIndicators count={images.length} />

        <SliderContainer
          className="h-full cursor-grab active:cursor-grabbing"
          style={{ height: '100%' }}
        >
          {images.map((image) => (
            <Slider key={image.role} className="relative h-full w-full">
              <RobotImageFrame image={image} withIndicators />
            </Slider>
          ))}
        </SliderContainer>

        <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2 opacity-100 transition-opacity duration-300 motion-reduce:transition-none md:opacity-0 md:group-hover/carousel:opacity-100 md:focus-within:opacity-100">
          <SliderPrevButton className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60 disabled:opacity-30">
            <ChevronLeft className="h-5 w-5" />
          </SliderPrevButton>
          <SliderNextButton className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60 disabled:opacity-30">
            <ChevronRight className="h-5 w-5" />
          </SliderNextButton>
        </div>
      </Carousel>
    </div>
  );
}
