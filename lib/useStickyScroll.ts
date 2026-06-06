'use client';

import { useEffect, useState } from 'react';
import { GLOBAL_HEADER_HEIGHT } from '@/lib/siteLayout';

export function useStickyScroll() {
  const [isStuck, setIsStuck] = useState(false);
  useEffect(() => {
    function onScroll() { setIsStuck(window.scrollY >= GLOBAL_HEADER_HEIGHT); }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return isStuck;
}
