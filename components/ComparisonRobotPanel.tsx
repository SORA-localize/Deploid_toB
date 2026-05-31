'use client';

import { useState } from 'react';
import { Star, X } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'basic' | 'detailed'>('basic');
  const coreRows = getComparisonCoreRows(robot);
  const detailRows = getComparisonDetailRows(robot);
  const hero = robot.images?.hero ?? robot.heroImage;

  return (
    <article className="flex h-full flex-col border border-neutral-300 bg-white">
      {/* 1. Header & Context (Always Visible) */}
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
              className="border border-neutral-300 bg-white p-1.5 hover:bg-neutral-100 transition-colors"
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
              className="border border-neutral-300 bg-white p-1.5 hover:bg-neutral-100 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-neutral-600" />
            </button>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-neutral-700 line-clamp-4 min-h-[4.5rem]">
          {robot.summary}
        </p>
      </div>

      {/* 2. In-Card Tabs (Flip Toggle) */}
      <div className="flex border-b border-neutral-200">
        <button
          type="button"
          onClick={() => setActiveTab('basic')}
          className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${
            activeTab === 'basic'
              ? 'bg-white text-neutral-900 border-b-2 border-accent'
              : 'bg-neutral-50 text-neutral-500 hover:text-neutral-900 border-b-2 border-transparent'
          }`}
        >
          {uiText.comparison.coreVariables}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('detailed')}
          className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors border-l border-neutral-200 ${
            activeTab === 'detailed'
              ? 'bg-white text-neutral-900 border-b-2 border-accent'
              : 'bg-neutral-50 text-neutral-500 hover:text-neutral-900 border-b-2 border-transparent'
          }`}
        >
          {uiText.comparison.detailedData}
        </button>
      </div>

      {/* 3. Swappable Content Area (Rigid Container) */}
      <div className="flex flex-1 flex-col relative bg-white">
        
        {/* BASIC VIEW */}
        {activeTab === 'basic' && (
          <div className="flex flex-col h-full animate-in fade-in duration-200">
            {/* Thumbnail */}
            <div className="aspect-[4/3] bg-white border-b border-neutral-200 flex items-center justify-center text-xs text-neutral-500 overflow-hidden shrink-0">
              {hero ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={hero.src} alt={hero.alt} className="h-full w-full object-contain" />
              ) : (
                uiText.robots.mainImageMissing
              )}
            </div>
            
            {/* Core Variables */}
            <div className="p-4 mt-auto">
              <dl className="space-y-2 text-xs">
                {coreRows.map((row) => (
                  <div key={row.label} className="flex justify-between gap-3">
                    <dt className="shrink-0 text-neutral-500">{row.label}</dt>
                    <dd className="text-right font-medium text-neutral-900 truncate" title={row.value}>
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}

        {/* DETAILED VIEW */}
        {activeTab === 'detailed' && (
          <div className="flex flex-col h-full animate-in fade-in duration-200">
            <div className="p-4 flex flex-col gap-6 overflow-y-auto">
              {/* Technical Specs */}
              <section>
                <dl className="space-y-2 text-xs">
                  {detailRows.map((row) => (
                    <div key={row.label} className="flex justify-between gap-2 border-b border-neutral-200/50 pb-1.5">
                      <dt className="shrink-0 text-neutral-500">{row.label}</dt>
                      <dd className="text-right font-medium text-neutral-900 truncate" title={row.value}>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              {/* Qualitative Data */}
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
        )}

      </div>
    </article>
  );
}
