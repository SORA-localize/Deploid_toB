'use client';

import Link from 'next/link';
import { ChevronRight, Star, CameraOff } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useRef } from 'react';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import type { ImageAsset, Robot } from '@/data/types';
import { getDisplayableAsset } from '@/lib/media';
import { getRobotCardSpecRows } from '@/lib/robotDisplay';
import { uiText } from '@/lib/uiText';
import { cn } from '@/lib/utils';

interface RobotCardProps {
  robot: Robot;
  manufacturerName?: string;
  manufacturerLogo?: ImageAsset;
  showFavorite?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: (slug: string) => void;
  dimmed?: boolean;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}

const TILT_MAX = 5;
const TILT_SPRING = { stiffness: 300, damping: 28 } as const;
const GLOW_SPRING = { stiffness: 180, damping: 22 } as const;

export function RobotCard({
  robot,
  manufacturerName,
  manufacturerLogo,
  showFavorite = false,
  isFavorite = false,
  onFavoriteToggle,
  dimmed = false,
  onHoverStart,
  onHoverEnd,
}: RobotCardProps) {
  const specRows = getRobotCardSpecRows(robot);
  const statusReady =
    robot.deploymentStage === 'production' || robot.deploymentStage === 'limited-production';

  const cardRef = useRef<HTMLDivElement>(null);

  const normX = useMotionValue(0.5);
  const normY = useMotionValue(0.5);

  const rawRotateX = useTransform(normY, [0, 1], [TILT_MAX, -TILT_MAX]);
  const rawRotateY = useTransform(normX, [0, 1], [-TILT_MAX, TILT_MAX]);

  const rotateX = useSpring(rawRotateX, TILT_SPRING);
  const rotateY = useSpring(rawRotateY, TILT_SPRING);
  const glowOpacity = useSpring(0, GLOW_SPRING);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    normX.set((e.clientX - rect.left) / rect.width);
    normY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseEnter = () => {
    glowOpacity.set(1);
    onHoverStart?.();
  };

  const handleMouseLeave = () => {
    normX.set(0.5);
    normY.set(0.5);
    glowOpacity.set(0);
    onHoverEnd?.();
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={{
        scale: dimmed ? 0.98 : 1,
        opacity: dimmed ? 0.4 : 1,
        filter: dimmed ? 'grayscale(0.5) blur(1px)' : 'grayscale(0) blur(0px)',
      }}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1000,
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        "group relative flex flex-col h-full overflow-hidden border transition-colors duration-300",
        "border-neutral-200 bg-white",
        "hover:border-neutral-400 hover:shadow-lg",
        dimmed && "pointer-events-none"
      )}
    >
      {/* Glow effect */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30"
        style={{
          opacity: glowOpacity,
          background: 'radial-gradient(circle at center, rgba(0,0,0,0.03) 0%, transparent 70%)',
        }}
      />

      {/* Shimmer sweep */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-30 w-[100%] -translate-x-full -skew-x-12 bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-[200%]"
      />

      {showFavorite && (
        <button
          type="button"
          aria-label={
            isFavorite
              ? uiText.favorites.ariaRemove(robot.nameJa ?? robot.name)
              : uiText.favorites.ariaAdd(robot.nameJa ?? robot.name)
          }
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onFavoriteToggle?.(robot.slug);
          }}
          className="absolute top-3 right-3 z-40 p-1 text-neutral-400 transition-colors hover:text-neutral-700 pointer-events-auto"
        >
          <Star
            className={`w-4 h-4 ${
              isFavorite ? 'fill-yellow-500 text-yellow-500' : ''
            }`}
          />
        </button>
      )}

      <div className="relative z-20 flex flex-col h-full pointer-events-none">
        <div className="aspect-[4/3] bg-neutral-100 flex flex-col items-center justify-center text-neutral-400 overflow-hidden border-b border-neutral-200">
          {(() => {
            const hero = getDisplayableAsset(robot.images?.hero ?? robot.heroImage);
            return hero ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero.src} alt={hero.alt} className="h-full w-full object-contain" />
            ) : (
              <>
                <CameraOff className="w-8 h-8 mb-2 opacity-20" />
                <span className="text-[10px] uppercase tracking-widest font-medium opacity-60">
                  {uiText.robots.imageRequested}
                </span>
                <span className="text-[10px] mt-0.5 opacity-40">
                  {uiText.robots.mainImageMissing}
                </span>
              </>
            );
          })()}
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-neutral-900 pointer-events-auto">
              <Link href={`/robots/${robot.slug}`} className="hover:underline">
                {robot.nameJa ?? robot.name}
              </Link>
            </h3>
          </div>
          <div className="pointer-events-auto">
            <ManufacturerLogoName
              name={manufacturerName ?? robot.manufacturerSlug}
              logo={manufacturerLogo}
              className="mb-1 text-xs text-neutral-500"
              frameClassName="h-4 w-4"
              imageClassName="h-3 w-3"
            />
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-4">
              {specRows.map((row) => (
                <div key={row.label}>
                  <dt className="text-neutral-500">{row.label}</dt>
                  <dd
                    className={
                      row.label === '段階' && statusReady
                        ? 'text-green-700 font-medium'
                        : 'text-neutral-900 font-medium'
                    }
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="mt-auto flex items-center justify-between pt-3 border-t border-neutral-300">
            <span className="text-xs text-neutral-700">
              {uiText.common.viewDetails}
            </span>
            <ChevronRight className="w-4 h-4 text-neutral-500" />
          </div>
        </div>
      </div>

      {/* Accent bottom line */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 z-40 h-[2px] w-0 bg-neutral-900 transition-all duration-500 group-hover:w-full pointer-events-none"
      />

      <Link
        href={`/robots/${robot.slug}`}
        className="absolute inset-0 z-10"
        aria-hidden="true"
        tabIndex={-1}
      />
    </motion.div>
  );
}
