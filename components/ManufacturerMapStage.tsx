'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { EncryptedText } from '@/components/ui/encrypted-text';
import { ManufacturerMapCopy, type MapPoint } from '@/components/ManufacturerMapCopy';
import { getCountryDisplay } from '@/lib/countryRegistry';
import { uiText } from '@/lib/uiText';
import React from 'react';

interface ManufacturerMapStageProps {
  mapAssetSrc: string;
  points: MapPoint[];
  heading: string;
  subcopy: string;
}

// prefers-reduced-motion判定。JSXのrender中にref.currentを読む(react-hooks/refs違反)代わりに
// useSyncExternalStoreで購読し、変化にも追従できる真にreactiveな値として扱う。
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
function subscribeReducedMotion(callback: () => void) {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}
function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
function getReducedMotionServerSnapshot() {
  return false;
}
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
}

const AUTO_SPEED = 0.18; // px/frame ≈ 10px/s
const RESUME_DELAY_MS = 2500; // 操作(hover/drag/フォーカス)後、自動再開までの待ち時間
const DWELL_MS = 1500; // 自動ハイライトの最小保持時間（密集地でも切替が速すぎないように）
const MAX_VISIBLE_CLUSTER_MEMBERS = 3; // クラスタ内表示の上限（超過分は「+n社」で畳む。左上の見出しに被るのを防ぐ）

function Wordmark({ src, compact }: { src?: string; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <Building2
        className={`${compact ? 'h-3.5 w-3.5' : 'h-5 w-5'} text-neutral-300`}
        aria-hidden="true"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      onError={() => setFailed(true)}
      className={`${compact ? 'h-4 max-w-[88px]' : 'h-6 max-w-[150px]'} w-auto object-contain`}
    />
  );
}

