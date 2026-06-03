'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
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
import { ChevronDown, ChevronRight, Star, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ComparisonRobotPanel } from '@/components/ComparisonRobotPanel';
import { FavoriteCard } from '@/components/FavoriteCard';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import { SortableCompareCard } from '@/components/SortableCompareCard';
import type { Manufacturer, Robot } from '@/data/types';
import { uiText } from '@/lib/uiText';
import { useUrlFilters } from '@/lib/useUrlFilters';
import { useFavorites } from '@/lib/useFavorites';
import { cn } from '@/lib/utils';

const MAX_COMPARE_ROBOTS = 9;

type CompareDragSource = 'menu' | 'sheet' | 'favorite';
type CompareDropTarget = 'menu' | 'sheet' | 'favorite';

interface CompareRobotDragData extends Record<string, unknown> {
  type: 'robot';
  slug: string;
  source: CompareDragSource;
  target?: CompareDropTarget;
  dropType?: 'sheet-card';
}

interface CompareColumnDropData extends Record<string, unknown> {
  type: 'column';
  target: CompareDropTarget;
  dropType: 'column';
}

type CompareDropData =
  | { target: CompareDropTarget; dropType: 'column'; slug?: undefined }
  | { target: CompareDropTarget; dropType: 'sheet-card'; slug: string };

const compareColumnIds = {
  menu: 'menu-column',
  sheet: 'sheet-column',
  favorite: 'fav-column',
} as const satisfies Record<CompareDropTarget, string>;

const dndPrefixBySource = {
  menu: 'menu',
  sheet: 'sheet',
  favorite: 'fav',
} as const satisfies Record<CompareDragSource, string>;

