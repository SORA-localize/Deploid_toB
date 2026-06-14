'use client';

import { useEffect, useMemo, useState } from 'react';

const PAGE_BOTTOM_TOLERANCE = 2;

function getScrollMarginTop(element: HTMLElement) {
  const scrollMarginTop = Number.parseFloat(getComputedStyle(element).scrollMarginTop);
  return Number.isFinite(scrollMarginTop) ? scrollMarginTop : 0;
}

function resolveActiveSectionId(ids: readonly string[]) {
  const elements = ids
    .map((id) => document.getElementById(id))
    .filter((element): element is HTMLElement => element !== null);

  if (elements.length === 0) {
    return ids[0] ?? '';
  }

  // Anchorクリック時の停止位置と同じCSS scroll-margin-topをactive判定の基準にする。
  const offset = getScrollMarginTop(elements[0]);
  const activationLine = offset + 1;
  let nextActiveId = elements[0].id;

  for (const element of elements) {
    if (element.getBoundingClientRect().top <= activationLine) {
      nextActiveId = element.id;
      continue;
    }

    break;
  }

  // ページ最下部到達時、かつ通常ロジックがまだ先頭IDしか選んでいない（= どの section も
  // activation line を通過していない）場合のみ末尾IDに fallback する。
  // 途中の section（関連情報など）を activation line が通過した後に最下部に到達した場合は
  // 通常ロジックの nextActiveId を優先し、誤って sources が active になるのを防ぐ。
  const viewportBottom = window.scrollY + window.innerHeight;
  const documentBottom = document.documentElement.scrollHeight;
  if (
    viewportBottom >= documentBottom - PAGE_BOTTOM_TOLERANCE &&
    nextActiveId === (elements[0]?.id ?? '')
  ) {
    return ids[ids.length - 1] ?? nextActiveId;
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

    let rafId: number | null = null;

    const updateActiveId = () => {
      rafId = null;
      setActiveId(resolveActiveSectionId(ids));
    };

    const requestUpdate = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(updateActiveId);
    };

    const handleResize = () => {
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
