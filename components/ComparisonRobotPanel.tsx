'use client';

import { Star, X } from 'lucide-react';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import type { ImageAsset, Robot } from '@/data/types';
import { TBD_LABEL } from '@/lib/labels';
import { getComparisonDecisionRows, getComparisonSpecRows } from '@/lib/robotDisplay';
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
      {items.slice(0, 3).map((item) => (
        <li key={item} className="flex gap-1.5">
          <span className="text-neutral-400">•</span>
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
  const specRows = getComparisonSpecRows(robot);
  const decisionRows = getComparisonDecisionRows(robot);

  return (
    <article className="flex h-full flex-col border border-neutral-300 bg-white">
      <div className="border-b border-neutral-300 bg-neutral-50 p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
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
              aria-label={`${robot.nameJa ?? robot.name}を${
                isFavorite ? uiText.compare.removeFavorite : uiText.compare.addFavorite
              }`}
              aria-pressed={isFavorite}
              onClick={() => onFavoriteToggle(robot.slug)}
              className="border border-neutral-300 bg-white p-1.5 hover:bg-neutral-100"
              title={isFavorite ? uiText.compare.removeFavorite : uiText.compare.addFavorite}
            >
              <Star
                className={`h-3.5 w-3.5 ${
                  isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-neutral-500'
                }`}
              />
            </button>
            <button
              type="button"
              aria-label={`${robot.nameJa ?? robot.name}を${uiText.compare.remove}`}
              onClick={() => onRemove(robot.slug)}
              className="border border-neutral-300 bg-white p-1.5 hover:bg-neutral-100"
              title={uiText.compare.remove}
            >
              <X className="h-3.5 w-3.5 text-neutral-600" />
            </button>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-neutral-600">{robot.summary}</p>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <section>
          <h4 className="mb-2 text-xs font-semibold text-neutral-900">
            {uiText.compare.decisionFactors}
          </h4>
          <dl className="space-y-1.5 text-xs">
            {decisionRows.map((row) => (
              <div key={row.label} className="flex justify-between gap-3 border-b border-neutral-200 pb-1.5">
                <dt className="shrink-0 text-neutral-500">{row.label}</dt>
                <dd className="text-right font-medium text-neutral-900">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h4 className="mb-2 text-xs font-semibold text-neutral-900">{uiText.compare.keySpecs}</h4>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            {specRows.map((row) => (
              <div key={row.label} className="flex justify-between gap-2 border-b border-neutral-200 pb-1">
                <dt className="text-neutral-500">{row.label}</dt>
                <dd className="font-medium text-neutral-900">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <div>
            <h4 className="mb-2 text-xs font-semibold text-neutral-900">{uiText.compare.bestFit}</h4>
            <CompactList items={robot.comparison.bestFit} />
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold text-neutral-900">{uiText.compare.notFit}</h4>
            <CompactList items={robot.comparison.notFit} />
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold text-neutral-900">{uiText.compare.strengths}</h4>
            <CompactList items={robot.comparison.strengths} />
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold text-neutral-900">{uiText.compare.constraints}</h4>
            <CompactList items={robot.comparison.constraints} />
          </div>
        </section>
      </div>
    </article>
  );
}
