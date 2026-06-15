'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
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
import { uiText } from '@/lib/uiText';

type CardVariant = 'compact' | 'default';

interface ManufacturerCardProps {
  manufacturer: Manufacturer;
  robots: Robot[];
  variant?: CardVariant;
}

export function ManufacturerCard({ manufacturer, robots, variant = 'default' }: ManufacturerCardProps) {
  const consultationRoute = getManufacturerConsultationRoute(manufacturer);
  const domesticDistributor = getDomesticDistributorDisplay(manufacturer);
  // compact: 代表ロボット・国内代理店を非表示。default: モバイルでは非表示、sm以上で表示
  const optionalRowClass = variant === 'compact' ? 'hidden' : 'hidden sm:flex';

  return (
    <div className="card-data relative overflow-hidden">
      {/* カード全体を詳細ページへのリンクに（マウス用の便宜リンク。
          キーボード/SRは下部の「プロフィールを見る」を正規導線とする）。
          内側の外部HPリンク・代理店リンク/メニューは pointer-events-auto で温存。 */}
      <Link
        href={`/manufacturers/${manufacturer.slug}`}
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0"
      />
      <div className="relative z-10 p-6 pointer-events-none">
        <div className="flex items-start justify-between gap-4 mb-5">
          <h2 className="min-w-0 text-xl font-semibold text-foreground">
            <a
              href={manufacturer.website}
              target="_blank"
              rel="noopener noreferrer"
              className="group pointer-events-auto inline-flex min-w-0 items-center gap-1 text-foreground hover:text-muted-foreground"
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

        <div className="space-y-2 text-xs mb-6">
          <div className="flex justify-between py-1.5 border-b border-border">
            <span className="text-muted-foreground">設立</span>
            <span className="ml-2 sm:ml-4 text-right text-foreground">
              {getManufacturerEstablishedRegionLabel(manufacturer)}
            </span>
          </div>
          <div className={`${optionalRowClass} justify-between py-1.5 border-b border-border`}>
            <span className="text-muted-foreground">代表ロボット</span>
            <span className="ml-2 sm:ml-4 truncate text-right text-foreground">
              {getRepresentativeRobotLabel(robots)}
            </span>
          </div>
          <div className="flex justify-between py-1.5 sm:border-b border-border">
            <span className="text-muted-foreground">相談ルート</span>
            <span className="ml-2 sm:ml-4 text-right text-foreground">
              {manufacturerConsultationRouteLabels[consultationRoute]}
            </span>
          </div>
          <div className={`${optionalRowClass} justify-between py-1.5`}>
            <span className="text-muted-foreground">国内代理店</span>
            {domesticDistributor.hasDistributor ? (
              <div className="pointer-events-auto ml-2 sm:ml-4 text-right">
                {domesticDistributor.distributors.length === 1 ? (
                  domesticDistributor.distributors[0].website ? (
                    <a
                      href={domesticDistributor.distributors[0].website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-normal leading-normal text-foreground hover:text-muted-foreground"
                    >
                      {domesticDistributor.label}
                    </a>
                  ) : (
                    <span className="text-xs font-normal leading-normal text-foreground">
                      {domesticDistributor.label}
                    </span>
                  )
                ) : (
                  <PopoverPrimitive.Root>
                    <PopoverPrimitive.Trigger asChild>
                      <button
                        type="button"
                        className="text-xs font-normal leading-normal text-foreground hover:text-muted-foreground"
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
                className="pointer-events-auto ml-2 sm:ml-4 text-right text-xs font-normal text-signal hover:text-signal/80"
              >
                {domesticDistributor.label}
              </Link>
            )}
          </div>
        </div>

        <Link
          href={`/manufacturers/${manufacturer.slug}`}
          className="pointer-events-auto ml-auto flex w-fit border-b border-foreground pb-0.5 text-xs leading-none text-foreground transition-colors hover:border-foreground/40 hover:text-muted-foreground"
        >
          <span>{uiText.common.viewProfile}</span>
        </Link>
      </div>
    </div>
  );
}
