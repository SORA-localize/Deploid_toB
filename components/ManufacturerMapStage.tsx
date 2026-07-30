'use client';

import { useState, useSyncExternalStore } from 'react';
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const active = points.find((p) => p.id === activeId) ?? null;
  const ar = active ? getCountryDisplay(active.members[0].country) : null;
  const isCluster = !!active && active.members.length > 1;

  const headingLines = heading.split('\n');
  const subcopyLines = subcopy.split('\n');

  return (
    <div
      data-world-map-stage
      className="relative h-[240px] sm:h-[320px] md:h-[clamp(320px,65vh,880px)] w-full select-none overflow-hidden bg-neutral-950"
    >
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <ManufacturerMapCopy
          mapAssetSrc={mapAssetSrc}
          points={points}
          activeId={activeId}
          reduceMotion={Boolean(prefersReducedMotion)}
          onActivate={setActiveId}
          onClear={() => setActiveId(null)}
        />
      </div>

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
      <div className="pointer-events-none absolute inset-0">
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
      <div className="absolute inset-x-0 bottom-0">
        <div className="site-container pb-6 md:pb-10">
          <div className="flex flex-wrap justify-end gap-3">
            <Link
              href="/robots"
              className="inline-flex items-center gap-2 bg-white px-4 py-3 text-xs font-medium text-neutral-900 transition-colors hover:bg-neutral-200 sm:px-6 sm:py-4 sm:text-sm"
            >
              {uiText.home.worldMap.ctaRobots}
            </Link>
          </div>
        </div>
      </div>

      {/* 情報カード（左下）。単独＝1社、クラスタ＝複数社を縦スタック。モバイルでは非表示 */}
      {active && ar && (
        <div className="hidden sm:block pointer-events-none absolute inset-x-0 bottom-24 lg:bottom-0">
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
