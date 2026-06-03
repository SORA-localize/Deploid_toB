'use client';

import type { MouseEvent as ReactMouseEvent } from 'react';
import Link from 'next/link';

export interface ManufacturerArc {
  leftPct: number;
  topPct: number;
  customer: string;
  status: string;
}

export interface ManufacturerInfo {
  slug: string;
  name: string;
  country: string;
  foundedYear?: number;
  logoSrc?: string;
}

// 1つの描画点。近接する本社は1点にまとめる（members 複数＝クラスタ）。
export interface MapPoint {
  id: string;
  leftPct: number;
  topPct: number;
  members: ManufacturerInfo[];
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

function arcPath(x1: number, y1: number, x2: number, y2: number) {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const lift = Math.min(dist * 0.35, 26);
  const cx = (x1 + x2) / 2;
  const cy = Math.min(y1, y2) - lift;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

interface ManufacturerMapCopyProps {
  svgMap: string;
  points: MapPoint[];
  activeId: string | null;
  ariaHidden?: boolean;
  reduceMotion: boolean;
  onActivate: (id: string) => void;
  onClear: () => void;
  onLinkClick: (e: ReactMouseEvent) => void;
}

export function ManufacturerMapCopy({
  svgMap,
  points,
  activeId,
  ariaHidden,
  reduceMotion,
  onActivate,
  onClear,
  onLinkClick,
}: ManufacturerMapCopyProps) {
  const active = points.find((p) => p.id === activeId) ?? null;

  return (
    <div className="relative h-full aspect-[2/1] shrink-0" aria-hidden={ariaHidden || undefined}>
      <img
        src={svgMap}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none h-full w-full object-cover opacity-90 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]"
      />

      {/* 導入事例の弧（アクティブ点のみ） */}
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

      {/* 導入先の端点ドット */}
      {active &&
        active.arcs.map((arc, i) => (
          <span
            key={`end-${i}`}
            aria-hidden="true"
            className="pointer-events-none absolute z-[5] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
            style={{ left: `${arc.leftPct}%`, top: `${arc.topPct}%` }}
          />
        ))}

      {/* 描画点（単独＝ドット / クラスタ＝件数バッジ）。href維持(SEO)・tabIndex=-1 */}
      {points.map((p) => {
        const isActive = p.id === activeId;
        const isCluster = p.members.length > 1;
        const r = region(p.members[0].country);
        const href = isCluster ? '/manufacturers' : `/manufacturers/${p.members[0].slug}`;
        const label = isCluster
          ? `${r.name}の${p.members.length}社の一覧を見る`
          : `${p.members[0].name}（${r.name}）の詳細を見る`;
        return (
          <Link
            key={p.id}
            href={href}
            tabIndex={-1}
            aria-label={label}
            draggable={false}
            className="group absolute z-[6] -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${p.leftPct}%`, top: `${p.topPct}%` }}
            onPointerEnter={() => onActivate(p.id)}
            onPointerLeave={onClear}
            onFocus={() => onActivate(p.id)}
            onBlur={onClear}
            onClick={onLinkClick}
          >
            <span className="relative flex h-8 w-8 items-center justify-center">
              <span
                aria-hidden="true"
                className={`absolute rounded-full border border-map-accent transition-all duration-300 ease-out ${
                  isActive
                    ? `${isCluster ? 'h-8 w-8' : 'h-6 w-6'} opacity-70`
                    : 'h-3 w-3 opacity-0'
                }`}
              />
              {isCluster ? (
                <span
                  aria-hidden="true"
                  className={`flex items-center justify-center rounded-full text-[9px] font-medium leading-none transition-all duration-200 ease-out ${
                    isActive ? 'h-5 w-5 bg-map-accent text-map-accent-foreground' : 'h-4 w-4 bg-neutral-200 text-neutral-900'
                  }`}
                >
                  {p.members.length}
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full transition-all duration-200 ease-out ${
                    isActive ? 'scale-150 bg-map-accent' : 'bg-neutral-300'
                  }`}
                />
              )}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
