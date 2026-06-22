'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { TagChip } from '@/components/TagChip';
import type { UseCase } from '@/data/types';
import { buyerReadinessLabels, maturityLabels } from '@/lib/labels';
import { uiText } from '@/lib/uiText';
import { useTiltCardEffect } from '@/lib/useTiltCardEffect';
import { getBuyerReadinessTone, getUseCaseMaturityTone } from '@/lib/visualSemantics';

interface UseCaseCardProps {
  useCase: UseCase;
}

// robots/manufacturers と同じグリッド密度で並ぶことを前提にしたコンパクトな縦カード
// （以前の featured/list 2バリアントは、横幅いっぱいの行カードがグリッドと噛み合わず
//   カードが肥大化する原因だったため統合した）。
export function UseCaseCard({ useCase: u }: UseCaseCardProps) {
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
      className="card-data group relative overflow-hidden"
    >
      {/* Glow + shimmer + accent line はRobotCard/ManufacturerCardと同じ演出（lib/useTiltCardEffect.ts参照） */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30"
        style={{
          opacity: glowOpacity,
          background: 'radial-gradient(circle at center, var(--card-spotlight) 0%, transparent 70%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-30 w-[100%] -translate-x-full -skew-x-12 bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-[200%]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 z-40 h-[2px] w-0 bg-primary transition-all duration-500 group-hover:w-full"
      />

      <Link href={`/use-cases/${u.slug}`} className="relative z-10 block h-full p-4">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <TagChip kind="use-case-domain" value={u.primaryDomain} />
          <TagChip tone={getUseCaseMaturityTone(u.maturityLevel)}>
            {maturityLabels[u.maturityLevel]}
          </TagChip>
          <TagChip tone={getBuyerReadinessTone(u.buyerReadiness)}>
            {buyerReadinessLabels[u.buyerReadiness]}
          </TagChip>
        </div>
        <h4 className="mb-1.5 line-clamp-2 text-base font-semibold text-foreground">
          {u.titleJa ?? u.title}
        </h4>
        <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {u.subtitle ?? u.summary}
        </p>
        <div className="text-[11px] text-muted-foreground/80">
          {uiText.useCases.candidateRobots(u.candidateRobots.length)}
        </div>
      </Link>
    </motion.div>
  );
}
