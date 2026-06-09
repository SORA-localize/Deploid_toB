'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * スクロール位置を監視し、現在ビューポート上部付近にあるセクションIDを返す。
 * IntersectionObserver で rootMargin を使い、ビューポート上部10〜20%のゾーンを検知。
 */
export function useActiveSection(ids: readonly string[]): string {
  const [activeId, setActiveId] = useState(ids[0] ?? '');
  const intersecting = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (ids.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            intersecting.current.add(entry.target.id);
          } else {
            intersecting.current.delete(entry.target.id);
          }
        }
        // ids の順序で最初にヒットしたものをアクティブとする
        const first = ids.find((id) => intersecting.current.has(id));
        if (first) setActiveId(first);
      },
      { rootMargin: '-10% 0px -80% 0px', threshold: 0 },
    );

    ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
      .forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  // ids は静的（データ由来）なので依存配列から除外
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return activeId;
}
