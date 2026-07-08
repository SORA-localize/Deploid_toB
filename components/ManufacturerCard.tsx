'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import type { Manufacturer, Robot } from '@/data/types';
import {
  getDomesticDistributorDisplay,
  getManufacturerEstablishedRegionLabel,
  getManufacturerConsultationRoute,
  getRepresentativeRobotLabel,
  manufacturerConsultationRouteLabels,
} from '@/lib/manufacturerDisplay';
import { useTiltCardEffect } from '@/lib/useTiltCardEffect';

interface ManufacturerCardProps {
  manufacturer: Manufacturer;
  robots: Robot[];
}

export function ManufacturerCard({ manufacturer, robots }: ManufacturerCardProps) {
  const consultationRoute = getManufacturerConsultationRoute(manufacturer);
  const domesticDistributor = getDomesticDistributorDisplay(manufacturer);
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
      {/* Glow + shimmer はRobotCardと同じ演出（lib/useTiltCardEffect.ts参照） */}
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
        className="pointer-events-none absolute inset-y-0 left-0 z-30 w-[100%] -translate-x-full -skew-x-12 bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-[200%] motion-reduce:hidden"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 z-40 h-[2px] w-0 bg-primary transition-all duration-500 group-hover:w-full motion-reduce:transition-none"
      />

      {/* カード全体を詳細ページへのリンクにする正規導線。
          z-10 の内容ラッパーは pointer-events-none なので、空白クリックは z-0 の全面リンクへ貫通し、
          内側の外部HPリンク・代理店リンク/メニューだけ pointer-events-auto で捕捉する。
          z-30/z-40 の glow/shimmer/下線装飾は pointer-events-none なのでクリックを妨げない。 */}
      <Link
        href={`/manufacturers/${manufacturer.slug}`}
        aria-label={manufacturer.nameJa ?? manufacturer.name}
        className="absolute inset-0 z-0"
      />
      <div className="relative z-10 p-4 sm:p-6 pointer-events-none">
        <div className="flex items-start justify-between gap-4 mb-5">
          <h2 className="min-w-0 text-xl font-semibold text-foreground">
            <a
              href={manufacturer.website}
              target="_blank"
              rel="noopener noreferrer"
              className="group pointer-events-auto flex min-w-0 items-center gap-1 text-foreground hover:text-muted-foreground"
            >
              <ManufacturerLogoName
                name={manufacturer.nameJa ?? manufacturer.name}
                logo={manufacturer.logo}
                frameClassName="h-10 w-10"
                imageClassName="h-7 w-7"
                textClassName="leading-tight"
              />
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-45 transition-opacity group-hover:opacity-80" />
            </a>
          </h2>
        </div>

        <div className="space-y-2 text-xs">
          <div className="hidden sm:flex justify-between py-1.5 border-b border-border">
            <span className="text-muted-foreground">設立</span>
            <span className="ml-2 sm:ml-4 text-right text-foreground">
              {getManufacturerEstablishedRegionLabel(manufacturer)}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-border">
            <span className="shrink-0 text-muted-foreground">代表ロボット</span>
            <span className="ml-2 sm:ml-4 min-w-0 truncate text-right text-foreground">
              {getRepresentativeRobotLabel(robots)}
            </span>
          </div>
          <div className="hidden sm:flex justify-between py-1.5 border-b border-border">
            <span className="text-muted-foreground">相談ルート</span>
            <span className="ml-2 sm:ml-4 text-right text-foreground">
              {manufacturerConsultationRouteLabels[consultationRoute]}
            </span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="shrink-0 text-muted-foreground">国内代理店</span>
            {domesticDistributor.hasDistributor ? (
              <div className="pointer-events-auto ml-2 min-w-0 sm:ml-4 text-right">
                {domesticDistributor.distributors.length === 1 ? (
                  domesticDistributor.distributors[0].website ? (
                    <a
                      href={domesticDistributor.distributors[0].website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-xs font-normal leading-normal text-foreground hover:text-muted-foreground"
                    >
                      {domesticDistributor.label}
                    </a>
                  ) : (
                    <span className="block truncate text-xs font-normal leading-normal text-foreground">
                      {domesticDistributor.label}
                    </span>
                  )
                ) : (
                  <PopoverPrimitive.Root>
                    <PopoverPrimitive.Trigger asChild>
                      <button
                        type="button"
                        className="block max-w-full truncate text-xs font-normal leading-normal text-foreground hover:text-muted-foreground"
                      >
                        {domesticDistributor.label}
                      </button>
                    </PopoverPrimitive.Trigger>
                    <PopoverPrimitive.Portal>
                      <PopoverPrimitive.Content
                        align="end"
                        sideOffset={4}
                        className="z-[var(--z-dropdown)] min-w-44 border border-border bg-popover text-popover-foreground p-2 shadow-sm"
                      >
                        {domesticDistributor.distributors.map((distributor) =>
                          distributor.website ? (
                            <a
                              key={distributor.name}
                              href={distributor.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block py-1 text-xs font-normal text-foreground hover:text-muted-foreground"
                            >
                              {distributor.name}
                            </a>
                          ) : (
                            <div key={distributor.name} className="py-1 text-xs font-normal text-foreground">
                              {distributor.name}
                            </div>
                          ),
                        )}
                      </PopoverPrimitive.Content>
                    </PopoverPrimitive.Portal>
                  </PopoverPrimitive.Root>
                )}
              </div>
            ) : (
              <Link
                href="/contact"
                className="pointer-events-auto ml-2 min-w-0 truncate text-right text-xs font-normal text-signal hover:text-signal/80 sm:ml-4"
              >
                {domesticDistributor.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
