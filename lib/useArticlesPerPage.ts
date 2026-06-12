'use client';

import { useEffect, useState } from 'react';

const ROWS_PER_PAGE = 3;

// Tailwind breakpoints と grid-cols の対応（ReportsBrowser.tsx のグリッド定義と同期すること）
function getColsForViewport(width: number): number {
  if (width >= 1536) return 5; // 2xl: grid-cols-5
  if (width >= 1280) return 4; // xl:  grid-cols-4
  if (width >= 1024) return 3; // lg:  grid-cols-3
  if (width >= 640)  return 2; // sm:  grid-cols-2
  return 1;
}

export function useArticlesPerPage(): number {
  const [perPage, setPerPage] = useState(ROWS_PER_PAGE * 4); // SSR/初期値: xl想定

  useEffect(() => {
    const update = () => setPerPage(getColsForViewport(window.innerWidth) * ROWS_PER_PAGE);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return perPage;
}
