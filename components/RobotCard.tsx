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
import {
  getDeploymentStageTone,
  getVisualToneTextClassName,
} from '@/lib/visualSemantics';

interface RobotCardProps {
  robot: Robot;
  manufacturerName?: string;
  manufacturerLogo?: ImageAsset;
  showFavorite?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: (slug: string) => void;
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
}: RobotCardProps) {
  const specRows = getRobotCardSpecRows(robot);
  const deploymentStageTone = getDeploymentStageTone(robot.deploymentStage);

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
  };

  const handleMouseLeave = () => {
    normX.set(0.5);
    normY.set(0.5);
    glowOpacity.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1000,
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        "robot-card group relative flex flex-col h-full overflow-hidden border transition-[border-color,box-shadow,filter,opacity] duration-300",
        "border-border bg-card text-card-foreground",
        "hover:border-ring hover:shadow-lg",
      )}
    >
      {/* Glow effect */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30"
        style={{
          opacity: glowOpacity,
          background: 'radial-gradient(circle at center, var(--card-spotlight) 0%, transparent 70%)',
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
          className="absolute top-3 right-3 z-40 p-1 text-muted-foreground transition-colors hover:text-foreground pointer-events-auto"
        >
          <Star
            className={`w-4 h-4 ${
              isFavorite ? 'fill-favorite text-favorite' : ''
            }`}
          />
        </button>
      )}

      <div className="relative z-20 flex flex-col sm:flex-row md:flex-col h-full pointer-events-none">
        <div className="sm:w-24 sm:flex-none sm:self-stretch sm:border-r sm:border-border md:w-auto md:aspect-[4/3] md:border-r-0 md:border-b bg-muted flex flex-col items-center justify-center text-muted-foreground overflow-hidden aspect-[4/3] sm:aspect-auto">
          {(() => {
            const hero = getDisplayableAsset(robot.images?.hero ?? robot.heroImage);
            return hero ? (
              <div className="relative h-full w-full">
                {/* ぼかし背景: 余白をニュートラルに埋める（透過画像入手後は自動で消える） */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={hero.src}
                  alt=""
                  aria-hidden
                  className="pointer-events-none absolute inset-0 h-full w-full scale-110 select-none object-cover blur-2xl brightness-75 saturate-150"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={hero.src} alt={hero.alt} className="relative z-10 h-full w-full object-contain" />
              </div>
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
        <div className="p-3 md:p-4 flex-1 flex flex-col min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-card-foreground">
              <Link href={`/robots/${robot.slug}`} className="hover:underline">
                {robot.nameJa ?? robot.name}
              </Link>
            </h3>
          </div>
          <div>
            <div className="inline-block pointer-events-none md:pointer-events-auto">
              <ManufacturerLogoName
                name={manufacturerName ?? robot.manufacturerId}
                logo={manufacturerLogo}
                className="mb-1 text-xs text-muted-foreground"
                frameClassName="h-4 w-4"
                imageClassName="h-3 w-3"
              />
            </div>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-xs mb-0 md:mb-4">
              {specRows.map((row) => (
                <div key={row.label} className={row.label === '段階' ? undefined : 'hidden md:block'}>
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd
                    className={cn(
                      'font-medium',
                      row.label === '段階'
                        ? getVisualToneTextClassName(deploymentStageTone)
                        : 'text-card-foreground',
                    )}
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="mt-auto hidden md:flex items-center justify-between pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {uiText.common.viewDetails}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Accent bottom line */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 z-40 h-[2px] w-0 bg-primary transition-all duration-500 group-hover:w-full pointer-events-none"
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
