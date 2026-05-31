'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Star, X } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ComparisonRobotPanel } from '@/components/ComparisonRobotPanel';
import { FavoriteCard } from '@/components/FavoriteCard';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import type { Manufacturer, Robot } from '@/data/types';
import { uiText } from '@/lib/uiText';
import { useUrlFilters } from '@/lib/useUrlFilters';

import { useFavorites } from '@/lib/useFavorites';

interface CompareClientProps {
  robots: Robot[];
  manufacturers: Manufacturer[];
}

export function CompareClient({ robots, manufacturers }: CompareClientProps) {
  const { getParam, updateParams } = useUrlFilters();
  const { favorites, toggleFavorite, isMounted } = useFavorites();
  const [expandedManufacturers, setExpandedManufacturers] = useState<string[]>([]);

  // URL parameters for selected robots (e.g., ?compare=slug1,slug2)
  const compareParam = getParam('compare');
  const selectedSlugs = useMemo(() => {
    if (!compareParam) return [];
    // Strict validation: Only return slugs that exist in the robots array
    const validSlugs = new Set(robots.map(r => r.slug));
    return compareParam.split(',').filter(slug => validSlugs.has(slug));
  }, [compareParam, robots]);

  // URL parameter for view mode
  const viewModeParam = getParam('view');
  const viewMode = viewModeParam === 'detailed' ? 'detailed' : 'simple';

  const selectedRobots = useMemo(
    () => robots.filter((r) => selectedSlugs.includes(r.slug)),
    [robots, selectedSlugs],
  );
  const favoriteRobots = useMemo(
    () => robots.filter((r) => favorites.includes(r.slug)),
    [robots, favorites],
  );

  const manufacturerFor = (slug: string) => manufacturers.find((m) => m.slug === slug);

  const addRobot = (slug: string) => {
    if (selectedSlugs.length < 9 && !selectedSlugs.includes(slug)) {
      const nextSlugs = [...selectedSlugs, slug];
      updateParams({ compare: nextSlugs.join(',') }, 'replace');
    }
  };

  const removeRobot = (slug: string) => {
    const nextSlugs = selectedSlugs.filter((s) => s !== slug);
    updateParams({ compare: nextSlugs.length > 0 ? nextSlugs.join(',') : null }, 'replace');
  };

  const clearAll = () => {
    updateParams({ compare: null }, 'replace');
  };

  const toggleManufacturer = (slug: string) => {
    if (expandedManufacturers.includes(slug)) {
      setExpandedManufacturers(expandedManufacturers.filter((s) => s !== slug));
    } else {
      setExpandedManufacturers([...expandedManufacturers, slug]);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1800px] px-4 py-8 sm:px-6 sm:py-12">
        <Breadcrumbs items={[{ label: uiText.compare.breadcrumb }]} />

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">{uiText.compare.title}</h1>
          <p className="text-sm text-neutral-600 max-w-3xl">
            左のメニューから機種を選んで比較します。右パネルで気になる機種をお気に入り登録できます。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[16rem_minmax(0,1fr)_16rem]">
          {/* Left Sidebar - Manufacturer Menu */}
          <div className="min-w-0">
            <div className="border border-neutral-300 bg-neutral-50 xl:sticky xl:top-6">
              <div className="px-4 py-3 border-b border-neutral-300 bg-white">
                <h2 className="text-xs font-semibold text-neutral-900">
                  {uiText.compare.manufacturers}
                </h2>
              </div>
              <div className="divide-y divide-neutral-300 max-h-80 overflow-y-auto overscroll-contain xl:max-h-[calc(100vh-200px)]">
                {manufacturers.map((manufacturer) => {
                  const manufacturerRobots = robots.filter(
                    (r) => r.manufacturerSlug === manufacturer.slug,
                  );
                  const isExpanded = expandedManufacturers.includes(manufacturer.slug);

                  return (
                    <div key={manufacturer.slug}>
                      <button
                        type="button"
                        aria-label={uiText.comparison.toggleAria(manufacturer.nameJa ?? manufacturer.name, isExpanded)}
                        aria-expanded={isExpanded}
                        onClick={() => toggleManufacturer(manufacturer.slug)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-100 transition-colors text-left"
                      >
                        <ManufacturerLogoName
                          name={manufacturer.nameJa ?? manufacturer.name}
                          logo={manufacturer.logo}
                          className="text-sm font-medium text-neutral-900"
                          frameClassName="h-5 w-5"
                          imageClassName="h-4 w-4"
                        />
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-neutral-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-neutral-500" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="bg-white border-t border-neutral-200">
                          {manufacturerRobots.map((robot) => {
                            const isSelected = selectedSlugs.includes(robot.slug);
                            return (
                              <button
                                type="button"
                                key={robot.slug}
                                aria-label={isSelected ? uiText.comparison.removeAria(robot.nameJa ?? robot.name) : uiText.comparison.addAria(robot.nameJa ?? robot.name)}
                                aria-pressed={isSelected}
                                onClick={() =>
                                  isSelected ? removeRobot(robot.slug) : addRobot(robot.slug)
                                }
                                disabled={!isSelected && selectedSlugs.length >= 9}
                                className="w-full px-6 py-2 text-left text-xs hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-between group"
                              >
                                <span
                                  className={
                                    isSelected
                                      ? 'text-neutral-900 font-medium'
                                      : 'text-neutral-700'
                                  }
                                >
                                  {robot.nameJa ?? robot.name}
                                </span>
                                {isSelected && (
                                  <X className="w-3 h-3 text-neutral-400 group-hover:text-neutral-900" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content - Comparison Sheet */}
          <div className="min-w-0">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-neutral-500">
                {uiText.compare.comparisonSheet(selectedSlugs.length, 9)}
              </span>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Accessible Segmented Control for View Mode */}
                <fieldset className="flex items-center bg-neutral-100 p-1 rounded-sm border border-neutral-200">
                  <legend className="sr-only">表示モード</legend>
                  <label className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="viewMode"
                      value="simple"
                      checked={viewMode === 'simple'}
                      onChange={() => updateParams({ view: null }, 'replace')}
                      className="sr-only peer"
                    />
                    <span className="block px-3 py-1 text-xs font-medium text-neutral-500 peer-checked:bg-white peer-checked:text-neutral-900 peer-checked:shadow-sm rounded-sm transition-all">
                      {uiText.comparison.viewModeSimple}
                    </span>
                  </label>
                  <label className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="viewMode"
                      value="detailed"
                      checked={viewMode === 'detailed'}
                      onChange={() => updateParams({ view: 'detailed' }, 'replace')}
                      className="sr-only peer"
                    />
                    <span className="block px-3 py-1 text-xs font-medium text-neutral-500 peer-checked:bg-white peer-checked:text-neutral-900 peer-checked:shadow-sm rounded-sm transition-all">
                      {uiText.comparison.viewModeDetailed}
                    </span>
                  </label>
                </fieldset>

                {selectedSlugs.length > 0 && (
                  <button
                    type="button"
                    aria-label={uiText.comparison.clearAria}
                    onClick={clearAll}
                    className="text-xs text-neutral-500 hover:text-neutral-900"
                  >
                    {uiText.common.clearAll}
                  </button>
                )}
              </div>
            </div>

            {selectedRobots.length === 0 ? (
              <div className="flex min-h-[22rem] items-center justify-center border border-neutral-300 bg-neutral-50 p-8 text-center sm:p-16">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      aria-hidden="true"
                      className="w-8 h-8 text-neutral-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-2">
                    {uiText.comparison.emptyTitle}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {uiText.comparison.emptyDescription}
                  </p>
                </div>
              </div>
            ) : (
              <div className="border border-neutral-300 bg-neutral-50 p-3 sm:p-4">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {selectedRobots.map((robot) => {
                    const manufacturer = manufacturerFor(robot.manufacturerSlug);
                    return (
                      <ComparisonRobotPanel
                        key={robot.slug}
                        robot={robot}
                        manufacturerName={manufacturer?.name ?? robot.manufacturerSlug}
                        manufacturerLogo={manufacturer?.logo}
                        isFavorite={isMounted ? favorites.includes(robot.slug) : false}
                        onFavoriteToggle={toggleFavorite}
                        onRemove={removeRobot}
                        viewMode={viewMode}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Favorites */}
          <div className="min-w-0">
            <div className="border border-neutral-300 bg-neutral-50 xl:sticky xl:top-6">
              <div className="px-4 py-3 border-b border-neutral-300 bg-white flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <h2 className="text-xs font-semibold text-neutral-900">
                  {uiText.compare.favorites}
                </h2>
              </div>
              <div className="p-4 max-h-80 overflow-y-auto overscroll-contain xl:max-h-[calc(100vh-200px)]">
                {!isMounted ? (
                  <div className="text-center py-8">
                    {/* Render a skeleton or nothing to prevent FOUC */}
                  </div>
                ) : favoriteRobots.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
                    <p className="text-xs text-neutral-500 mb-1">{uiText.favorites.empty}</p>
                    <p className="text-xs text-neutral-400">
                      {uiText.favorites.emptySub}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {favoriteRobots.map((robot) => {
                      const manufacturer = manufacturerFor(robot.manufacturerSlug);
                      return (
                        <FavoriteCard
                          key={robot.slug}
                          robot={robot}
                          manufacturerName={manufacturer?.name ?? robot.manufacturerSlug}
                          manufacturerLogo={manufacturer?.logo}
                          onRemove={toggleFavorite}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
