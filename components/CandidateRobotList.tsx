'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import type { Robot } from '@/data/types';
import { getRobotRelatedTitle } from '@/lib/robotDisplay';
import { uiText } from '@/lib/uiText';
import { useFavorites } from '@/lib/useFavorites';

interface CandidateRobotListProps {
  robots: Robot[];
  emptyMessage?: string;
}

export function CandidateRobotList({ robots, emptyMessage = '候補は精査中です。' }: CandidateRobotListProps) {
  const { favorites, toggleFavorite } = useFavorites();

  if (robots.length === 0) {
    return <p className="text-xs text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div>
      {robots.length > 1 && (
        <Link
          href={`/compare?compare=${robots.map((robot) => robot.id).join(',')}`}
          className="mb-4 flex items-center justify-center w-full px-3 py-1.5 border border-foreground/30 hover:border-foreground/60 text-xs font-medium transition-colors text-foreground"
        >
          {uiText.common.compareAllCandidates}
        </Link>
      )}
      {robots.map((robot) => {
        const isFavorite = favorites.includes(robot.id);
        const name = getRobotRelatedTitle(robot);
        return (
          <div key={robot.id} className="border-b border-border py-4 first:pt-0 last:border-b-0 last:pb-0">
            <div className="mb-1.5 flex items-start justify-between gap-2">
              <Link href={`/robots/${robot.slug}`} className="min-w-0">
                <h4 className="text-sm font-semibold text-foreground hover:text-foreground/80">
                  {name}
                </h4>
              </Link>
              <button
                type="button"
                aria-label={isFavorite ? uiText.favorites.ariaRemove(name) : uiText.favorites.ariaAdd(name)}
                onClick={() => toggleFavorite(robot.id)}
                className="shrink-0 p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Star className={`h-4 w-4 ${isFavorite ? 'fill-favorite text-favorite' : ''}`} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {robot.summary}
            </p>
          </div>
        );
      })}
    </div>
  );
}