export function ManufacturerMapStage({ mapAssetSrc, points, heading, subcopy }: ManufacturerMapStageProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [copies, setCopies] = useState(3);
  const prefersReducedMotion = usePrefersReducedMotion();

  const panX = useRef(0);
  const copyW = useRef(0);
  const stageW = useRef(0);
  const dragging = useRef(false);
  const dragMoved = useRef(false);
  const startX = useRef(0);
  const startPan = useRef(0);
  const interacting = useRef(false);
  const reduceMotion = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafId = useRef<number | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const lastSwitch = useRef(0);

  const setActive = useCallback((id: string | null) => {
    activeIdRef.current = id;
    setActiveId(id);
  }, []);

  // 自動パン中、ステージ中央に最も近い点を「ホバー相当」でアクティブにする（スクロールと同期）。
  const syncAutoActive = useCallback(() => {
    const cw = copyW.current;
    const sw = stageW.current;
    if (cw <= 0 || sw <= 0 || points.length === 0) return;
    const target = sw / 2;
    let bestId: string | null = null;
    let bestDist = Infinity;
    for (const p of points) {
      const baseX = (p.leftPct / 100) * cw;
      let x = (((baseX + panX.current) % cw) + cw) % cw;
      while (x < target - cw / 2) x += cw;
      while (x > target + cw / 2) x -= cw;
      const dist = Math.abs(x - target);
      if (dist < bestDist) {
        bestDist = dist;
        bestId = p.id;
      }
    }
    const candidate = bestDist <= cw * 0.05 ? bestId : null;
    if (candidate !== activeIdRef.current) {
      const now = performance.now();
      if (now - lastSwitch.current >= DWELL_MS) {
        lastSwitch.current = now;
        setActive(candidate);
      }
    }
  }, [points, setActive]);

  const applyTransform = () => {
    if (trackRef.current) trackRef.current.style.transform = `translateX(${panX.current}px)`;
  };
  const wrap = () => {
    const cw = copyW.current;
    if (cw > 0) panX.current = (((panX.current % cw) + cw) % cw) - cw;
  };
  const clearResume = useCallback(() => {
    if (resumeTimer.current) {
      clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
  }, []);
  const scheduleResume = useCallback(() => {
    clearResume();
    resumeTimer.current = setTimeout(() => {
      interacting.current = false;
    }, RESUME_DELAY_MS);
  }, [clearResume]);

  // rAFループ（非レンダーの命令的コード）で最新値を読むため、reactiveな値をrefへ同期する。
  // setStateを呼ばないref代入のみなのでreact-hooks/set-state-in-effectには該当しない。
  useEffect(() => {
    reduceMotion.current = prefersReducedMotion;
  }, [prefersReducedMotion]);

  // タイル幅(=stage高さ×2、アセットのアスペクト比 198:100 ≈ 2:1 に合わせる)とステージ幅を
  // 計測し、画面を隙間なく覆う＋シームレスループ用に1枚余分に並べるタイル数を出す。
  useEffect(() => {
    const measure = () => {
      const s = stageRef.current;
      if (!s) return;
      const h = s.clientHeight;
      const w = s.clientWidth;
      copyW.current = h * 2;
      stageW.current = w;
      setCopies(Math.max(3, Math.ceil(w / (h * 2)) + 1));
      wrap();
      applyTransform();
    };
    measure();
    let ro: ResizeObserver | undefined;
    if (stageRef.current) {
      ro = new ResizeObserver(measure);
      ro.observe(stageRef.current);
    }
    return () => ro?.disconnect();
  }, []);

  useEffect(() => {
    const tick = () => {
      if (!interacting.current && !reduceMotion.current && copyW.current > 0) {
        panX.current -= AUTO_SPEED;
        wrap();
        applyTransform();
        syncAutoActive();
      }
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [syncAutoActive]);

  // ドラッグは window 側で listen（pointer-captureを使わないのでマーカークリックが生き残る）。
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - startX.current;
      if (Math.abs(dx) > 6) dragMoved.current = true;
      panX.current = startPan.current + dx;
      wrap();
      applyTransform();
    };
    const up = () => {
      if (dragging.current) {
        dragging.current = false;
        scheduleResume();
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      clearResume();
    };
  }, [scheduleResume, clearResume]);

  const onPointerDown = (e: ReactPointerEvent) => {
    dragging.current = true;
    dragMoved.current = false;
    interacting.current = true;
    clearResume();
    startX.current = e.clientX;
    startPan.current = panX.current;
  };
  const onStageEnter = () => {
    interacting.current = true;
    clearResume();
  };
  const onStageLeave = () => {
    setActive(null);
    scheduleResume();
  };
  const onActivate = useCallback(
    (id: string) => {
      interacting.current = true;
      setActive(id);
    },
    [setActive],
  );
  const onClear = useCallback(() => setActive(null), [setActive]);
  const onLinkClick = useCallback((e: ReactMouseEvent) => {
    if (dragMoved.current) e.preventDefault();
  }, []);

  const active = points.find((p) => p.id === activeId) ?? null;
  const ar = active ? getCountryDisplay(active.members[0].country) : null;
  const isCluster = !!active && active.members.length > 1;

  const headingLines = heading.split('\n');
  const subcopyLines = subcopy.split('\n');

  return (
    <div
      ref={stageRef}
      data-world-map-stage
      className="relative h-[240px] sm:h-[320px] md:h-[clamp(320px,65vh,880px)] w-full cursor-grab touch-pan-y select-none overflow-hidden bg-neutral-950 active:cursor-grabbing"
      onPointerDown={onPointerDown}
      onPointerEnter={onStageEnter}
      onPointerLeave={onStageLeave}
    >
      {/*
        isolate で stacking context を閉じる。これが無いと canvas 内の拠点ドット
        （z-[5]/z-[6]）が stage の文脈へ参加し、z-index を持たない可読性スクリムより
        前面に描かれる。結果、地図だけが減光されドットだけ素の明るさで残り、
        見出しと同じ階層・彩度に見える（1440px ではクラスタバッジが見出しに重なる）。
        スクリムは DOM 上この要素より後にあるため、閉じれば自然に上へ来る。
      */}
      <div className="isolate absolute inset-0 overflow-hidden">
        <div ref={trackRef} className="flex h-full will-change-transform">
          {Array.from({ length: copies }).map((_, k) => (
            <ManufacturerMapCopy
              key={k}
              mapAssetSrc={mapAssetSrc}
              points={points}
              activeId={activeId}
              ariaHidden={k !== 0}
              reduceMotion={Boolean(prefersReducedMotion)}
              onActivate={onActivate}
              onClear={onClear}
              onLinkClick={onLinkClick}
            />
          ))}
        </div>
      </div>

      {/* 地図タイル上下の縁を背景色へ溶かすフェード。以前は各タイルの img に mask-image を
          当てていたが、自動パンで常時 translateX されるレイヤーに mask を乗せると
          ブラウザがラスタライズし続けて重くなる（複数タイル分なおさら）。動かない
          オーバーレイ1枚に分離し、GPU合成だけで済むようにする。 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, #0a0a0a 0%, transparent 10%, transparent 90%, #0a0a0a 100%)',
        }}
      />

      {/* 可読性スクリム（機能的・モノクロ） */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-neutral-950/85 via-neutral-950/20 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-neutral-950/80 to-transparent"
      />

      {/* 見出し（左上） */}
      <div className="pointer-events-none absolute inset-0 z-20">
        <div className="site-container h-full pt-10 md:pt-16">
          <div className="max-w-2xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-wider text-neutral-400">
              {uiText.home.worldMap.kicker}
            </p>
            <h1 className="mb-4 text-[1.6875rem] font-semibold leading-tight text-white md:text-[2.625rem]">
              {headingLines.map((line, i) => (
                <EncryptedText
                  key={i}
                  text={line}
                  revealDelayMs={30}
                  flipDelayMs={30}
                  className="block"
                />
              ))}
            </h1>
            <div className="hidden sm:block max-w-xl text-sm leading-relaxed text-neutral-300 md:text-base">
              {subcopyLines.map((line, i) => (
                <EncryptedText
                  key={i}
                  text={line}
                  revealDelayMs={20}
                  flipDelayMs={20}
                  className="block"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA（右下） */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
        <div className="site-container pb-6 md:pb-10">
          <div className="flex flex-wrap justify-end gap-3">
            <Link
              href="/robots"
              onPointerDown={(e) => e.stopPropagation()}
              className="pointer-events-auto inline-flex items-center gap-2 bg-white px-4 py-3 text-xs font-medium text-neutral-900 transition-colors hover:bg-neutral-200 sm:px-6 sm:py-4 sm:text-sm"
            >
              {uiText.home.worldMap.ctaRobots}
            </Link>
          </div>
        </div>
      </div>

      {/* 情報カード（左下）。単独＝1社、クラスタ＝複数社を縦スタック。モバイルでは非表示 */}
      {active && ar && (
        <div className="hidden sm:block pointer-events-none absolute inset-x-0 bottom-24 lg:bottom-0 z-20">
          <div className="site-container pb-4 md:pb-10">
            <div
              key={active.id}
              data-world-map-detail
              className="manufacturer-card-enter inline-block max-w-[92%] lg:max-w-[62%]"
            >
              {isCluster ? (
                <>
                  <p className="mb-1 text-xs">
                    <span className="font-mono text-[11px] text-neutral-400">{ar.alpha3}</span>
                    <span className="ml-2 text-neutral-400">
                      {uiText.home.worldMap.memberCount(active.members.length)}
                    </span>
                  </p>
                  <ul className="text-xs">
                    {active.members.slice(0, MAX_VISIBLE_CLUSTER_MEMBERS).map((m, i) => {
                      const isLastVisible = i === MAX_VISIBLE_CLUSTER_MEMBERS - 1;
                      const overflowCount = active.members.length - MAX_VISIBLE_CLUSTER_MEMBERS;
                      const memberCustomers = active.arcs
                        .filter((a) => a.manufacturerSlug === m.slug)
                        .map((a) => a.customer);
                      return (
                        <li key={m.slug} className="relative flex items-center gap-2 py-1.5">
                          {i !== 0 && (
                            <span
                              aria-hidden="true"
                              className="absolute left-0 top-0 h-px w-1/2 bg-neutral-700"
                            />
                          )}
                          <span className="inline-flex h-6 w-12 items-center justify-center bg-white">
                            <Wordmark src={m.logoSrc} compact />
                          </span>
                          <span className="font-medium text-white">{m.name}</span>
                          <span className="font-mono text-[10px] text-neutral-400">
                            {m.foundedYear ?? '—'}
                          </span>
                          {memberCustomers.length > 0 && (
                            <span className="min-w-0 flex-1 truncate text-[10px] text-neutral-300">
                              : {memberCustomers.join('・')}
                            </span>
                          )}
                          {isLastVisible && overflowCount > 0 && (
                            <span className="ml-auto shrink-0 font-mono text-[10px] text-neutral-400">
                              {uiText.home.worldMap.overflowCount(overflowCount)}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <>
                  <div className="flex items-center text-xs">
                    <span className="pr-2 font-mono text-[11px] text-neutral-400">{ar.alpha3}</span>
                    <span className="border-l border-neutral-600 px-2 font-medium text-white">
                      {active.members[0].name}
                    </span>
                    <span className="border-l border-neutral-600 pl-2 text-neutral-400">
                      {active.members[0].foundedYear ?? '—'}
                    </span>
                  </div>
                  <div className="mt-2 inline-flex items-center bg-white px-2.5 py-1.5">
                    <Wordmark src={active.members[0].logoSrc} />
                  </div>
                </>
              )}

              {/* クラスタ（3社以上想定）では各社の行に導入先を突合表示するので、
                  ここでの一括表示は単独社の場合のみ。 */}
              {!isCluster && active.arcs.length > 0 && (
                <p className="mt-2 max-w-xs text-[11px] leading-snug">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                    {uiText.home.worldMap.deployments}
                  </span>{' '}
                  <span className="text-neutral-200">
                    {active.arcs.map((a) => a.customer).join(' · ')}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
