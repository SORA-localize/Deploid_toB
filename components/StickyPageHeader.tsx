'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useHeaderStickyBarSetter } from '@/components/HeaderChrome';

interface StickyPageHeaderProps {
  children: ReactNode;
  visible: boolean;
}

export function StickyPageHeader({ children, visible }: StickyPageHeaderProps) {
  const setStickyBar = useHeaderStickyBarSetter();

  useEffect(() => {
    setStickyBar({ content: children, visible });
    return () => setStickyBar(null);
  }, [children, setStickyBar, visible]);

  return null;
}