function getDndItemId(source: CompareDragSource, slug: string) {
  return `${dndPrefixBySource[source]}-${slug}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getRobotDragData(value: unknown): CompareRobotDragData | null {
  if (!isRecord(value)) return null;
  if (value.type !== 'robot') return null;
  if (typeof value.slug !== 'string') return null;
  if (value.source !== 'menu' && value.source !== 'sheet' && value.source !== 'favorite') {
    return null;
  }

  return {
    type: 'robot',
    slug: value.slug,
    source: value.source,
    target:
      value.target === 'menu' || value.target === 'sheet' || value.target === 'favorite'
        ? value.target
        : undefined,
    dropType: value.dropType === 'sheet-card' ? value.dropType : undefined,
  };
}

function getDropData(value: unknown): CompareDropData | null {
  if (!isRecord(value)) return null;

  if (
    value.type === 'column' &&
    value.dropType === 'column' &&
    (value.target === 'menu' || value.target === 'sheet' || value.target === 'favorite')
  ) {
    return { target: value.target, dropType: 'column' };
  }

  if (
    value.type === 'robot' &&
    value.dropType === 'sheet-card' &&
    value.target === 'sheet' &&
    typeof value.slug === 'string'
  ) {
    return { target: 'sheet', dropType: 'sheet-card', slug: value.slug };
  }

  return null;
}

interface CompareClientProps {
  robots: Robot[];
  manufacturers: Manufacturer[];
}

interface CompareDroppableColumnProps {
  id: string;
  target: CompareDropTarget;
  isHighlighted: boolean;
  children: ReactNode;
  className?: string;
}

function CompareDroppableColumn({
  id,
  target,
  isHighlighted,
  children,
  className,
}: CompareDroppableColumnProps) {
  const data: CompareColumnDropData = { type: 'column', target, dropType: 'column' };
  const { setNodeRef, isOver } = useDroppable({ id, data });
  const isActive = isOver || isHighlighted;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-sm transition-[box-shadow,outline-color] duration-200',
        isActive && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface DraggableMenuRobotButtonProps {
  robot: Robot;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

function DraggableMenuRobotButton({
  robot,
  isSelected,
  isDisabled,
  onClick,
}: DraggableMenuRobotButtonProps) {
  const data: CompareRobotDragData = { type: 'robot', source: 'menu', slug: robot.slug };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: getDndItemId('menu', robot.slug),
    data,
    disabled: isDisabled,
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      aria-label={
        isSelected
          ? uiText.comparison.removeAria(robot.nameJa ?? robot.name)
          : uiText.comparison.addAria(robot.nameJa ?? robot.name)
      }
      aria-pressed={isSelected}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'group flex w-full items-center justify-between gap-3 px-6 py-2.5 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        isSelected
          ? 'bg-primary/10 text-foreground hover:bg-primary/15'
          : 'text-foreground/80 hover:bg-muted',
      )}
      style={{ opacity: isDragging ? 0.35 : undefined }}
    >
      <span
        className={cn(
          'min-w-0 flex-1 truncate',
          isSelected ? 'font-semibold text-foreground' : 'text-foreground/80',
        )}
      >
        {robot.nameJa ?? robot.name}
      </span>
      <span className="flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden="true">
        {isSelected && (
          <X className="h-3.5 w-3.5 text-foreground/60 group-hover:text-foreground" />
        )}
      </span>
    </button>
  );
}

interface DraggableFavoriteCardProps {
  robot: Robot;
  manufacturerName?: string;
  manufacturerLogo?: Manufacturer['logo'];
  onRemove: (slug: string) => void;
  onSelect: (slug: string) => void;
}

function DraggableFavoriteCard({
  robot,
  manufacturerName,
  manufacturerLogo,
  onRemove,
  onSelect,
}: DraggableFavoriteCardProps) {
  const data: CompareRobotDragData = { type: 'robot', source: 'favorite', slug: robot.slug };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: getDndItemId('favorite', robot.slug),
    data,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={uiText.comparison.addAria(robot.nameJa ?? robot.name)}
      className={cn('rounded-sm transition-opacity', isDragging && 'opacity-40')}
    >
      <FavoriteCard
        robot={robot}
        manufacturerName={manufacturerName}
        manufacturerLogo={manufacturerLogo}
        onRemove={onRemove}
        onSelect={onSelect}
      />
    </div>
  );
}

interface CompareDragOverlayCardProps {
  robot: Robot;
  manufacturerName?: string;
  manufacturerLogo?: Manufacturer['logo'];
}

function CompareDragOverlayCard({
  robot,
  manufacturerName,
  manufacturerLogo,
}: CompareDragOverlayCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0.85, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1.03 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className="pointer-events-none w-56 rounded-sm border border-ring bg-card p-3 text-card-foreground shadow-2xl"
    >
      <h3 className="truncate text-sm font-semibold" title={robot.nameJa ?? robot.name}>
        {robot.nameJa ?? robot.name}
      </h3>
      <ManufacturerLogoName
        name={manufacturerName ?? robot.manufacturerSlug}
        logo={manufacturerLogo}
        className="mt-1 text-xs text-muted-foreground"
        frameClassName="h-4 w-4 shrink-0"
        imageClassName="h-3 w-3"
      />
    </motion.div>
  );
}

export function CompareClient({ robots, manufacturers }: CompareClientProps) {
  const { getParam, updateParams } = useUrlFilters();
  const { favorites, toggleFavorite, isMounted } = useFavorites();
  const [expandedManufacturers, setExpandedManufacturers] = useState<string[]>([]);
  const [activeDrag, setActiveDrag] = useState<CompareRobotDragData | null>(null);
  const [activeDropTarget, setActiveDropTarget] = useState<CompareDropTarget | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const compareParam = getParam('compare');
  const selectedSlugs = useMemo(() => {
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

  const robotBySlug = useMemo(
    () => new Map(robots.map((robot) => [robot.slug, robot])),
    [robots],
  );
  const selectedRobots = useMemo(
    () =>
      selectedSlugs.flatMap((slug) => {
        const robot = robotBySlug.get(slug);
        return robot ? [robot] : [];
      }),
    [robotBySlug, selectedSlugs],
  );
  const favoriteRobots = useMemo(
    () => robots.filter((r) => favorites.includes(r.slug)),
    [robots, favorites],
  );
  const sheetItemIds = useMemo(
    () => selectedSlugs.map((slug) => getDndItemId('sheet', slug)),
    [selectedSlugs],
  );

  const manufacturerFor = (slug: string) => manufacturers.find((m) => m.slug === slug);
  const activeDragRobot = activeDrag ? robotBySlug.get(activeDrag.slug) : undefined;
  const activeDragManufacturer = activeDragRobot
    ? manufacturerFor(activeDragRobot.manufacturerSlug)
    : undefined;

  const addRobot = (slug: string) => {
    if (selectedSlugs.length >= MAX_COMPARE_ROBOTS || selectedSlugs.includes(slug)) return false;

    const nextSlugs = [...selectedSlugs, slug];
    updateParams({ compare: nextSlugs.join(',') });
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
    if (!selectedSlugs.includes(slug)) {
      if (addRobot(slug)) {
        setTimeout(() => highlightRobot(slug), 100);
      }
    } else {
      highlightRobot(slug);
    }
  };

  const removeRobot = (slug: string) => {
    const nextSlugs = selectedSlugs.filter((s) => s !== slug);
    updateParams({ compare: nextSlugs.length > 0 ? nextSlugs.join(',') : null });
  };

  const clearAll = () => {
    updateParams({ compare: null });
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveDrag(getRobotDragData(active.data.current));
    setActiveDropTarget(null);
  };

  const handleDragOver = ({ over }: DragOverEvent) => {
    const dropData = getDropData(over?.data.current);
    setActiveDropTarget(dropData?.target ?? null);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const activeData = getRobotDragData(active.data.current);
    const dropData = getDropData(over?.data.current);
    setActiveDrag(null);
    setActiveDropTarget(null);

    if (!activeData || !dropData) return;

    if (
      activeData.source === 'sheet' &&
      dropData.dropType === 'sheet-card' &&
      activeData.slug !== dropData.slug
    ) {
      const oldIndex = selectedSlugs.indexOf(activeData.slug);
      const newIndex = selectedSlugs.indexOf(dropData.slug);
      if (oldIndex < 0 || newIndex < 0) return;

      const nextSlugs = arrayMove(selectedSlugs, oldIndex, newIndex);
      updateParams({ compare: nextSlugs.join(',') }, 'replace');
      return;
    }

    if (dropData.target === 'sheet') {
      if (activeData.source === 'sheet') return;
      if (selectedSlugs.includes(activeData.slug)) {
        highlightRobot(activeData.slug);
        return;
      }
      if (addRobot(activeData.slug)) {
        setTimeout(() => highlightRobot(activeData.slug), 100);
      }
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
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[16rem_minmax(0,1fr)_16rem]">
            {/* Left Sidebar - Manufacturer Menu */}
            <CompareDroppableColumn
              id={compareColumnIds.menu}
              target="menu"
              isHighlighted={activeDropTarget === 'menu'}
              className="min-w-0"
            >
              <div className="border border-border bg-muted xl:sticky xl:top-6">
                <div className="px-4 py-3 border-b border-border bg-card">
                  <h2 className="text-xs font-semibold text-foreground">
                    {uiText.compare.manufacturers}
                  </h2>
                </div>
                <div className="divide-y divide-border max-h-80 overflow-y-auto overscroll-contain xl:max-h-[calc(100vh-200px)]">
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
                              const isSelected = selectedSlugs.includes(robot.slug);
                              const isDisabled =
                                !isSelected && selectedSlugs.length >= MAX_COMPARE_ROBOTS;
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
            </CompareDroppableColumn>

            {/* Main Content - Comparison Sheet */}
            <CompareDroppableColumn
              id={compareColumnIds.sheet}
              target="sheet"
              isHighlighted={activeDropTarget === 'sheet'}
              className="min-w-0"
            >
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-muted-foreground">
                  {uiText.compare.comparisonSheet(selectedSlugs.length, MAX_COMPARE_ROBOTS)}
                </span>
                {selectedSlugs.length > 0 && (
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

              {selectedRobots.length === 0 ? (
                <div className="flex min-h-[22rem] items-center justify-center border border-border bg-muted p-8 text-center sm:p-16">
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
                <div className="border border-border bg-muted p-3 sm:p-4">
                  <SortableContext items={sheetItemIds} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {selectedRobots.map((robot) => {
                        const manufacturer = manufacturerFor(robot.manufacturerSlug);
                        return (
                          <SortableCompareCard
                            key={robot.slug}
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
                                isFavorite={isMounted ? favorites.includes(robot.slug) : false}
                                onFavoriteToggle={toggleFavorite}
                                onRemove={removeRobot}
                                dragHandleProps={dragHandleProps}
                              />
                            )}
                          </SortableCompareCard>
                        );
                      })}
                    </div>
                  </SortableContext>
                </div>
              )}
            </CompareDroppableColumn>

            {/* Right Sidebar - Favorites */}
            <CompareDroppableColumn
              id={compareColumnIds.favorite}
              target="favorite"
              isHighlighted={activeDropTarget === 'favorite'}
              className="min-w-0"
            >
              <div className="border border-border bg-muted xl:sticky xl:top-6">
                <div className="px-4 py-3 border-b border-border bg-card flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
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
            </CompareDroppableColumn>
          </div>

          <DragOverlay>
            {activeDragRobot ? (
              <CompareDragOverlayCard
                robot={activeDragRobot}
                manufacturerName={activeDragManufacturer?.name ?? activeDragRobot.manufacturerSlug}
                manufacturerLogo={activeDragManufacturer?.logo}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
