'use client';

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

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
