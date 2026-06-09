'use client';

import { useMemo } from 'react';
import {
  normalizeReportSectionParam,
  type ReportSectionFilter,
} from '@/lib/reportSections';
import { useUrlFilters } from '@/lib/useUrlFilters';

export function useActiveReportSection(): ReportSectionFilter {
  const { getParam } = useUrlFilters();

  return useMemo(
    () => normalizeReportSectionParam(getParam('section')),
    [getParam],
  );
}
