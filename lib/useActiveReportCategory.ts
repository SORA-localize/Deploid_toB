'use client';

import { useMemo } from 'react';
import {
  normalizeReportCategoryParam,
  type ReportCategoryFilter,
} from '@/lib/reportCategories';
import { useUrlFilters } from '@/lib/useUrlFilters';

export function useActiveReportCategory(): ReportCategoryFilter {
  const { getParam } = useUrlFilters();

  return useMemo(
    () => normalizeReportCategoryParam(getParam('category')),
    [getParam],
  );
}
