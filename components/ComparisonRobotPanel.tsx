'use client';

import { useState } from 'react';
import { Star, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
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
  onMoveLeft,
  onMoveRight,
}: ComparisonRobotPanelProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'detailed'>('basic');
  const coreRows = getComparisonCoreRows(robot);
  const detailRows = getComparisonDetailRows(robot);
  const hero = robot.images?.hero ?? robot.heroImage;

  return (
    <article className="flex flex-col border border-neutral-300 bg-white h-[65vh] min-h-[500px] max-h-[800px] shrink-0 relative">
      {/* 1. Header (Always Visible) */}
      <div className="border-b border-neutral-300 bg-neutral-50 p-4 flex flex-col gap-4 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-neutral-900 truncate" title={robot.nameJa ?? robot.name}>
              {robot.nameJa ?? robot.name}
            </h3>
            <ManufacturerLogoName
              name={manufacturerName ?? robot.manufacturerSlug}
              logo={manufacturerLogo}
              className="mt-1 text-xs text-neutral-500"
              frameClassName="h-4 w-4 shrink-0"
              imageClassName="h-3 w-3"
            />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {onMoveLeft && (
              <button
                type="button"
                aria-label={uiText.comparison.moveLeftAria(robot.nameJa ?? robot.name)}
                onClick={onMoveLeft}
                className="border border-neutral-300 bg-white p-1 hover:bg-neutral-100 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-neutral-500" />
              </button>
            )}
            {onMoveRight && (
              <button
                type="button"
                aria-label={uiText.comparison.moveRightAria(robot.nameJa ?? robot.name)}
                onClick={onMoveRight}
                className="border border-neutral-300 bg-white p-1 hover:bg-neutral-100 transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-neutral-500" />
              </button>
            )}
            <button
              type="button"
              aria-label={isFavorite ? uiText.favorites.ariaRemove(robot.nameJa ?? robot.name) : uiText.favorites.ariaAdd(robot.nameJa ?? robot.name)}
              aria-pressed={isFavorite}
              onClick={() => onFavoriteToggle(robot.slug)}
              className="border border-neutral-300 bg-white p-1 hover:bg-neutral-100 transition-colors ml-1"
            >
              <Star
                className={`h-4 w-4 ${
                  isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-neutral-500'
                }`}
              />
            </button>
            <button
              type="button"
              aria-label={uiText.comparison.removeAria(robot.nameJa ?? robot.name)}
              onClick={() => onRemove(robot.slug)}
              className="border border-neutral-300 bg-white p-1 hover:bg-neutral-100 transition-colors"
            >
              <X className="h-4 w-4 text-neutral-600" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Accessible In-Card Tabs (Flip Toggle) */}
      <div className="flex border-b border-neutral-200 shrink-0" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'basic'}
          onClick={() => setActiveTab('basic')}
          className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${
            activeTab === 'basic'
              ? 'bg-white text-neutral-900 border-b-2 border-accent'
              : 'bg-neutral-50 text-neutral-500 hover:text-neutral-900 border-b-2 border-transparent'
          }`}
        >
          {uiText.comparison.tabBasic}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'detailed'}
          onClick={() => setActiveTab('detailed')}
          className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors border-l border-neutral-200 ${
            activeTab === 'detailed'
              ? 'bg-white text-neutral-900 border-b-2 border-accent'
              : 'bg-neutral-50 text-neutral-500 hover:text-neutral-900 border-b-2 border-transparent'
          }`}
        >
          {uiText.comparison.tabDetailed}
        </button>
      </div>

      {/* 3. Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto overscroll-contain bg-white pb-4 relative">
        
        {/* BASIC VIEW */}
        {activeTab === 'basic' && (
          <div role="tabpanel" className="flex flex-col animate-in fade-in duration-200">
            {/* Thumbnail (Shrink-0 to prevent distortion) */}
            <div className="aspect-[4/3] w-full bg-white border-b border-neutral-200 flex items-center justify-center text-xs text-neutral-500 overflow-hidden shrink-0">
              {hero ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={hero.src} alt={hero.alt} className="h-full w-full object-contain" />
              ) : (
                uiText.robots.mainImageMissing
              )}
            </div>
            
            {/* Context Summary */}
            <div className="p-4 border-b border-neutral-100">
              <p className="text-xs leading-relaxed text-neutral-700">
                {robot.summary}
              </p>
            </div>

            {/* Core Variables */}
            <div className="p-4">
              <dl className="space-y-2 text-xs">
                {coreRows.map((row) => (
                  <div key={row.label} className="flex justify-between gap-3 border-b border-neutral-50 pb-1.5 last:border-0 last:pb-0">
                    <dt className="shrink-0 text-neutral-500">{row.label}</dt>
                    <dd className="text-right font-medium text-neutral-900 break-words max-w-[65%]">
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
          <div role="tabpanel" className="flex flex-col animate-in fade-in duration-200 p-4 gap-6">
            {/* Technical Specs */}
            <section>
              <h4 className="mb-3 text-xs font-semibold text-neutral-900 pb-2 border-b border-neutral-200">
                {uiText.comparison.detailedData}
              </h4>
              <dl className="space-y-2 text-xs">
                {detailRows.map((row) => (
                  <div key={row.label} className="flex justify-between gap-2 border-b border-neutral-100 pb-1.5 last:border-0 last:pb-0">
                    <dt className="shrink-0 text-neutral-500">{row.label}</dt>
                    <dd className="text-right font-medium text-neutral-900 break-words max-w-[65%]">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Qualitative Data (Type Safety Guards) */}
            <section className="space-y-4">
              {robot.comparison.bestFit.length > 0 && (
                <div>
                  <h4 className="mb-1 text-xs font-semibold text-neutral-900">{uiText.compare.bestFit}</h4>
                  <CompactList items={robot.comparison.bestFit} />
                </div>
              )}
              {robot.comparison.notFit.length > 0 && (
                <div>
                  <h4 className="mb-1 text-xs font-semibold text-neutral-900">{uiText.compare.notFit}</h4>
                  <CompactList items={robot.comparison.notFit} />
                </div>
              )}
              {robot.comparison.strengths.length > 0 && (
                <div>
                  <h4 className="mb-1 text-xs font-semibold text-neutral-900">{uiText.compare.strengths}</h4>
                  <CompactList items={robot.comparison.strengths} />
                </div>
              )}
              {robot.comparison.constraints.length > 0 && (
                <div>
                  <h4 className="mb-1 text-xs font-semibold text-neutral-900">{uiText.compare.constraints}</h4>
                  <CompactList items={robot.comparison.constraints} />
                </div>
              )}
            </section>
          </div>
        )}

      </div>
    </article>
  );
}
