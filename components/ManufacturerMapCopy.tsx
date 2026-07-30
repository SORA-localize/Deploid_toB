'use client';

import Link from 'next/link';
import { getCountryDisplay } from '@/lib/countryRegistry';
import { createArcPath } from '@/lib/worldMap';
import { uiText } from '@/lib/uiText';

export interface ManufacturerArc {
  leftPct: number;
  topPct: number;
  customer: string;
  status: string;
  /** どの社の導入事例か（クラスタ内で会社名の行に突合表示するため）。 */
  manufacturerSlug: string;
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

interface ManufacturerMapCopyProps {
  mapAssetSrc: string;
  points: MapPoint[];
  activeId: string | null;
  reduceMotion: boolean;
  onActivate: (id: string) => void;
  onClear: () => void;
}

export function ManufacturerMapCopy({
  mapAssetSrc,
  points,
  activeId,
  reduceMotion,
  onActivate,
  onClear,
}: ManufacturerMapCopyProps) {
  const active = points.find((p) => p.id === activeId) ?? null;

  return (
    <div data-world-map-canvas className="relative h-full min-w-full aspect-[2/1] shrink-0">
      <img
        src={mapAssetSrc}
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
            const d = createArcPath(
              { x: active.leftPct, y: active.topPct },
              { x: arc.leftPct, y: arc.topPct },
            );
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

      {/* 描画点（単独＝ドット / クラスタ＝件数バッジ）。href維持(SEO)・キーボードでフォーカス可能 */}
      {points.map((p) => {
        const isActive = p.id === activeId;
        const isCluster = p.members.length > 1;
        const r = getCountryDisplay(p.members[0].country);
        const href = isCluster ? '/manufacturers' : `/manufacturers/${p.members[0].slug}`;
        const label = isCluster
          ? uiText.home.worldMap.clusterAriaLabel(r.name, p.members.length)
          : uiText.home.worldMap.singleAriaLabel(p.members[0].name, r.name);
        return (
          <Link
            key={p.id}
            href={href}
            data-world-map-point
            aria-label={label}
            draggable={false}
            className="group absolute z-[6] -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            style={{ left: `${p.leftPct}%`, top: `${p.topPct}%` }}
            onPointerEnter={() => onActivate(p.id)}
            onPointerLeave={onClear}
            onFocus={() => onActivate(p.id)}
            onBlur={onClear}
          >
            <span className="relative flex h-8 w-8 items-center justify-center">
              <span
                aria-hidden="true"
                className={`absolute rounded-full border border-signal transition-all duration-300 ease-out motion-reduce:transition-none ${
                  isActive
                    ? `${isCluster ? 'h-8 w-8' : 'h-6 w-6'} opacity-70`
                    : 'h-3 w-3 opacity-0'
                }`}
              />
              {isCluster ? (
                <span
                  aria-hidden="true"
                  className={`flex items-center justify-center rounded-full text-[9px] font-medium leading-none transition-all duration-200 ease-out motion-reduce:transition-none ${
                    isActive ? 'h-5 w-5 bg-signal text-signal-foreground' : 'h-4 w-4 bg-neutral-200 text-neutral-900'
                  }`}
                >
                  {p.members.length}
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full transition-all duration-200 ease-out motion-reduce:transition-none ${
                    isActive ? 'scale-150 bg-signal' : 'bg-neutral-300'
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
