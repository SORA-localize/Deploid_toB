'use client';

import type { MouseEvent as ReactMouseEvent } from 'react';
import Link from 'next/link';

export interface ManufacturerArc {
  leftPct: number;
  topPct: number;
  customer: string;
  status: string;
}

export interface ManufacturerMarker {
  slug: string;
  name: string;
  country: string;
  foundedYear?: number;
  logoSrc?: string;
  /** コピー(2:1)内の割合(0-100)。サーバーで getPin から算出済み。 */
  leftPct: number;
  topPct: number;
  arcs: ManufacturerArc[];
}

// country(英語表記) → 地域名(日本語)・ISO Alpha-3
const REGION: Record<string, { name: string; a3: string }> = {
  USA: { name: '米国', a3: 'USA' },
  China: { name: '中国', a3: 'CHN' },
  Japan: { name: '日本', a3: 'JPN' },
  Germany: { name: 'ドイツ', a3: 'DEU' },
  Norway: { name: 'ノルウェー', a3: 'NOR' },
  Canada: { name: 'カナダ', a3: 'CAN' },
  Spain: { name: 'スペイン', a3: 'ESP' },
};
export const region = (country: string) =>
  REGION[country] ?? { name: country, a3: country.slice(0, 3).toUpperCase() };

// 0-100座標系の弧パス（SVGは preserveAspectRatio=none で横2倍に伸びる前提）。
function arcPath(x1: number, y1: number, x2: number, y2: number) {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const lift = Math.min(dist * 0.35, 26);
  const cx = (x1 + x2) / 2;
  const cy = Math.min(y1, y2) - lift;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

interface ManufacturerMapCopyProps {
  svgMap: string;
  markers: ManufacturerMarker[];
  activeSlug: string | null;
  /** クローン（index≠0）は支援技術から隠す */
  ariaHidden?: boolean;
  reduceMotion: boolean;
  onActivate: (slug: string) => void;
  onClear: () => void;
  onLinkClick: (e: ReactMouseEvent) => void;
}

// 1コピー＝2:1の世界地図。track に N 枚並べて横パン（ラップアラウンド）する。
export function ManufacturerMapCopy({
  svgMap,
  markers,
  activeSlug,
  ariaHidden,
  reduceMotion,
  onActivate,
  onClear,
  onLinkClick,
}: ManufacturerMapCopyProps) {
  const active = markers.find((m) => m.slug === activeSlug) ?? null;

  return (
    <div className="relative h-full aspect-[2/1] shrink-0" aria-hidden={ariaHidden || undefined}>
      <img
        src={svgMap}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none h-full w-full object-cover opacity-90 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]"
      />

      {/* 導入事例の弧（実線＋流れる光）。アクティブ社のみ */}
      {active && active.arcs.length > 0 && (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {active.arcs.map((arc, i) => {
            const d = arcPath(active.leftPct, active.topPct, arc.leftPct, arc.topPct);
            return (
              <g key={i}>
                <path
                  d={d}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={1}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  style={{ opacity: 0.35 }}
                />
                {!reduceMotion && (
                  <path
                    className="manufacturer-arc-flow"
                    d={d}
                    pathLength={1}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    style={{ animationDelay: `${i * 0.3}s`, filter: 'drop-shadow(0 0 1.5px #ffffff)' }}
                  />
                )}
              </g>
            );
          })}
        </svg>
      )}

      {/* 導入先の端点ドット（顧客名はカードに集約） */}
      {active &&
        active.arcs.map((arc, i) => (
          <span
            key={`end-${i}`}
            aria-hidden="true"
            className="pointer-events-none absolute z-[5] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
            style={{ left: `${arc.leftPct}%`, top: `${arc.topPct}%` }}
          />
        ))}

      {/* メーカーHQマーカー。href は残す(SEO)が tabIndex=-1（キーボード列は /manufacturers が担保） */}
      {markers.map((m) => {
        const isActive = m.slug === activeSlug;
        const r = region(m.country);
        return (
          <Link
            key={m.slug}
            href={`/manufacturers/${m.slug}`}
            tabIndex={-1}
            aria-label={`${m.name}（${r.name}）の詳細を見る`}
            draggable={false}
            className="group absolute z-[6] -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${m.leftPct}%`, top: `${m.topPct}%` }}
            onPointerEnter={() => onActivate(m.slug)}
            onPointerLeave={onClear}
            onFocus={() => onActivate(m.slug)}
            onBlur={onClear}
            onClick={onLinkClick}
          >
            <span className="relative flex h-7 w-7 items-center justify-center">
              <span
                aria-hidden="true"
                className={`absolute rounded-full border border-[#0d7c66] transition-all duration-300 ease-out ${
                  isActive ? 'h-6 w-6 opacity-70' : 'h-2.5 w-2.5 opacity-0'
                }`}
              />
              <span
                aria-hidden="true"
                className={`h-2 w-2 rounded-full transition-all duration-200 ease-out ${
                  isActive ? 'scale-150 bg-[#0d7c66]' : 'bg-neutral-300'
                }`}
              />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
