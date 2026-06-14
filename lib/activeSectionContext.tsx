'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useActiveSection } from '@/lib/useActiveSection';

// null = provider 不在。provider 配下では useActiveSection の戻り値（string）が入る。
const ActiveSectionContext = createContext<string | null>(null);

interface ActiveSectionProviderProps {
  ids: readonly string[];
  children: ReactNode;
}

/**
 * 同一ページで複数コンポーネント（TOCハイライトと関連サイドバーreveal等）が
 * 同じ section 群の active 状態を見るとき、scrollspy 計算を1回に集約する。
 */
export function ActiveSectionProvider({ ids, children }: ActiveSectionProviderProps) {
  const activeId = useActiveSection(ids);
  return (
    <ActiveSectionContext.Provider value={activeId}>
      {children}
    </ActiveSectionContext.Provider>
  );
}

interface UseSharedActiveSectionOptions {
  enabled?: boolean;
}

/**
 * provider 配下なら共有 activeId を返す。provider が無ければ自前で算出する（後方互換）。
 * `enabled` は provider 不在時のフォールバック計算にのみ効く。
 */
export function useSharedActiveSection(
  ids: readonly string[],
  options: UseSharedActiveSectionOptions = {},
): string {
  const shared = useContext(ActiveSectionContext);
  const local = useActiveSection(ids, {
    enabled: shared === null && (options.enabled ?? true),
  });
  return shared ?? local;
}
