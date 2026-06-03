'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { ChevronDown, ChevronRight, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import {
  CompareDragOverlayCard,
  CompareDroppableArea,
  CompareInsertionPreviewCard,
  DraggableFavoriteCard,
  DraggableMenuRobotButton,
} from '@/components/compare/CompareParts';
import { ComparisonRobotPanel } from '@/components/ComparisonRobotPanel';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import { SortableCompareCard } from '@/components/SortableCompareCard';
import type { Manufacturer, Robot } from '@/data/types';
import {
  compareCollisionDetection,
  compareColumnIds,
  getDndItemId,
  getDropData,
  getRobotDragData,
  type CompareDropData,
  type CompareDropTarget,
  type CompareRobotDragData,
} from '@/lib/compare/dnd';
import { uiText } from '@/lib/uiText';
import { useUrlFilters } from '@/lib/useUrlFilters';
import { useFavorites } from '@/lib/useFavorites';
import { cn } from '@/lib/utils';

const MAX_COMPARE_ROBOTS = 9;
const SHEET_LAYOUT_TRANSITION = { type: 'spring', stiffness: 360, damping: 34 } as const;

interface CompareClientProps {
  robots: Robot[];
  manufacturers: Manufacturer[];
}

interface SheetPreviewPlacement {
  slug: string;
  index: number;
}

type SheetPreviewItem =
  | { type: 'robot'; robot: Robot }
  | { type: 'preview'; robot: Robot };

