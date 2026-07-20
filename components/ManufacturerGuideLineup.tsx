'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import type { Robot } from '@/data/types';
import type { ManufacturerGuideLineupDisplayRow } from '@/lib/data';
import { cn } from '@/lib/utils';
import { uiText } from '@/lib/uiText';
import { FeaturedRobotCard } from '@/components/FeaturedRobotCard';
import { RobotCardRail } from '@/components/RobotCardRail';

/**
 * メーカー解説のラインナップ（カード横スクロール＋解説表）。表の行ホバー/フォーカスで
 * 対応するカードへレールを水平スクロールし、リング（モノクロ）で強調する。
 * 対応付けキーは row.robotSlug ⇔ robot.slug（正本は lib/data.ts の resolver）。
 * ホバーが無いタッチ端末では従来どおり独立して操作できる（連動は付加的な補助）。
 */
export function ManufacturerGuideLineup({
  rows,
  robots,
  manufacturerName,
}: {
  rows: ManufacturerGuideLineupDisplayRow[];
  robots: Robot[];
  manufacturerName?: string;
}) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef(new Map<string, HTMLDivElement>());
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const activate = useCallback((slug: string) => {
    setActiveSlug(slug);
    const rail = railRef.current;
    const card = cardRefs.current.get(slug);
    if (!rail || !card) return;
    // レール自身の scrollTo で水平方向だけ動かす（scrollIntoView はページ縦スクロールを誘発しうる）。
    // レールは snap-start なので、カード左端をレール左端に合わせるとスナップ位置と一致する。
    const delta = card.getBoundingClientRect().left - rail.getBoundingClientRect().left;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rail.scrollTo({ left: rail.scrollLeft + delta, behavior: prefersReduced ? 'auto' : 'smooth' });
  }, []);

  return (
    <>
      {robots.length > 0 && (
        <RobotCardRail className="mt-6" scrollContainerRef={railRef}>
          {robots.map((robot) => (
            <div
              key={robot.id}
              ref={(element) => {
                if (element) cardRefs.current.set(robot.slug, element);
                else cardRefs.current.delete(robot.slug);
              }}
              className={cn(
                'transition-shadow',
                activeSlug === robot.slug && 'ring-1 ring-inset ring-foreground',
              )}
            >
              <FeaturedRobotCard robot={robot} manufacturerName={manufacturerName} />
            </div>
          ))}
        </RobotCardRail>
      )}
      <div className="-mx-4 my-6 overflow-x-auto overscroll-x-contain px-4 sm:mx-0 sm:px-0">
        <table className="min-w-[34rem] w-full border border-border text-sm">
          <thead>
            <tr className="bg-muted/60 text-left text-xs text-muted-foreground">
              <th scope="col" className="px-3 py-2 font-medium">{uiText.reports.guideLineupRobot}</th>
              <th scope="col" className="px-3 py-2 font-medium">{uiText.reports.guideLineupRole}</th>
              <th scope="col" className="px-3 py-2 font-medium whitespace-nowrap">{uiText.reports.guideLineupPrice}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border" onMouseLeave={() => setActiveSlug(null)}>
            {rows.map((row) => (
              <tr
                key={row.href}
                onMouseEnter={() => activate(row.robotSlug)}
                onFocus={() => activate(row.robotSlug)}
                className="transition-colors hover:bg-muted/40"
              >
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <Link href={row.href} className="font-medium text-foreground underline-offset-4 hover:underline">
                    {row.name}
                  </Link>
                </td>
                <td className="px-3 py-2.5 leading-relaxed text-foreground/80 break-words [overflow-wrap:anywhere]">{row.roleLabel}</td>
                <td className="px-3 py-2.5 whitespace-nowrap text-foreground/80">
                  {row.price.kind === 'contact' && row.price.href ? (
                    <Link href={row.price.href} className="underline underline-offset-4 hover:text-foreground">
                      {row.price.label}
                    </Link>
                  ) : row.price.sourceUrl ? (
                    <a
                      href={row.price.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4 hover:text-foreground"
                    >
                      {row.price.label}
                    </a>
                  ) : (
                    row.price.label
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
