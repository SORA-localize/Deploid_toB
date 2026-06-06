'use client';

import { useEffect, useState } from 'react';
import { GLOBAL_HEADER_HEIGHT, GLOBAL_HEADER_HEIGHT_CSS_VARIABLE } from '@/lib/siteLayout';

const SHOW_AFTER_HEADER_OFFSET = 48;
const HIDE_BEFORE_HEADER_OFFSET = 24;

function getGlobalHeaderHeight() {
  const rawValue = getComputedStyle(document.documentElement)
    .getPropertyValue(GLOBAL_HEADER_HEIGHT_CSS_VARIABLE)
    .trim();

  if (rawValue.endsWith('rem')) {
    const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    const remValue = Number.parseFloat(rawValue);
    if (Number.isFinite(remValue) && Number.isFinite(rootFontSize)) {
      return remValue * rootFontSize;
    }
  }

  if (rawValue.endsWith('px')) {
    const pxValue = Number.parseFloat(rawValue);
    if (Number.isFinite(pxValue)) {
      return pxValue;
    }
  }

  return GLOBAL_HEADER_HEIGHT;
}

export function useHeaderStickyBarVisibility() {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    let globalHeaderHeight = getGlobalHeaderHeight();
    function onScroll() {
      setIsVisible((current) => {
        const showAt = globalHeaderHeight + SHOW_AFTER_HEADER_OFFSET;
        const hideAt = Math.max(0, globalHeaderHeight - HIDE_BEFORE_HEADER_OFFSET);

        if (current) {
          return window.scrollY > hideAt;
        }

        return window.scrollY >= showAt;
      });
    }
    function onResize() {
      globalHeaderHeight = getGlobalHeaderHeight();
      onScroll();
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);
  return isVisible;
}