export function CompareClient({ robots, manufacturers }: CompareClientProps) {
  const { getParam, updateParams } = useUrlFilters();
  const { favorites, toggleFavorite, isMounted } = useFavorites();
  const [expandedManufacturers, setExpandedManufacturers] = useState<string[]>([]);
  const [activeDrag, setActiveDrag] = useState<CompareRobotDragData | null>(null);
  const [activeDropTarget, setActiveDropTarget] = useState<CompareDropTarget | null>(null);
  const [sheetPreview, setSheetPreview] = useState<SheetPreviewPlacement | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const compareParam = getParam('compare');
  const urlSelectedSlugs = useMemo(() => {
    if (!compareParam) return [];
    const validSlugs = new Set(robots.map((robot) => robot.slug));
    const seen = new Set<string>();

    return compareParam
      .split(',')
      .map((slug) => slug.trim())
      .filter((slug) => {
        if (!validSlugs.has(slug) || seen.has(slug)) return false;
        seen.add(slug);
        return true;
      })
      .slice(0, MAX_COMPARE_ROBOTS);
  }, [compareParam, robots]);

  // 並べ替え順の真実源はこの local state。URL は commitOrder で副作用同期する。
  // こうしないと onDragEnd 時に URL 遷移(非同期)を待つ間、dnd-kit が一旦
  // 元の順序へ戻してから整列し直すため、ドロップ時に「元位置へ戻る」違和感が出る。
  const [orderedSlugs, setOrderedSlugs] = useState<string[]>(urlSelectedSlugs);
  useEffect(() => {
    // 共有リンク/戻る・進む等で URL が外部から変わった時だけ local を追従させる。
    // 自分の操作で書き換えた場合は値が一致するので no-op。
    setOrderedSlugs((prev) =>
      prev.join(',') === urlSelectedSlugs.join(',') ? prev : urlSelectedSlugs,
    );
  }, [urlSelectedSlugs]);

  const robotBySlug = useMemo(
    () => new Map(robots.map((robot) => [robot.slug, robot])),
    [robots],
  );
  const selectedRobots = useMemo(
    () =>
      orderedSlugs.flatMap((slug) => {
        const robot = robotBySlug.get(slug);
        return robot ? [robot] : [];
      }),
    [robotBySlug, orderedSlugs],
  );
  const favoriteRobots = useMemo(
    () => robots.filter((r) => favorites.includes(r.slug)),
    [robots, favorites],
  );
  const sheetItemIds = useMemo(
    () => orderedSlugs.map((slug) => getDndItemId('sheet', slug)),
    [orderedSlugs],
  );
  const sheetPreviewItems = useMemo<SheetPreviewItem[]>(() => {
    const baseItems: SheetPreviewItem[] = selectedRobots.map((robot) => ({ type: 'robot', robot }));
    if (!sheetPreview) return baseItems;

    const previewRobot = robotBySlug.get(sheetPreview.slug);
    if (!previewRobot) return baseItems;

    const nextItems = [...baseItems];
    const previewIndex = Math.max(0, Math.min(sheetPreview.index, nextItems.length));
    nextItems.splice(previewIndex, 0, { type: 'preview', robot: previewRobot });
    return nextItems;
  }, [robotBySlug, selectedRobots, sheetPreview]);

  // 挿入プレビュー中だけ Framer Motion の layout を有効化する。
  // シート内の並べ替えは dnd-kit が transform で整列アニメを担うため、
  // ここで layout を併用すると同じカードを二重にアニメートしてガクつく。
  const isInsertionPreviewing = sheetPreview !== null;

  const manufacturerFor = (slug: string) => manufacturers.find((m) => m.slug === slug);
  const activeDragRobot = activeDrag ? robotBySlug.get(activeDrag.slug) : undefined;
  const activeDragManufacturer = activeDragRobot
    ? manufacturerFor(activeDragRobot.manufacturerSlug)
    : undefined;

  // 並び順を local state へ即時反映し、URL も同じ値へ同期する(共有・履歴用)。
  const commitOrder = (nextSlugs: string[], mode: 'push' | 'replace' = 'push') => {
    setOrderedSlugs(nextSlugs);
    updateParams({ compare: nextSlugs.length > 0 ? nextSlugs.join(',') : null }, mode);
  };

  const addRobot = (slug: string) => {
    if (orderedSlugs.length >= MAX_COMPARE_ROBOTS || orderedSlugs.includes(slug)) return false;

    commitOrder([...orderedSlugs, slug]);
    return true;
  };

  const insertRobot = (slug: string, index?: number) => {
    if (orderedSlugs.length >= MAX_COMPARE_ROBOTS || orderedSlugs.includes(slug)) return false;

    const insertIndex =
      typeof index === 'number'
        ? Math.max(0, Math.min(index, orderedSlugs.length))
        : orderedSlugs.length;
    const nextSlugs = [...orderedSlugs];
    nextSlugs.splice(insertIndex, 0, slug);
    commitOrder(nextSlugs);
    return true;
  };

  const highlightRobot = (slug: string) => {
    const el = document.getElementById(`compare-card-${slug}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    el.classList.add('ring-2', 'ring-ring', 'ring-offset-2');
    setTimeout(() => el.classList.remove('ring-2', 'ring-ring', 'ring-offset-2'), 1500);
  };

  const handleFavoriteSelect = (slug: string) => {
    if (!orderedSlugs.includes(slug)) {
      if (addRobot(slug)) {
        setTimeout(() => highlightRobot(slug), 100);
      }
    } else {
      highlightRobot(slug);
    }
  };

  const removeRobot = (slug: string) => {
    commitOrder(orderedSlugs.filter((s) => s !== slug));
  };

  const clearAll = () => {
    commitOrder([]);
  };

  const getSheetPreviewPlacement = (
    activeData: CompareRobotDragData | null,
    dropData: CompareDropData | null,
  ): SheetPreviewPlacement | null => {
    if (!activeData || !dropData || dropData.target !== 'sheet') return null;
    if (activeData.source === 'sheet') return null;
    if (orderedSlugs.includes(activeData.slug)) return null;
    if (orderedSlugs.length >= MAX_COMPARE_ROBOTS) return null;

    const index =
      dropData.dropType === 'sheet-card' ? orderedSlugs.indexOf(dropData.slug) : orderedSlugs.length;
    return {
      slug: activeData.slug,
      index: index >= 0 ? index : orderedSlugs.length,
    };
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveDrag(getRobotDragData(active.data.current));
    setActiveDropTarget(null);
    setSheetPreview(null);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    const activeData = getRobotDragData(active.data.current);
    const dropData = getDropData(over?.data.current);
    setActiveDropTarget(dropData?.target ?? null);
    setSheetPreview((current) => {
      if (
        current &&
        activeData?.slug === current.slug &&
        dropData?.target === 'sheet' &&
        dropData.dropType === 'column'
      ) {
        return current;
      }

      return getSheetPreviewPlacement(activeData, dropData);
    });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const activeData = getRobotDragData(active.data.current);
    const dropData = getDropData(over?.data.current);
    setActiveDrag(null);
    setActiveDropTarget(null);
    setSheetPreview(null);

    if (!activeData || !dropData) return;

    if (
      activeData.source === 'sheet' &&
      dropData.dropType === 'sheet-card' &&
      activeData.slug !== dropData.slug
    ) {
      const oldIndex = orderedSlugs.indexOf(activeData.slug);
      const newIndex = orderedSlugs.indexOf(dropData.slug);
      if (oldIndex < 0 || newIndex < 0) return;

      commitOrder(arrayMove(orderedSlugs, oldIndex, newIndex), 'replace');
      return;
    }

    if (dropData.target === 'sheet') {
      if (activeData.source === 'sheet') return;
      if (orderedSlugs.includes(activeData.slug)) {
        highlightRobot(activeData.slug);
        return;
      }

      const insertIndex =
        dropData.dropType === 'sheet-card' ? orderedSlugs.indexOf(dropData.slug) : undefined;
      const normalizedInsertIndex =
        typeof insertIndex === 'number' && insertIndex >= 0 ? insertIndex : undefined;
      if (insertRobot(activeData.slug, normalizedInsertIndex)) {
        setTimeout(() => highlightRobot(activeData.slug), 100);
      }
      return;
    }

    if (dropData.target === 'menu' && activeData.source === 'sheet') {
      removeRobot(activeData.slug);
      return;
    }

    if (dropData.target === 'favorite' && activeData.source === 'sheet') {
      if (!favorites.includes(activeData.slug)) {
        toggleFavorite(activeData.slug);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveDrag(null);
    setActiveDropTarget(null);
    setSheetPreview(null);
  };

  const toggleManufacturer = (slug: string) => {
    if (expandedManufacturers.includes(slug)) {
      setExpandedManufacturers(expandedManufacturers.filter((s) => s !== slug));
    } else {
      setExpandedManufacturers([...expandedManufacturers, slug]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1800px] px-4 py-8 sm:px-6 sm:py-12">
        <Breadcrumbs items={[{ label: uiText.compare.breadcrumb }]} />

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-2">{uiText.compare.title}</h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            左のメニューから機種を選んで比較します。右パネルで気になる機種をお気に入り登録できます。
          </p>
        </div>

        <DndContext
          id="compare-three-column"
          sensors={sensors}
          collisionDetection={compareCollisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[16rem_minmax(0,1fr)_16rem]">
            {/* Left Sidebar - Manufacturer Menu */}
            <div className="min-w-0">
              <CompareDroppableArea
                id={compareColumnIds.menu}
                target="menu"
                isHighlighted={activeDropTarget === 'menu'}
              >
                {({ setNodeRef, isActive }) => (
                  <div
                    ref={setNodeRef}
                    className={cn(
                      'border border-border bg-muted transition-[box-shadow,outline-color] duration-200 xl:sticky xl:top-6',
                      isActive && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
                    )}
                  >
                    <div className="px-4 py-3 border-b border-border bg-card">
                      <h2 className="text-xs font-semibold text-foreground">
                        {uiText.compare.manufacturers}
                      </h2>
                    </div>
                    <div className="divide-y divide-border max-h-80 overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden xl:max-h-[calc(100vh-200px)]">
                      {manufacturers.map((manufacturer) => {
                        const manufacturerRobots = robots.filter(
                          (r) => r.manufacturerSlug === manufacturer.slug,
                        );
                        const isExpanded = expandedManufacturers.includes(manufacturer.slug);

                        return (
                          <div key={manufacturer.slug}>
                            <button
                              type="button"
                              aria-label={uiText.comparison.toggleAria(
                                manufacturer.nameJa ?? manufacturer.name,
                                isExpanded,
                              )}
                              aria-expanded={isExpanded}
                              onClick={() => toggleManufacturer(manufacturer.slug)}
                              className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted transition-colors text-left"
                            >
                              <ManufacturerLogoName
                                name={manufacturer.nameJa ?? manufacturer.name}
                                logo={manufacturer.logo}
                                className="text-sm font-medium text-foreground"
                                frameClassName="h-5 w-5"
                                imageClassName="h-4 w-4"
                              />
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                            {isExpanded && (
                              <div className="bg-card border-t border-border">
                                {manufacturerRobots.map((robot) => {
                                  const isSelected = orderedSlugs.includes(robot.slug);
                                  const isDisabled =
                                    !isSelected && orderedSlugs.length >= MAX_COMPARE_ROBOTS;
                                  return (
                                    <DraggableMenuRobotButton
                                      key={robot.slug}
                                      robot={robot}
                                      isSelected={isSelected}
                                      isDisabled={isDisabled}
                                      onClick={() =>
                                        isSelected ? removeRobot(robot.slug) : addRobot(robot.slug)
                                      }
                                    />
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CompareDroppableArea>
            </div>

            {/* Main Content - Comparison Sheet */}
            <div className="min-w-0">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-muted-foreground">
                  {uiText.compare.comparisonSheet(orderedSlugs.length, MAX_COMPARE_ROBOTS)}
                </span>
                {orderedSlugs.length > 0 && (
                  <button
                    type="button"
                    aria-label={uiText.comparison.clearAria}
                    onClick={clearAll}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {uiText.common.clearAll}
                  </button>
                )}
              </div>

              <CompareDroppableArea
                id={compareColumnIds.sheet}
                target="sheet"
                isHighlighted={activeDropTarget === 'sheet'}
              >
                {({ setNodeRef, isActive }) =>
                  selectedRobots.length === 0 && !sheetPreview ? (
                    <div
                      ref={setNodeRef}
                      className={cn(
                        'flex min-h-[22rem] items-center justify-center border border-border bg-muted p-8 text-center transition-[box-shadow,outline-color] duration-200 sm:p-16',
                        isActive && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
                      )}
                    >
                      <div className="max-w-md mx-auto">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg
                            aria-hidden="true"
                            className="w-8 h-8 text-muted-foreground/70"
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
                        <h3 className="text-sm font-semibold text-foreground mb-2">
                          {uiText.comparison.emptyTitle}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {uiText.comparison.emptyDescription(MAX_COMPARE_ROBOTS)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div
                      ref={setNodeRef}
                      className={cn(
                        'border border-border bg-muted p-3 transition-[box-shadow,outline-color] duration-200 sm:p-4',
                        isActive && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
                      )}
                    >
                      <SortableContext items={sheetItemIds} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          {sheetPreviewItems.map((item) => {
                            if (item.type === 'preview') {
                              const manufacturer = manufacturerFor(item.robot.manufacturerSlug);
                              return (
                                <motion.div
                                  key={`sheet-preview-${item.robot.slug}`}
                                  layout
                                  initial={{ opacity: 0, scale: 0.96 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={SHEET_LAYOUT_TRANSITION}
                                  className="h-full"
                                >
                                  <CompareInsertionPreviewCard
                                    robot={item.robot}
                                    manufacturerName={manufacturer?.name ?? item.robot.manufacturerSlug}
                                    manufacturerLogo={manufacturer?.logo}
                                  />
                                </motion.div>
                              );
                            }

                            const { robot } = item;
                            const manufacturer = manufacturerFor(robot.manufacturerSlug);
                            return (
                              <motion.div
                                key={robot.slug}
                                layout={isInsertionPreviewing}
                                transition={SHEET_LAYOUT_TRANSITION}
                                className="h-full"
                              >
                                <SortableCompareCard
                                  slug={robot.slug}
                                  id={getDndItemId('sheet', robot.slug)}
                                  data={{
                                    type: 'robot',
                                    source: 'sheet',
                                    target: 'sheet',
                                    dropType: 'sheet-card',
                                    slug: robot.slug,
                                  }}
                                >
                                  {(dragHandleProps) => (
                                    <ComparisonRobotPanel
                                      robot={robot}
                                      manufacturerName={manufacturer?.name ?? robot.manufacturerSlug}
                                      manufacturerLogo={manufacturer?.logo}
                                      isFavorite={
                                        isMounted ? favorites.includes(robot.slug) : false
                                      }
                                      onFavoriteToggle={toggleFavorite}
                                      onRemove={removeRobot}
                                      dragHandleProps={dragHandleProps}
                                    />
                                  )}
                                </SortableCompareCard>
                              </motion.div>
                            );
                          })}
                        </div>
                      </SortableContext>
                    </div>
                  )
                }
              </CompareDroppableArea>
            </div>

            {/* Right Sidebar - Favorites */}
            <div className="min-w-0">
              <CompareDroppableArea
                id={compareColumnIds.favorite}
                target="favorite"
                isHighlighted={activeDropTarget === 'favorite'}
              >
                {({ setNodeRef, isActive }) => (
                  <div
                    ref={setNodeRef}
                    className={cn(
                      'border border-border bg-muted transition-[box-shadow,outline-color] duration-200 xl:sticky xl:top-6',
                      isActive && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
                    )}
                  >
                    <div className="px-4 py-3 border-b border-border bg-card flex items-center gap-2">
                      <Star className="w-4 h-4 text-favorite" />
                      <h2 className="text-xs font-semibold text-foreground">
                        {uiText.compare.favorites}
                      </h2>
                    </div>
                    <div className="p-4 max-h-80 overflow-y-auto overscroll-contain xl:max-h-[calc(100vh-200px)]">
                      {!isMounted ? (
                        <div className="text-center py-8" aria-hidden="true" />
                      ) : favoriteRobots.length === 0 ? (
                        <div className="text-center py-8">
                          <Star className="w-8 h-8 text-muted-foreground/70 mx-auto mb-3" />
                          <p className="text-xs text-muted-foreground mb-1">
                            {uiText.favorites.empty}
                          </p>
                          <p className="text-xs text-muted-foreground/70">
                            {uiText.favorites.emptySub}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {favoriteRobots.map((robot) => {
                            const manufacturer = manufacturerFor(robot.manufacturerSlug);
                            return (
                              <DraggableFavoriteCard
                                key={robot.slug}
                                robot={robot}
                                manufacturerName={manufacturer?.name ?? robot.manufacturerSlug}
                                manufacturerLogo={manufacturer?.logo}
                                onRemove={toggleFavorite}
                                onSelect={handleFavoriteSelect}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CompareDroppableArea>
            </div>
          </div>

          {/*
            持ち上げ中のカードを描画する層。元カードは SortableCompareCard 側で
            薄いプレースホルダとして残り、着地点を示す。
            - シート内並べ替え(source='sheet'): 実物大の忠実なカードを持ち上げる
              (ミニカードが別々に飛ぶ違和感を避けるため)。DragOverlay は元ノードと
              同じ寸法で描画されるので h-full のパネルがそのまま収まる。
            - メニュー/お気に入りからの挿入: リスト行を掴む場面なので小カード。
          */}
          <DragOverlay>
            {activeDrag && activeDragRobot ? (
              activeDrag.source === 'sheet' ? (
                <div className="h-full shadow-2xl">
                  <ComparisonRobotPanel
                    robot={activeDragRobot}
                    manufacturerName={activeDragManufacturer?.name ?? activeDragRobot.manufacturerSlug}
                    manufacturerLogo={activeDragManufacturer?.logo}
                    isFavorite={isMounted ? favorites.includes(activeDragRobot.slug) : false}
                    onFavoriteToggle={() => {}}
                    onRemove={() => {}}
                  />
                </div>
              ) : (
                <CompareDragOverlayCard
                  robot={activeDragRobot}
                  manufacturerName={activeDragManufacturer?.name ?? activeDragRobot.manufacturerSlug}
                  manufacturerLogo={activeDragManufacturer?.logo}
                />
              )
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
