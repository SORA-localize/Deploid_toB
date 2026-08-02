'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { CardFactGrid, type CardFactItems } from '@/components/CardFactGrid';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import type { ManufacturerCatalogItem } from '@/lib/viewModels/manufacturers';
import { uiText } from '@/lib/uiText';

interface ManufacturerCardProps {
  item: ManufacturerCatalogItem;
}

export function ManufacturerCard({ item }: ManufacturerCardProps) {
  const distributorValue = item.facts.hasDistributor ? (
    <div className="pointer-events-auto min-w-0">
      {item.facts.distributors.length === 1 ? (
        item.facts.distributors[0].website ? (
          <a
            href={item.facts.distributors[0].website}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate font-normal hover:text-muted-foreground"
          >
            {item.facts.distributorLabel}
          </a>
        ) : (
          <span className="block truncate font-normal">{item.facts.distributorLabel}</span>
        )
      ) : (
        <PopoverPrimitive.Root>
          <PopoverPrimitive.Trigger asChild>
            <button
              type="button"
              className="block max-w-full truncate text-left font-normal hover:text-muted-foreground"
            >
              {item.facts.distributorLabel}
            </button>
          </PopoverPrimitive.Trigger>
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
              align="end"
              sideOffset={4}
              className="z-[var(--z-dropdown)] min-w-44 border border-border bg-popover p-2 text-popover-foreground shadow-sm"
            >
              {item.facts.distributors.map((distributor) =>
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
      className="pointer-events-auto block min-w-0 truncate text-left font-normal text-signal hover:text-signal/80"
    >
      {item.facts.distributorLabel}
    </Link>
  );
  const facts: CardFactItems = [
    {
      key: 'established-region',
      label: uiText.manufacturers.establishedRegion,
      value: item.facts.establishedRegion,
    },
    {
      key: 'representative-robot',
      label: uiText.manufacturers.representativeRobot,
      value: item.facts.representativeRobot,
    },
    {
      key: 'consultation-route',
      label: uiText.manufacturers.consultationRoute,
      value: item.facts.consultationRoute,
    },
    {
      key: 'domestic-distributors',
      label: uiText.manufacturers.domesticDistributors,
      value: distributorValue,
      valueClassName: 'overflow-visible',
    },
  ];

  return (
    <div className="card-data group relative overflow-hidden">
      {/* Shimmer + accent line はRobotCardと同じ演出（ホバー追従グローはJS依存を外すため削除） */}
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
          z-30/z-40 の shimmer/下線装飾は pointer-events-none なのでクリックを妨げない。 */}
      <Link
        href={item.href}
        aria-label={item.name}
        className="absolute inset-0 z-0"
      />
      <div className="relative z-10 p-4 sm:p-6 pointer-events-none">
        <div className="flex items-start justify-between gap-4 mb-5">
          <h2 className="min-w-0 text-xl font-semibold text-foreground">
            <a
              href={item.website}
              target="_blank"
              rel="noopener noreferrer"
              className="group pointer-events-auto flex min-w-0 items-center gap-1 text-foreground hover:text-muted-foreground"
            >
              <ManufacturerLogoName
                name={item.name}
                resolvedLogo={item.logo}
                variant="combined"
                targetAreaPx={32 * 120}
                maxHeightPx={32}
                maxWidthPx={120}
                hideName
              />
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-45 transition-opacity group-hover:opacity-80" />
            </a>
          </h2>
        </div>

        <CardFactGrid items={facts} />
      </div>
    </div>
  );
}
