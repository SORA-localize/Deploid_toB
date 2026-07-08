'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void> };
};

export function ThemeModeToggle({
  className = '',
  tabIndex,
}: {
  className?: string;
  tabIndex?: number;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';
  const label = isDark ? 'ライトモードに切り替える' : 'ダークモードに切り替える';

  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    const next = isDark ? 'light' : 'dark';
    const doc = document as ViewTransitionDocument;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // View Transitions 非対応 or モーション抑制時は即時切替にフォールバック。
    if (!doc.startViewTransition || prefersReducedMotion) {
      setTheme(next);
      return;
    }

    // クリックしたアイコンの中心を起点に、画面の四隅まで届く半径を求める。
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = doc.startViewTransition(() => {
      flushSync(() => setTheme(next));
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 480,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    });
  };

  // マウント前はテーマ未解決。レイアウトシフトを避ける同寸プレースホルダ。
  if (!mounted) {
    return (
      <span
        className={`inline-flex h-9 w-9 items-center justify-center ${className}`}
        aria-hidden="true"
      >
        <Sun className="h-5 w-5 text-muted-foreground" />
      </span>
    );
  }

  const Icon = isDark ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      tabIndex={tabIndex}
      className={`inline-flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground ${className}`}
    >
      {/* アイコンは固有の view-transition-name を持ち、同じ位置で回転しながら
          太陽⇄月に入れ替わる（演出は globals.css のキーフレーム）。 */}
      <Icon className="h-5 w-5" style={{ viewTransitionName: 'theme-toggle-icon' }} />
    </button>
  );
}
