'use client';

import { useState } from 'react';
import type { KeyboardEvent } from 'react';
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
  const basicTabId = `${robot.slug}-basic-tab`;
  const basicPanelId = `${robot.slug}-basic-panel`;
  const detailedTabId = `${robot.slug}-detailed-tab`;
  const detailedPanelId = `${robot.slug}-detailed-panel`;
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    setActiveTab((current) => (current === 'basic' ? 'detailed' : 'basic'));
  };

  return (
    <article className="flex flex-col border border-neutral-300 bg-white h-full relative">
      <div className="border-b border-neutral-300 bg-neutral-50 p-3 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3
              className="text-sm font-semibold text-neutral-900 truncate"
              title={robot.nameJa ?? robot.name}
            >
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
            <button
              type="button"
              aria-label={
                isFavorite
                  ? uiText.favorites.ariaRemove(robot.nameJa ?? robot.name)
                  : uiText.favorites.ariaAdd(robot.nameJa ?? robot.name)
              }
              aria-pressed={isFavorite}
              onClick={() => onFavoriteToggle(robot.slug)}
              className="p-1.5 hover:bg-neutral-100 rounded-sm transition-colors text-neutral-400 hover:text-neutral-900"
            >
              <Star
                className={`h-4 w-4 ${
                  isFavorite ? 'fill-yellow-500 text-yellow-500' : 'currentColor'
                }`}
              />
            </button>
            <button
              type="button"
              aria-label={uiText.comparison.removeAria(robot.nameJa ?? robot.name)}
              onClick={() => onRemove(robot.slug)}
              className="p-1.5 hover:bg-neutral-100 rounded-sm transition-colors text-neutral-400 hover:text-neutral-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex border-b border-neutral-200 bg-white" role="tablist">
        <button
          id={basicTabId}
          type="button"
          role="tab"
          aria-selected={activeTab === 'basic'}
          aria-controls={basicPanelId}
          onClick={() => setActiveTab('basic')}
          onKeyDown={handleTabKeyDown}
          className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${
            activeTab === 'basic'
              ? 'bg-white text-neutral-900 border-b-2 border-accent'
              : 'bg-neutral-50 text-neutral-500 hover:text-neutral-900 border-b-2 border-transparent'
          }`}
        >
          {uiText.comparison.tabBasic}
        </button>
        <button
          id={detailedTabId}
          type="button"
          role="tab"
          aria-selected={activeTab === 'detailed'}
          aria-controls={detailedPanelId}
          onClick={() => setActiveTab('detailed')}
          onKeyDown={handleTabKeyDown}
          className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors border-l border-neutral-200 ${
            activeTab === 'detailed'
              ? 'bg-white text-neutral-900 border-b-2 border-accent'
              : 'bg-neutral-50 text-neutral-500 hover:text-neutral-900 border-b-2 border-transparent'
          }`}
        >
          {uiText.comparison.tabDetailed}
        </button>
      </div>

      <div className="flex-1 flex flex-col bg-white relative">
        <div
          id={basicPanelId}
          role="tabpanel"
          aria-labelledby={basicTabId}
          aria-hidden={activeTab !== 'basic'}
          className={`flex flex-col h-full transition-opacity duration-200 ${
            activeTab === 'basic' ? 'opacity-100' : 'opacity-0 invisible pointer-events-none'
          }`}
        >
          <div className="aspect-[4/3] w-full bg-white border-b border-neutral-200 flex items-center justify-center text-xs text-neutral-500 overflow-hidden shrink-0">
            {hero ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero.src} alt={hero.alt} className="h-full w-full object-contain" />
            ) : (
              uiText.robots.mainImageMissing
            )}
          </div>

          <div className="p-3 mt-auto">
            <dl className="space-y-2 text-xs">
              {coreRows.map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between gap-3 border-b border-neutral-50 pb-1.5 last:border-0 last:pb-0"
                >
                  <dt className="shrink-0 text-neutral-500">{row.label}</dt>
                  <dd className="text-right font-medium text-neutral-900 break-words max-w-[65%]">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {activeTab === 'detailed' && (
          <div
            id={detailedPanelId}
            role="tabpanel"
            aria-labelledby={detailedTabId}
            className="absolute inset-0 overflow-y-auto overscroll-contain bg-white flex flex-col p-3 gap-6"
          >
            <section>
              <h4 className="mb-3 text-xs font-semibold text-neutral-900 pb-2 border-b border-neutral-200">
                {uiText.comparison.detailedData}
              </h4>
              <dl className="space-y-2 text-xs">
                {detailRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex justify-between gap-2 border-b border-neutral-100 pb-1.5 last:border-0 last:pb-0"
                  >
                    <dt className="shrink-0 text-neutral-500">{row.label}</dt>
                    <dd className="text-right font-medium text-neutral-900 break-words max-w-[65%]">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="space-y-4 mb-2">
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
