'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import type { Robot } from '@/data/types';
import { getRobotPrimaryImage } from '@/lib/robotMedia';
import { uiText } from '@/lib/uiText';
import { useTiltCardEffect } from '@/lib/useTiltCardEffect';

interface FeaturedRobotCardProps {
  robot: Robot;
  manufacturerName?: string;
  /** 初期viewport内でLCP候補になる先頭カードだけに指定する。 */
  eagerImage?: boolean;
}

/**
 * home の「注目ロボット」専用カード。
 * ComparisonRobotPanel に視覚的に類似（blur 背景・単色透明フェード・前景画像）するが、
 * Dialog ではなく Link でロボット詳細ページへ遷移する。角丸なし（矩形）。
 * オーバーレイは from-black/60 to-transparent の単色フェードのみ（有彩色グラデ禁止）。
 * ホバー演出（チルト・グロー・シマー・アクセントライン）は RobotCard/UseCaseCard と同じ
 * useTiltCardEffect 経由で共通化する。
 */
export function FeaturedRobotCard({
  robot,
  manufacturerName,
  eagerImage = false,
}: FeaturedRobotCardProps) {
  const cardImage = getRobotPrimaryImage(robot);

  const {
    cardRef,
    rotateX,
    rotateY,
    glowOpacity,
    handleMouseMove,
    handleMouseEnter,
    handleMouseLeave,
  } = useTiltCardEffect();

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="group relative isolate block aspect-[5/7] w-full overflow-hidden bg-muted"
    >
      {cardImage ? (
        <>
          {/* blur 背景 */}
          <Image
            src={cardImage.src}
            alt=""
            aria-hidden="true"
            fill
            loading={eagerImage ? 'eager' : 'lazy'}
            sizes="(max-width: 640px) 100vw, 20vw"
            className="pointer-events-none z-0 scale-110 select-none object-cover blur-2xl brightness-[85] saturate-150"
          />
          {/* 前景 */}
          <Image
            src={cardImage.src}
            alt={cardImage.alt}
            fill
            loading={eagerImage ? 'eager' : 'lazy'}
            sizes="(max-width: 640px) 100vw, 20vw"
            className="pointer-events-none z-10 object-contain object-center transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
          />
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">{uiText.robots.mainImageMissing}</span>
        </div>
      )}

      {/* ホバー暗転 */}
      <div
        className="pointer-events-none absolute inset-0 z-20 bg-black/0 transition-colors duration-300 group-hover:bg-black/20 motion-reduce:transition-none"
        aria-hidden="true"
      />

      {/* 上部テキスト可読性オーバーレイ（単色透明フェード） */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-30 h-20 bg-gradient-to-b from-black/60 to-transparent"
        aria-hidden="true"
      />

      {/* Glow（RobotCard/UseCaseCardと同じマウス追従スポットライト） */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-40"
        style={{
          opacity: glowOpacity,
          background: 'radial-gradient(circle at center, var(--card-spotlight) 0%, transparent 70%)',
        }}
      />

      {/* Shimmer sweep */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-50 w-[100%] -translate-x-full -skew-x-12 bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-[200%] motion-reduce:hidden"
      />

      {/* 上部: ロボット名 + メーカー名 */}
      <div className="absolute inset-x-0 top-0 z-[60] px-3 pt-3">
        <p className="text-xs font-medium text-white">{robot.nameJa ?? robot.name}</p>
        {manufacturerName && (
          <p className="text-[10px] text-white/70">{manufacturerName}</p>
        )}
      </div>

      {/* Accent bottom line */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 z-[60] h-[2px] w-0 bg-primary transition-all duration-500 group-hover:w-full motion-reduce:transition-none"
      />

      <Link
        href={`/robots/${robot.slug}`}
        className="absolute inset-0 z-[70]"
        aria-label={robot.nameJa ?? robot.name}
      />
    </motion.div>
  );
}
