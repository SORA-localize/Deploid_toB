'use client';

import { useSyncExternalStore, type MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void> };
};

// マウント前はテーマ未解決（SSR/初回描画とhydration後で表示を分けるためのフラグ）。
// useEffect + setState ではなく useSyncExternalStore で表現する
// （react-hooks/set-state-in-effect回避。購読不要な「hydration後は常にtrue」の定番パターン）。
const subscribeNoop = () => () => {};
const getMountedSnapshot = () => true;
const getMountedServerSnapshot = () => false;
function useHasMounted(): boolean {
  return useSyncExternalStore(subscribeNoop, getMountedSnapshot, getMountedServerSnapshot);
}

export function ThemeModeToggle({
  className = '',
  tabIndex,
}: {
  className?: string;
  tabIndex?: number;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useHasMounted();

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
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endRadius = Math.hypot(
      Math.max(x, viewportWidth - x),
      Math.max(y, viewportHeight - y),
    );

    // 座標・半径は px 絶対値ではなく viewport 比の % で渡す。Chrome には fractional
    // display scale（例: Windows 150%）環境で ::view-transition-new(root) への px 指定
    // clip-path が正しくスケールされず初回遷移がズレるバグがある（px指定はスケール前提が
    // 崩れる）。% はスナップショット参照ボックスに対して解決されるため影響を受けない。
    const toXPct = (px: number) => `${(px / viewportWidth) * 100}%`;
    const toYPct = (px: number) => `${(px / viewportHeight) * 100}%`;
    const toRadiusPct = (px: number) =>
      `${(px / (Math.hypot(viewportWidth, viewportHeight) / Math.SQRT2)) * 100}%`;

    const transition = doc.startViewTransition(() => {
      flushSync(() => setTheme(next));
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0% at ${toXPct(x)} ${toYPct(y)})`,
            `circle(${toRadiusPct(endRadius)} at ${toXPct(x)} ${toYPct(y)})`,
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
