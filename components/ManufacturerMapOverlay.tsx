'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Building2 } from 'lucide-react';

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
  /** 背景SVGの viewBox に対する割合(0-100)。サーバーで getPin から算出済み。 */
  leftPct: number;
  topPct: number;
  /** 導入事例の弧の終点（実所在地を投影） */
  arcs: ManufacturerArc[];
}

interface ManufacturerMapOverlayProps {
  markers: ManufacturerMarker[];
}

const AUTO_INTERVAL_MS = 2400;
const RESUME_DELAY_MS = 3500;

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
const region = (country: string) =>
  REGION[country] ?? { name: country, a3: country.slice(0, 3).toUpperCase() };

// 0-100座標系の弧パス（SVGは preserveAspectRatio=none で横2倍に伸びる前提）。
function arcPath(x1: number, y1: number, x2: number, y2: number) {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const lift = Math.min(dist * 0.35, 26);
  const cx = (x1 + x2) / 2;
  const cy = Math.min(y1, y2) - lift;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

// ワードマークロゴ。src無し・読み込み失敗時はプレースホルダー。白チップ上に置く前提。
function Wordmark({ src }: { src?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <Building2 className="h-5 w-5 text-neutral-300" aria-hidden="true" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      onError={() => setFailed(true)}
      className="h-6 w-auto max-w-[150px] object-contain"
    />
  );
}

export function ManufacturerMapOverlay({ markers }: ManufacturerMapOverlayProps) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);

  const reduceMotion = useRef(false);
  const autoIndex = useRef(0);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    reduceMotion.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    if (paused || reduceMotion.current || markers.length === 0) return;
    const id = setInterval(() => {
      autoIndex.current = (autoIndex.current + 1) % markers.length;
      setActiveSlug(markers[autoIndex.current].slug);
    }, AUTO_INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, markers]);

  const clearResume = () => {
    if (resumeTimer.current) {
      clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
  };
  useEffect(() => () => clearResume(), []);

  // マップに操作が入ったら自動デモを止め、表示中の自動カードは消す（マウス操作に切替）。
  const enterInteractive = () => {
    clearResume();
    setPaused(true);
    setActiveSlug(null);
  };
  const scheduleResume = () => {
    clearResume();
    resumeTimer.current = setTimeout(() => setPaused(false), RESUME_DELAY_MS);
  };
  const setActiveTo = (slug: string) => {
    clearResume();
    setPaused(true);
    const index = markers.findIndex((m) => m.slug === slug);
    if (index >= 0) autoIndex.current = index;
    setActiveSlug(slug);
  };

  const active = markers.find((m) => m.slug === activeSlug) ?? null;
  const activeRegion = active ? region(active.country) : null;

  return (
    <div
      className="absolute inset-0"
      onPointerEnter={enterInteractive}
      onPointerLeave={scheduleResume}
      onBlurCapture={scheduleResume}
    >
      {/* 導入事例の弧（アクティブなメーカーのみ）：白い実線＋移動パルス */}
      {active && active.arcs.length > 0 && (
        <svg
          key={`arcs-${active.slug}`}
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {active.arcs.map((arc, i) => {
            const d = arcPath(active.leftPct, active.topPct, arc.leftPct, arc.topPct);
            return (
              <g key={i}>
                {/* 実線のベース */}
                <path
                  d={d}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={1}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  style={{ opacity: 0.35 }}
                />
                {/* 線上を流れる光のセグメント（移動方向＝HQ→導入先）。reduced-motion時は出さない。 */}
                {!reduceMotion.current && (
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

      {/* 弧の終点（導入先）：小さな白ドットのみ。顧客名はカードに集約（被り回避） */}
      {active &&
        active.arcs.map((arc, i) => (
          <span
            key={`end-${active.slug}-${i}`}
            aria-hidden="true"
            className="manufacturer-card-enter pointer-events-none absolute z-[5] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
            style={{ left: `${arc.leftPct}%`, top: `${arc.topPct}%` }}
          />
        ))}

      {markers.map((m, i) => {
        const isActive = m.slug === activeSlug;
        return (
          <Link
            key={m.slug}
            href={`/manufacturers/${m.slug}`}
            aria-label={`${m.name}（${region(m.country).name}）の詳細を見る`}
            className="group absolute z-[6] -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${m.leftPct}%`, top: `${m.topPct}%` }}
            onPointerEnter={() => setActiveTo(m.slug)}
            onPointerLeave={() => setActiveSlug(null)}
            onFocus={() => setActiveTo(m.slug)}
            onBlur={() => setActiveSlug(null)}
          >
            <span
              className="manufacturer-dot-enter relative flex h-7 w-7 items-center justify-center"
              style={{ animationDelay: `${120 + i * 55}ms` }}
            >
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

      {/* 情報カード：左下から中央にかけて軽く表示 */}
      {active && activeRegion && (
        <div
          key={active.slug}
          className="manufacturer-card-enter pointer-events-none absolute bottom-0 left-0 z-10 m-4 max-w-[62%]"
        >
          <div className="flex items-center text-xs">
            <span className="pr-2 text-neutral-200">
              {activeRegion.name}
              <span className="ml-1 font-mono text-[10px] text-neutral-400">{activeRegion.a3}</span>
            </span>
            <span className="border-l border-neutral-600 px-2 font-medium text-white">
              {active.name}
            </span>
            <span className="border-l border-neutral-600 pl-2 text-neutral-400">
              {active.foundedYear ?? '—'}
            </span>
          </div>
          <div className="mt-2 inline-flex items-center bg-white px-2.5 py-1.5">
            <Wordmark src={active.logoSrc} />
          </div>
          {active.arcs.length > 0 && (
            <p className="mt-2 max-w-xs text-[11px] leading-snug">
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                Deployments
              </span>{' '}
              <span className="text-neutral-200">
                {active.arcs.map((a) => a.customer).join(' · ')}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
