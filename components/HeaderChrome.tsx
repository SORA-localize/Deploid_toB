'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useContext,
  useState,
  type Dispatch,
  type FocusEvent,
  type ReactNode,
  type SetStateAction,
} from 'react';

const EXIT_DURATION_MS = 320;

export interface HeaderStickyBar {
  content: ReactNode;
  visible: boolean;
}

const HeaderStickyBarContext = createContext<HeaderStickyBar | null>(null);
const HeaderStickyBarSetterContext =
  createContext<Dispatch<SetStateAction<HeaderStickyBar | null>> | null>(null);

export function HeaderChromeProvider({ children }: { children: ReactNode }) {
  const [stickyBar, setStickyBar] = useState<HeaderStickyBar | null>(null);

  return (
    <HeaderStickyBarSetterContext.Provider value={setStickyBar}>
      <HeaderStickyBarContext.Provider value={stickyBar}>
        {children}
      </HeaderStickyBarContext.Provider>
    </HeaderStickyBarSetterContext.Provider>
  );
}

export function useHeaderStickyBar() {
  return useContext(HeaderStickyBarContext);
}

export function useHeaderStickyBarSetter() {
  const setStickyBar = useContext(HeaderStickyBarSetterContext);
  if (!setStickyBar) {
    throw new Error('useHeaderStickyBarSetter must be used within HeaderChromeProvider');
  }

  return setStickyBar;
}

export function HeaderStickyBarSlot() {
  const stickyBar = useHeaderStickyBar();
  const [mounted, setMounted] = useState(false);
  const [showing, setShowing] = useState(false);

  /**
   * このバーはスクロール量で出し入れするが、**キーボードフォーカスを持っている間は消さない**。
   *
   * 消していたとき、記事一覧で絞り込みタブを選ぶと次が起きていた（実測）。
   * 絞り込みでヒーローが消える → scroll anchoring がページ先頭へ戻す → scrollY が 0 になり
   * バーが非表示条件に入る → 押したばかりのタブが DOM から外れ、フォーカスが body へ落ちる。
   * キーボード利用者は絞り込むたびに文書の先頭から Tab をやり直すことになる。
   *
   * フォーカスを持つ領域を消さないのは、追従バー全般に効く契約なので個別ページではなく
   * ここで守る。
   *
   * 判定は `:focus-visible` に限る。クリックでもボタンはフォーカスを受け取るため、
   * 単に「フォーカスがある」で判定するとマウス利用者にもバーが残り続けてしまう。
   */
  const [holdsFocus, setHoldsFocus] = useState(false);
  const visible = (stickyBar?.visible ?? false) || holdsFocus;

  const handleFocus = useCallback((event: FocusEvent<HTMLDivElement>) => {
    const target = event.target;
    setHoldsFocus(target instanceof Element && target.matches(':focus-visible'));
  }, []);

  const handleBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) return;
    setHoldsFocus(false);
  }, []);

  useEffect(() => {
    if (visible) {
      const startEnter = () => setMounted(true);
      startEnter();
      // One rAF: let browser paint the element at opacity-0 first, then trigger enter transition.
      const raf = requestAnimationFrame(() => setShowing(true));
      return () => cancelAnimationFrame(raf);
    }
    const startExit = () => setShowing(false);
    startExit();
    const timer = window.setTimeout(() => setMounted(false), EXIT_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [visible]);

  if (!mounted || !stickyBar) return null;

  return (
    <div
      aria-hidden={!showing}
      inert={!showing ? true : undefined}
      onFocusCapture={handleFocus}
      onBlurCapture={handleBlur}
      className={`absolute inset-x-0 top-full border-b border-border bg-background transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        showing ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
      }`}
    >
      {stickyBar.content}
    </div>
  );
}
