'use client';

import { useMemo } from 'react';
import {
  normalizeArticleSectionParam,
  type ArticleSectionFilter,
} from '@/lib/articleSections';
import { useUrlFilters } from '@/lib/useUrlFilters';

export function useActiveArticleSection(): ArticleSectionFilter {
  const { getParam } = useUrlFilters();

  return useMemo(
    () => normalizeArticleSectionParam(getParam('section')),
    [getParam],
  );
}
