'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Bot, Building2, type LucideIcon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

type PreviewAsset = {
  src: string;
  alt: string;
  label: string;
};

type HomeContentNavigatorProps = {
  robotAssets: PreviewAsset[];
  manufacturerAssets: PreviewAsset[];
  guideAssets: PreviewAsset[];
};

type ContentKey = 'robots' | 'manufacturers' | 'guides';

type ContentItem = {
  key: ContentKey;
  title: string;
  href: string;
  description: string;
  stat: string;
  action: string;
  icon: LucideIcon;
  assets: PreviewAsset[];
  fallbackLabel: string;
};

export function HomeContentNavigator({
  robotAssets,
  manufacturerAssets,
  guideAssets,
}: HomeContentNavigatorProps) {
  const shouldReduceMotion = useReducedMotion();
  const [activeKey, setActiveKey] = useState<ContentKey>('robots');

  const items = useMemo<ContentItem[]>(
    () => [
      {
        key: 'robots',
        title: 'ロボット',
        href: '/robots',
        description: 'ロボットごとの仕様、販売状況、国内相談ルートを比較する。',
        stat: '仕様 / 価格 / 国内相談',
        action: 'ロボットを見る',
        icon: Bot,
        assets: robotAssets,
        fallbackLabel: 'Robot catalog',
      },
      {
        key: 'manufacturers',
        title: 'メーカー',
        href: '/manufacturers',
        description: '開発企業の所在地、代表ロボット、国内代理店を把握する。',
        stat: '所在地 / 代表ロボット / 国内代理店',
        action: 'メーカーを見る',
        icon: Building2,
        assets: manufacturerAssets,
        fallbackLabel: 'Manufacturer network',
      },
      {
        key: 'guides',
        title: '導入ガイド',
        href: '/guides',
        description: '調達、評価、PoC設計まで導入判断の流れを整理する。',
        stat: '調達 / 評価 / PoC',
        action: 'ガイドを見る',
        icon: BookOpen,
        assets: guideAssets,
        fallbackLabel: 'Implementation guide',
      },
    ],
    [guideAssets, manufacturerAssets, robotAssets],
  );

  const activeItem = items.find((item) => item.key === activeKey) ?? items[0];
  const primaryAsset = activeItem.assets[0];
  const secondaryAssets = activeItem.assets.slice(1, 7);
  const transition = shouldReduceMotion ? { duration: 0 } : { duration: 0.42, ease: 'easeOut' as const };

  return (
    <section className="border-b border-border py-16">
      <div className="mb-8 flex items-end justify-between gap-6">
        <h2 className="text-2xl font-semibold text-foreground">主要コンテンツ</h2>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(420px,1.15fr)] lg:items-stretch">
        <div className="divide-y divide-border border-y border-border">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === activeItem.key;

            return (
              <Link
                key={item.key}
                href={item.href}
                onFocus={() => setActiveKey(item.key)}
                onMouseEnter={() => setActiveKey(item.key)}
                className="group block py-6 outline-none transition-colors hover:bg-muted/70 focus-visible:bg-muted"
              >
                <div className="grid gap-4 px-1 sm:grid-cols-[2rem_1fr] sm:px-0">
                  <Icon
                    aria-hidden="true"
                    className={`mt-1 h-7 w-7 transition-colors ${
                      isActive ? 'text-foreground' : 'text-muted-foreground/70 group-hover:text-foreground'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                      <span className="hidden whitespace-nowrap text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70 sm:inline">
                        {item.stat}
                      </span>
                    </div>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{item.description}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm text-foreground">
                      <span className="border-b border-foreground pb-0.5 leading-none transition-colors group-hover:border-foreground/40 group-hover:text-muted-foreground">
                        {item.action}
                      </span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 右プレビューはテーマに依らず意図的なダークなメディア面（画像の上に暗い
            オーバーレイを敷く演出）。ロゴグリッドの白バックプレートも意図的に残す。 */}
        <div className="relative min-h-[220px] overflow-hidden bg-neutral-950 text-white md:min-h-[320px] lg:min-h-[440px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem.key}
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 1.025, x: 18 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.985, x: -18 }}
              transition={transition}
              className="absolute inset-0"
            >
              {primaryAsset ? (
                activeItem.key === 'manufacturers' ? (
                  <div className="grid h-full w-full grid-cols-2 place-items-center gap-4 bg-neutral-100 p-8 opacity-95 sm:grid-cols-3">
                    {activeItem.assets.slice(0, 6).map((asset, index) => (
                      <motion.div
                        key={`${asset.src}-${index}`}
                        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.94, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ ...transition, delay: shouldReduceMotion ? 0 : 0.04 * index }}
                        className="flex h-20 w-full items-center justify-center bg-white/90 p-4 sm:h-24"
                      >
                        <img src={asset.src} alt={asset.alt} className="max-h-full max-w-full object-contain" />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <img
                    src={primaryAsset.src}
                    alt={primaryAsset.alt}
                    className="h-full w-full object-cover opacity-80"
                  />
                )
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-sm text-neutral-500">
                  {activeItem.fallbackLabel}
                </div>
              )}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.84)_0%,rgba(10,10,10,0.38)_48%,rgba(10,10,10,0.12)_100%)]" />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(0deg,rgba(10,10,10,0.78),transparent)]" />
            </motion.div>
          </AnimatePresence>

          <div className="pointer-events-none relative z-10 flex min-h-[360px] flex-col justify-between p-6 lg:min-h-[440px] lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeItem.key}-copy`}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={transition}
                className="max-w-sm"
              >
                <p className="mb-3 text-xs uppercase tracking-[0.2em] text-white/55">{activeItem.stat}</p>
                <h3 className="text-3xl font-semibold leading-tight tracking-normal text-white sm:text-4xl">
                  {activeItem.title}
                </h3>
                <p className="mt-4 text-sm leading-6 text-white/72">{activeItem.description}</p>
              </motion.div>
            </AnimatePresence>

            {secondaryAssets.length > 0 && (
              <div className="grid w-full max-w-sm grid-cols-3 gap-2 self-end sm:max-w-md">
                {secondaryAssets.map((asset, index) => (
                  <motion.div
                    key={`${activeItem.key}-${asset.src}-${index}`}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...transition, delay: shouldReduceMotion ? 0 : 0.05 * index }}
                    className="h-16 overflow-hidden bg-white/92 sm:h-20"
                  >
                    <img src={asset.src} alt={asset.alt} className="h-full w-full object-contain p-2" />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
