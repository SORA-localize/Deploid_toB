'use client';

import {
  createContext,
  useEffect,
  useContext,
  useState,
  type Dispatch,
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
  const visible = stickyBar?.visible ?? false;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }

    // Keep the node around slightly longer than duration-300 so the exit transition can finish.
    const timer = window.setTimeout(() => setMounted(false), EXIT_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [visible]);

  if (!mounted || !stickyBar) return null;

  return (
    <div
      aria-hidden={!visible}
      inert={!visible ? true : undefined}
      className={`absolute inset-x-0 top-full border-b border-border bg-background transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-3 opacity-0'
      }`}
    >
      {stickyBar.content}
    </div>
  );
}
