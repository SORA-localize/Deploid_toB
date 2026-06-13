'use client';

import { useEffect, useMemo, useState } from 'react';
import { GLOBAL_HEADER_HEIGHT, GLOBAL_HEADER_HEIGHT_CSS_VARIABLE } from '@/lib/siteLayout';

const STICKY_BAR_HEIGHT_CSS_VARIABLE = '--sticky-bar-h';
const ACTIVE_SECTION_EXTRA_OFFSET = 8;
const STICKY_BAR_HEIGHT_FALLBACK = 40;

function getCssLengthInPixels(variableName: string, fallback: number) {
  const rawValue = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();

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

  return fallback;
}

function getActiveSectionOffset() {
  const globalHeaderHeight = getCssLengthInPixels(
    GLOBAL_HEADER_HEIGHT_CSS_VARIABLE,
    GLOBAL_HEADER_HEIGHT,
  );
  const stickyBarHeight = getCssLengthInPixels(
    STICKY_BAR_HEIGHT_CSS_VARIABLE,
    STICKY_BAR_HEIGHT_FALLBACK,
  );

  return globalHeaderHeight + stickyBarHeight + ACTIVE_SECTION_EXTRA_OFFSET;
}

function resolveActiveSectionId(ids: readonly string[], offset: number) {
  const elements = ids
    .map((id) => document.getElementById(id))
    .filter((element): element is HTMLElement => element !== null);

  if (elements.length === 0) {
    return ids[0] ?? '';
  }

  const activationLine = offset + 1;
  let nextActiveId = elements[0].id;

  for (const element of elements) {
    if (element.getBoundingClientRect().top <= activationLine) {
      nextActiveId = element.id;
      continue;
    }

    break;
  }

  return nextActiveId;
}

export function useActiveSection(ids: readonly string[]): string {
  const idsKey = useMemo(() => ids.join('|'), [ids]);
  const [activeId, setActiveId] = useState(ids[0] ?? '');

  useEffect(() => {
    if (ids.length === 0) {
      setActiveId('');
      return;
    }
    setActiveId(ids[0] ?? '');

    let offset = getActiveSectionOffset();
    let rafId: number | null = null;

    const updateActiveId = () => {
      rafId = null;
      setActiveId(resolveActiveSectionId(ids, offset));
    };

    const requestUpdate = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(updateActiveId);
    };

    const handleResize = () => {
      offset = getActiveSectionOffset();
      requestUpdate();
    };

    updateActiveId();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', handleResize);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [ids, idsKey]);

  return activeId;
}
