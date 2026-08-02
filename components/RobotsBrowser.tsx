'use client';

import { useCallback, useMemo } from 'react';
import { ActiveFilterChips } from '@/components/ActiveFilterChips';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PageListHeader } from '@/components/PageListHeader';
import { EmptyState } from '@/components/EmptyState';
import { PageTabBar, type PageTab } from '@/components/PageTabBar';
import { SelectControl } from '@/components/SelectControl';
import { RobotCard } from '@/components/RobotCard';
import { SearchInput } from '@/components/SearchInput';
import type { RobotCatalogItem } from '@/lib/viewModels/robots';
import { japanAvailabilityLabels } from '@/lib/labels';
import {
  filterRobots,
  getRobotFacetCounts,
  getRobotFilterOptions,
  normalizeRobotFilters,
} from '@/lib/robotFilters';
import { normalizeSearchText } from '@/lib/normalizeSearchText';
import { browserFilterGridClassNames, browserGridClassNames } from '@/lib/catalogLayoutClasses';
import { uiText } from '@/lib/uiText';
import { useCatalogUrlState } from '@/lib/catalog/urlState';
import { useFavorites } from '@/lib/useFavorites';

interface RobotsBrowserProps {
  items: RobotCatalogItem[];
  initialSearch: string;
}

export function RobotsBrowser({ items, initialSearch }: RobotsBrowserProps) {
  const { searchParams, updateParams } = useCatalogUrlState(initialSearch);
  const { favorites, toggleFavorite } = useFavorites();

  const filterOptions = useMemo(() => getRobotFilterOptions(items), [items]);
  const filters = useMemo(
    () =>
      normalizeRobotFilters({
        manufacturer: searchParams.get('manufacturer'),
        availability: searchParams.get('availability'),
        industry: searchParams.get('industry'),
        query: searchParams.get('q'),
        items,
        industryValues: filterOptions.industries.map((option) => option.value),
        availabilityValues: filterOptions.availabilityValues,
      }),
    [searchParams, items, filterOptions],
  );

  // ファセット件数: 選ぶ前に該当数を見せて0件デッドエンドを防ぐ。
  // 0件選択肢は選択不可にするが、選択中の値は解除操作を塞がないよう無効化しない。
  const facetCounts = useMemo(
    () => getRobotFacetCounts({ items, filters }),
    [items, filters],
  );
  const facetOption = useCallback(
    (
      axis: 'manufacturer' | 'availability',
      value: string,
      label: string,
      selected: string | null,
    ) => {
      const count = facetCounts[axis].counts.get(value) ?? 0;
      return { value, label, count, disabled: count === 0 && selected !== value };
    },
    [facetCounts],
  );

  // 業種は最頻の絞り込み軸なのでドロップダウンに隠さず、タブとして常時露出する
  // （用途一覧の産業タブと同じ操作感。部品は汎用 PageTabBar を再利用）。
  const handleIndustrySelect = useCallback(
    (value: string) => updateParams({ industry: value === 'all' ? null : value }),
    [updateParams],
  );
  const industryTabs = useMemo<readonly PageTab<string>[]>(
    () => [
      { value: 'all', label: uiText.common.all },
      ...filterOptions.industries.map((opt) => {
        const count = facetCounts.industry.counts.get(opt.value) ?? 0;
        return {
          value: opt.value,
          label: opt.label,
          count,
          disabled: count === 0 && filters.industry !== opt.value,
        };
      }),
    ],
    [filterOptions.industries, facetCounts.industry, filters.industry],
  );
  const manufacturerOptions = useMemo(() => {
    const nameById = new Map<string, string>();
    items.forEach((item) => nameById.set(item.manufacturer.id, item.manufacturer.name));
    return [
      { value: 'all', label: uiText.common.allManufacturers },
      ...Array.from(nameById.entries())
        .sort(([, aName], [, bName]) => aName.localeCompare(bName, 'en'))
        .map(([id, name]) => facetOption('manufacturer', id, name, filters.manufacturer)),
    ];
  }, [items, facetOption, filters.manufacturer]);
  const availabilityOptions = useMemo(
    () => [
      { value: 'all', label: uiText.common.allStatus },
      ...filterOptions.availabilityValues.map((value) =>
        facetOption(
          'availability',
          value,
          japanAvailabilityLabels[value as keyof typeof japanAvailabilityLabels],
          filters.availability,
        ),
      ),
    ],
    [filterOptions.availabilityValues, facetOption, filters.availability],
  );

  const { activeRobots, preReleaseRobots } = useMemo(
    () => filterRobots({ items, filters }),
    [items, filters],
  );
  const hasActiveFilters =
    normalizeSearchText(filters.query) !== '' ||
    filters.industry !== null ||
    filters.manufacturer !== 'all' ||
    filters.availability !== 'all';
  const resultCount = activeRobots.length + preReleaseRobots.length;
  const leadingImageItemId = [...activeRobots, ...preReleaseRobots].find((item) => item.image)?.id;

  // 業種はタブでアクティブ表示されるため、チップからは外す（二重表示防止）。
  const activeChips = useMemo(() => {
    const chips: import('@/components/ActiveFilterChips').ActiveFilterChip[] = [];
    if (filters.manufacturer !== 'all') {
      const label =
        items.find((item) => item.manufacturer.id === filters.manufacturer)?.manufacturer.name ??
        filters.manufacturer;
      chips.push({ key: 'manufacturer', label, onRemove: () => updateParams({ manufacturer: null }) });
    }
    if (filters.availability !== 'all') {
      const label = japanAvailabilityLabels[filters.availability as keyof typeof japanAvailabilityLabels] ?? filters.availability;
      chips.push({ key: 'availability', label, onRemove: () => updateParams({ availability: null }) });
    }
    return chips;
  }, [filters, items, updateParams]);

  const renderRobotGrid = (robotItems: readonly RobotCatalogItem[]) => (
    <div className={browserGridClassNames.robots}>
      {robotItems.map((item) => (
        <RobotCard
          key={item.id}
          item={item}
          showFavorite={true}
          isFavorite={favorites.includes(item.id)}
          onFavoriteToggle={toggleFavorite}
          mobileVisual
          eagerImage={item.id === leadingImageItemId}
        />
      ))}
    </div>
  );

  const renderRobotSection = (title: string, robotItems: readonly RobotCatalogItem[]) => {
    if (robotItems.length === 0) return null;
    return (
      <section className="space-y-3">
        <h2 className="px-1 text-sm font-semibold text-foreground">
          {title}
        </h2>
        {renderRobotGrid(robotItems)}
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="site-container py-5 min-h-[60vh]">
        <Breadcrumbs items={[{ label: uiText.robots.breadcrumb }]} />
        <PageListHeader
          title={uiText.robots.title}
          description={uiText.robots.description}
          action={
            <SearchInput
              value={filters.query}
              onChange={(nextQuery) => updateParams({ q: nextQuery }, 'replace')}
              placeholder={uiText.searchPlaceholders.robots}
            />
          }
        />

        {/* タブ行はミラーを作らず、この要素自体をヘッダー下端で position:sticky 固定する。
            固定中の下影は .page-sticky-tabs の scroll-state クエリ（globals.css）が担う。 */}
        <div className="page-sticky-tabs sticky top-[var(--header-h)] z-[var(--z-page-sticky)] -mx-4 mb-4 bg-background px-4 sm:mx-0 sm:px-0">
          <div className="page-sticky-tabs-inner flex items-center gap-3 border-b border-border">
            <div className="min-w-0 flex-1 overflow-x-auto">
              <PageTabBar
                tabs={industryTabs}
                activeValue={filters.industry ?? 'all'}
                onSelect={handleIndustrySelect}
                ariaLabel={uiText.useCases.industryTabsAriaLabel}
              />
            </div>
            <ActiveFilterChips chips={activeChips} />
          </div>
        </div>

        <div className="xl:flex xl:items-end gap-4 mb-5">
          <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
            <div className={browserFilterGridClassNames.robots}>
              <SelectControl
                id="robot-manufacturer"
                label={uiText.filters.manufacturer}
                value={filters.manufacturer}
                onChange={(v) => updateParams({ manufacturer: v === 'all' ? null : v })}
                options={manufacturerOptions}
                searchable
                className="min-w-48 sm:min-w-0"
              />
              <SelectControl
                id="robot-availability"
                label={uiText.filters.availability}
                value={filters.availability}
                onChange={(v) => updateParams({ availability: v === 'all' ? null : v })}
                options={availabilityOptions}
                className="min-w-40 sm:min-w-0"
              />
            </div>
          </div>
          <p className="mt-3 xl:mt-0 xl:ml-auto shrink-0 whitespace-nowrap px-1 text-xs text-muted-foreground text-right xl:text-left">
            {uiText.common.results(resultCount, hasActiveFilters)}
          </p>
        </div>

        {resultCount === 0 ? (
          <EmptyState
            message={uiText.emptyStates.robots}
            variant="muted"
            size="large"
          />
        ) : (
          <div className="space-y-8">
            {renderRobotSection(uiText.robots.activeSection(activeRobots.length), activeRobots)}
            {renderRobotSection(
              uiText.robots.preReleaseSection(preReleaseRobots.length),
              preReleaseRobots,
            )}
          </div>
        )}
      </div>
    </div>
  );
}
