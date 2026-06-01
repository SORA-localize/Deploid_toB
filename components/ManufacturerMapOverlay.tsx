'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export interface ManufacturerMarker {
  slug: string;
  name: string;
  country: string;
  presenceLabel: string;
  logoSrc?: string;
  robotName?: string;
  robotImageSrc?: string;
  /** 背景SVGの viewBox に対する割合(0-100)。サーバーで getPin から算出済み。 */
  leftPct: number;
  topPct: number;
}

interface ManufacturerMapOverlayProps {
  markers: ManufacturerMarker[];
}

const AUTO_INTERVAL_MS = 2400; // 自動デモが次のメーカーへ進む間隔
const RESUME_DELAY_MS = 3500; // 操作が止まってから自動デモを再開するまで

export function ManufacturerMapOverlay({ markers }: ManufacturerMapOverlayProps) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);

  const reduceMotion = useRef(false);
  const autoIndex = useRef(0);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // reduced-motion 判定（クライアントのみ）
  useEffect(() => {
    reduceMotion.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // 無操作時の自動デモ：一定間隔でアクティブなメーカーを地域順に巡回する。
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

  // マップ上で操作が始まったら自動デモを止める
  const pause = () => {
    clearResume();
    setPaused(true);
  };

  // 操作が離れたら一定時間後に自動デモを再開する
  const scheduleResume = () => {
    clearResume();
    resumeTimer.current = setTimeout(() => setPaused(false), RESUME_DELAY_MS);
  };

  useEffect(() => () => clearResume(), []);

  const setActiveTo = (slug: string) => {
    const index = markers.findIndex((m) => m.slug === slug);
    if (index >= 0) autoIndex.current = index; // 巡回位置を同期し、再開時に続きから
    setActiveSlug(slug);
  };

  const active = markers.find((m) => m.slug === activeSlug) ?? null;

  return (
    <div
      className="absolute inset-0"
      onPointerEnter={pause}
      onPointerLeave={scheduleResume}
      onFocusCapture={pause}
      onBlurCapture={scheduleResume}
    >
      {markers.map((m, i) => {
        const isActive = m.slug === activeSlug;
        return (
          <Link
            key={m.slug}
            href={`/manufacturers/${m.slug}`}
            aria-label={`${m.name}（${m.country}・${m.presenceLabel}）の詳細を見る`}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${m.leftPct}%`, top: `${m.topPct}%` }}
            onPointerEnter={() => setActiveTo(m.slug)}
            onFocus={() => setActiveTo(m.slug)}
          >
            {/* タップ/フォーカス領域を広めに確保（モバイル配慮）。登場アニメは初回一度きり。 */}
            <span
              className="manufacturer-dot-enter relative flex h-7 w-7 items-center justify-center"
              style={{ animationDelay: `${120 + i * 55}ms` }}
            >
              {/* アクティブ時に広がるリング（脈動しない） */}
              <span
                aria-hidden="true"
                className={`absolute rounded-full border border-[#0d7c66] transition-all duration-300 ease-out ${
                  isActive ? 'h-6 w-6 opacity-60' : 'h-2.5 w-2.5 opacity-0'
                }`}
              />
              {/* 本体の点。idle=neutral、アクティブ=アクセント色＋拡大 */}
              <span
                aria-hidden="true"
                className={`h-2 w-2 rounded-full transition-all duration-200 ease-out ${
                  isActive ? 'scale-150 bg-[#0d7c66]' : 'bg-neutral-500'
                }`}
              />
            </span>
          </Link>
        );
      })}

      {/* 情報カード（2段構え）。ホバー/フォーカス/自動デモのアクティブ点に対して表示。 */}
      {active && (
        <div
          key={active.slug}
          role="tooltip"
          className="manufacturer-card-enter pointer-events-none absolute z-10 w-56 border border-neutral-300 bg-white p-3 text-left shadow-md"
          style={{
            left: `clamp(8px, calc(${active.leftPct}% - 112px), calc(100% - 232px))`,
            ...(active.topPct < 58
              ? { top: `calc(${active.topPct}% + 16px)` }
              : { bottom: `calc(${(100 - active.topPct).toFixed(2)}% + 16px)` }),
          }}
        >
          {/* 1段目：ロゴ＋社名＋地域 */}
          <div className="flex items-center gap-2.5">
            {active.logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={active.logoSrc}
                alt=""
                aria-hidden="true"
                className="h-5 w-auto max-w-[72px] object-contain"
              />
            ) : null}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900">{active.name}</p>
              <p className="text-[11px] text-neutral-500">
                {active.country}・{active.presenceLabel}
              </p>
            </div>
          </div>

          {/* 2段目：代表機種の画像＋機種名 */}
          {active.robotImageSrc ? (
            <div className="mt-2.5 flex items-center gap-2.5 border-t border-neutral-200 pt-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.robotImageSrc}
                alt=""
                aria-hidden="true"
                className="h-12 w-16 shrink-0 bg-neutral-50 object-contain"
              />
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                  Model
                </p>
                <p className="truncate text-xs text-neutral-700">{active.robotName ?? '要確認'}</p>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
