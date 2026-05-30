'use client';

import { useState } from 'react';
import { ChevronDown, Star, X } from 'lucide-react';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import type { ImageAsset, Robot } from '@/data/types';
import { TBD_LABEL } from '@/lib/labels';
import { getComparisonCoreRows, getComparisonDetailRows } from '@/lib/robotDisplay';
import { uiText } from '@/lib/uiText';

interface ComparisonRobotPanelProps {
  robot: Robot;
  manufacturerName?: string;
  manufacturerLogo?: ImageAsset;
  isFavorite: boolean;
  onFavoriteToggle: (slug: string) => void;
  onRemove: (slug: string) => void;
}

function CompactList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-xs text-neutral-500">{TBD_LABEL}</p>;

  return (
    <ul className="space-y-1 text-xs text-neutral-700">
      {items.map((item) => (
        <li key={item} className="flex gap-1.5">
          <span className="text-neutral-400 shrink-0">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ComparisonRobotPanel({
  robot,
  manufacturerName,
  manufacturerLogo,
  isFavorite,
  onFavoriteToggle,
  onRemove,
}: ComparisonRobotPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const coreRows = getComparisonCoreRows(robot);
  const detailRows = getComparisonDetailRows(robot);
  const accordionId = `accordion-content-${robot.slug}`;

  return (
    <article className="flex h-full flex-col border border-neutral-300 bg-white">
      {/* 1. Header & Context */}
      <div className="border-b border-neutral-300 bg-neutral-50 p-4 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-neutral-900">{robot.nameJa ?? robot.name}</h3>
            <ManufacturerLogoName
              name={manufacturerName ?? robot.manufacturerSlug}
              logo={manufacturerLogo}
              className="mt-1 text-xs text-neutral-500"
              frameClassName="h-4 w-4"
              imageClassName="h-3 w-3"
            />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label={isFavorite ? uiText.favorites.ariaRemove(robot.nameJa ?? robot.name) : uiText.favorites.ariaAdd(robot.nameJa ?? robot.name)}
              aria-pressed={isFavorite}
              onClick={() => onFavoriteToggle(robot.slug)}
              className="border border-neutral-300 bg-white p-1.5 hover:bg-neutral-100"
            >
              <Star
                className={`h-3.5 w-3.5 ${
                  isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-neutral-500'
                }`}
              />
            </button>
            <button
              type="button"
              aria-label={uiText.comparison.removeAria(robot.nameJa ?? robot.name)}
              onClick={() => onRemove(robot.slug)}
              className="border border-neutral-300 bg-white p-1.5 hover:bg-neutral-100"
            >
              <X className="h-3.5 w-3.5 text-neutral-600" />
            </button>
          </div>
        </div>
        {/* Layout Stabilizer: Fixed min-height and line clamp for summary */}
        <p className="text-xs leading-relaxed text-neutral-700 line-clamp-4 min-h-[4.5rem]">
          {robot.summary}
        </p>
      </div>

      {/* 2. Core Variables (Anchored to top of this flex container, but since parent is flex-col h-full, this area fills remaining space) */}
      <div className="flex flex-1 flex-col">
        <div className="p-4">
          <h4 className="mb-3 text-xs font-semibold text-neutral-900 pb-2 border-b border-neutral-200">
            {uiText.comparison.coreVariables}
          </h4>
          <dl className="space-y-2 text-xs">
            {coreRows.map((row) => (
              <div key={row.label} className="flex justify-between gap-3">
                <dt className="shrink-0 text-neutral-500">{row.label}</dt>
                <dd className="text-right font-medium text-neutral-900">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* mt-auto pushes the accordion to the bottom, aligning all accordions in a row */}
        <div className="mt-auto border-t border-neutral-200">
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls={accordionId}
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex w-full items-center justify-between px-4 py-3 text-xs font-medium text-neutral-900 hover:bg-neutral-50 transition-colors"
          >
            <span>{uiText.comparison.detailedData}</span>
            <ChevronDown
              className={`h-4 w-4 text-neutral-500 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>
          
          {/* Custom Accessible Accordion with CSS Grid transition */}
          <div
            id={accordionId}
            className={`grid transition-all duration-200 ease-in-out ${
              isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="overflow-hidden bg-neutral-50">
              <div className="p-4 flex flex-col gap-6">
                <section>
                  <dl className="space-y-2 text-xs">
                    {detailRows.map((row) => (
                      <div key={row.label} className="flex justify-between gap-2 border-b border-neutral-200/50 pb-1">
                        <dt className="text-neutral-500">{row.label}</dt>
                        <dd className="font-medium text-neutral-900">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>

                <section className="space-y-4">
                  <div>
                    <h4 className="mb-1 text-xs font-semibold text-neutral-900">{uiText.compare.bestFit}</h4>
                    <CompactList items={robot.comparison.bestFit} />
                  </div>
                  <div>
                    <h4 className="mb-1 text-xs font-semibold text-neutral-900">{uiText.compare.notFit}</h4>
                    <CompactList items={robot.comparison.notFit} />
                  </div>
                  <div>
                    <h4 className="mb-1 text-xs font-semibold text-neutral-900">{uiText.compare.strengths}</h4>
                    <CompactList items={robot.comparison.strengths} />
                  </div>
                  <div>
                    <h4 className="mb-1 text-xs font-semibold text-neutral-900">{uiText.compare.constraints}</h4>
                    <CompactList items={robot.comparison.constraints} />
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
