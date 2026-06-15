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
import { MAX_COMPARE_ROBOTS } from '@/lib/compareParams';
import { useUrlParamUpdater } from '@/lib/useUrlParamUpdater';
import { useFavorites } from '@/lib/useFavorites';
import { cn } from '@/lib/utils';
import { sortManufacturers, sortRobots } from '@/lib/display';

const SHEET_LAYOUT_TRANSITION = { type: 'spring', stiffness: 360, damping: 34 } as const;

interface CompareClientProps {
  robots: Robot[];
  manufacturers: Manufacturer[];
  selectedIds: string[];
}

interface SheetPreviewPlacement {
  id: string;
  index: number;
}

type SheetPreviewItem =
  | { type: 'robot'; robot: Robot }
  | { type: 'preview'; robot: Robot };

export function CompareClient({ robots, manufacturers, selectedIds }: CompareClientProps) {
  const { updateParams } = useUrlParamUpdater();
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

  const urlSelectedIds = selectedIds;

  // 並べ替え順の真実源はこの local state。URL は commitOrder で副作用同期する。
  // こうしないと onDragEnd 時に URL 遷移(非同期)を待つ間、dnd-kit が一旦
  // 元の順序へ戻してから整列し直すため、ドロップ時に「元位置へ戻る」違和感が出る。
  const [orderedIds, setOrderedSlugs] = useState<string[]>(urlSelectedIds);
  useEffect(() => {
    // 共有リンク/戻る・進む等で URL が外部から変わった時だけ local を追従させる。
    // 自分の操作で書き換えた場合は値が一致するので no-op。
    setOrderedSlugs((prev) =>
      prev.join(',') === urlSelectedIds.join(',') ? prev : urlSelectedIds,
    );
  }, [urlSelectedIds]);

  const robotById = useMemo(
    () => new Map(robots.map((robot) => [robot.id, robot])),
    [robots],
  );
  const sortedManufacturers = useMemo(
    () => sortManufacturers([...manufacturers], 'name'),
    [manufacturers],
  );
  const selectedRobots = useMemo(
    () =>
      orderedIds.flatMap((id) => {
        const robot = robotById.get(id);
        return robot ? [robot] : [];
      }),
    [robotById, orderedIds],
  );
  const favoriteRobots = useMemo(
    () => sortRobots(robots.filter((r) => favorites.includes(r.id)), 'name', manufacturers),
    [robots, favorites, manufacturers],
  );
  const sheetItemIds = useMemo(
    () => orderedIds.map((id) => getDndItemId('sheet', id)),
    [orderedIds],
  );
  const sheetPreviewItems = useMemo<SheetPreviewItem[]>(() => {
    const baseItems: SheetPreviewItem[] = selectedRobots.map((robot) => ({ type: 'robot', robot }));
    if (!sheetPreview) return baseItems;

    const previewRobot = robotById.get(sheetPreview.id);
    if (!previewRobot) return baseItems;

    const nextItems = [...baseItems];
    const previewIndex = Math.max(0, Math.min(sheetPreview.index, nextItems.length));
    nextItems.splice(previewIndex, 0, { type: 'preview', robot: previewRobot });
    return nextItems;
  }, [robotById, selectedRobots, sheetPreview]);

  // 挿入プレビュー中だけ Framer Motion の layout を有効化する。
  // シート内の並べ替えは dnd-kit が transform で整列アニメを担うため、
  // ここで layout を併用すると同じカードを二重にアニメートしてガクつく。
  const isInsertionPreviewing = sheetPreview !== null;

  const manufacturerFor = (id: string) => manufacturers.find((m) => m.id === id);
  const activeDragRobot = activeDrag ? robotById.get(activeDrag.id) : undefined;
  const activeDragManufacturer = activeDragRobot
    ? manufacturerFor(activeDragRobot.manufacturerId)
    : undefined;

  // 並び順を local state へ即時反映し、URL も同じ値へ同期する(共有・履歴用)。
  const commitOrder = (nextIds: string[], mode: 'push' | 'replace' = 'push') => {
    setOrderedSlugs(nextIds);
    updateParams({ compare: nextIds.length > 0 ? nextIds.join(',') : null }, mode);
  };

  const addRobot = (id: string) => {
    if (orderedIds.length >= MAX_COMPARE_ROBOTS || orderedIds.includes(id)) return false;

    commitOrder([...orderedIds, id]);
    return true;
  };

  const insertRobot = (id: string, index?: number) => {
    if (orderedIds.length >= MAX_COMPARE_ROBOTS || orderedIds.includes(id)) return false;

    const insertIndex =
      typeof index === 'number'
        ? Math.max(0, Math.min(index, orderedIds.length))
        : orderedIds.length;
    const nextIds = [...orderedIds];
    nextIds.splice(insertIndex, 0, id);
    commitOrder(nextIds);
    return true;
  };

  const highlightRobot = (id: string) => {
    const el = document.getElementById(`compare-card-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    el.classList.add('ring-2', 'ring-ring', 'ring-offset-2');
    setTimeout(() => el.classList.remove('ring-2', 'ring-ring', 'ring-offset-2'), 1500);
  };

  const handleFavoriteSelect = (id: string) => {
    if (!orderedIds.includes(id)) {
      if (addRobot(id)) {
        setTimeout(() => highlightRobot(id), 100);
      }
    } else {
      highlightRobot(id);
    }
  };

  const removeRobot = (id: string) => {
    commitOrder(orderedIds.filter((s) => s !== id));
  };

  const clearAll = () => {
    commitOrder([]);
  };

  // over しているカードの「前/後ろ」どちらに差し込むかをポインタ(ドラッグ中の
  // 矩形中心)とカード中心の位置関係で判定する。これで任意位置に挿入できる。
  const isInsertedAfterOver = (
    active: DragOverEvent['active'],
    over: NonNullable<DragOverEvent['over']>,
  ): boolean => {
    const activeRect = active.rect.current.translated;
    const overRect = over.rect;
    if (!activeRect) return false;

    const overMidX = overRect.left + overRect.width / 2;
    const overMidY = overRect.top + overRect.height / 2;
    const activeMidX = activeRect.left + activeRect.width / 2;
    const activeMidY = activeRect.top + activeRect.height / 2;

    if (activeMidY > overMidY + overRect.height / 2) return true; // 明確に下の行
    if (activeMidY < overMidY - overRect.height / 2) return false; // 明確に上の行
    return activeMidX > overMidX; // 同じ行付近なら左右で判定
  };

  const getSheetInsertionPreview = (
    activeData: CompareRobotDragData | null,
    dropData: CompareDropData | null,
    active: DragOverEvent['active'],
    over: DragOverEvent['over'],
  ): SheetPreviewPlacement | null => {
    if (!activeData || !dropData || dropData.target !== 'sheet') return null;
    if (activeData.source === 'sheet') return null;
    if (orderedIds.includes(activeData.id)) return null;
    if (orderedIds.length >= MAX_COMPARE_ROBOTS) return null;

    // 既定は末尾(空シート/列の上)。カードの上ならポインタ位置で前後を決める。
    let index = orderedIds.length;
    if (dropData.dropType === 'sheet-card') {
      const cardIndex = orderedIds.indexOf(dropData.id);
      if (cardIndex >= 0) {
        index = over ? cardIndex + (isInsertedAfterOver(active, over) ? 1 : 0) : cardIndex;
      }
    }
    return { id: activeData.id, index };
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
    setSheetPreview(getSheetInsertionPreview(activeData, dropData, active, over));
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
      activeData.id !== dropData.id
    ) {
      const oldIndex = orderedIds.indexOf(activeData.id);
      const newIndex = orderedIds.indexOf(dropData.id);
      if (oldIndex < 0 || newIndex < 0) return;

      commitOrder(arrayMove(orderedIds, oldIndex, newIndex), 'replace');
      return;
    }

    if (dropData.target === 'sheet') {
      if (activeData.source === 'sheet') return;
      if (orderedIds.includes(activeData.id)) {
        highlightRobot(activeData.id);
        return;
      }

      // プレビューと同じ計算で着地indexを決め、見た目と一致させる。
      const placement = getSheetInsertionPreview(activeData, dropData, active, over);
      if (placement && insertRobot(activeData.id, placement.index)) {
        setTimeout(() => highlightRobot(activeData.id), 100);
      }
      return;
    }

    if (dropData.target === 'menu' && activeData.source === 'sheet') {
      removeRobot(activeData.id);
      return;
    }

    if (dropData.target === 'favorite' && activeData.source === 'sheet') {
      if (!favorites.includes(activeData.id)) {
        toggleFavorite(activeData.id);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveDrag(null);
    setActiveDropTarget(null);
    setSheetPreview(null);
  };

  const toggleManufacturer = (id: string) => {
    if (expandedManufacturers.includes(id)) {
      setExpandedManufacturers(expandedManufacturers.filter((s) => s !== id));
    } else {
      setExpandedManufacturers([...expandedManufacturers, id]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="site-container py-8">
        <Breadcrumbs items={[{ label: uiText.compare.breadcrumb }]} />

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold leading-tight text-foreground mb-2">
            {uiText.compare.title}
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            左のメニューからロボットを選んで比較します。右パネルで気になるロボットをお気に入り登録できます。
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)_16rem]">
            {/* Left Sidebar - Manufacturer Menu */}
            {/* モバイルでロボット未選択時はメニューを先（order-1）、選択後はシートを先（order-2）にする */}
            <div className={`min-w-0 md:order-none ${selectedRobots.length === 0 ? 'order-1' : 'order-2'}`}>
              <CompareDroppableArea
                id={compareColumnIds.menu}
                target="menu"
                isHighlighted={activeDropTarget === 'menu'}
              >
                {({ setNodeRef, isActive }) => (
                  <div
                    ref={setNodeRef}
                    className={cn(
                      'border border-border bg-card transition-[box-shadow,outline-color] duration-200 xl:sticky xl:top-[calc(var(--header-h)+1.5rem)]',
                      isActive && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
                    )}
                  >
                    <div className="px-4 py-3 border-b border-border-subtle">
                      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {uiText.compare.manufacturers}
                      </h2>
                    </div>
                    <div className="max-h-80 overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden xl:max-h-[calc(100vh-200px)]">
                      {sortedManufacturers.map((manufacturer) => {
                        const manufacturerRobots = sortRobots(
                          robots.filter((r) => r.manufacturerId === manufacturer.id),
                          'name',
                          manufacturers,
                        );
                        const isEmpty = manufacturerRobots.length === 0;
                        const isExpanded =
                          !isEmpty && expandedManufacturers.includes(manufacturer.id);

                        return (
                          <div key={manufacturer.id} className="border-b border-border-subtle last:border-0">
                            <button
                              type="button"
                              disabled={isEmpty}
                              aria-label={uiText.comparison.toggleAria(
                                manufacturer.nameJa ?? manufacturer.name,
                                isExpanded,
                              )}
                              aria-expanded={isEmpty ? undefined : isExpanded}
                              onClick={() => toggleManufacturer(manufacturer.id)}
                              className={cn(
                                'w-full px-4 py-3 flex items-center justify-between transition-colors text-left',
                                isEmpty
                                  ? 'bg-card cursor-not-allowed opacity-50'
                                  : 'bg-card hover:bg-muted',
                              )}
                            >
                              <ManufacturerLogoName
                                name={manufacturer.nameJa ?? manufacturer.name}
                                logo={manufacturer.logo}
                                className="text-sm font-semibold text-foreground"
                                frameClassName="h-5 w-5"
                                imageClassName="h-4 w-4"
                              />
                              {isEmpty ? (
                                <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                                  0
                                </span>
                              ) : isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                            {isExpanded && (
                              <div className="pb-2">
                                <div>
                                  {manufacturerRobots.map((robot) => {
                                    const isSelected = orderedIds.includes(robot.id);
                                    const isDisabled =
                                      !isSelected && orderedIds.length >= MAX_COMPARE_ROBOTS;
                                    return (
                                      <DraggableMenuRobotButton
                                        key={robot.id}
                                        robot={robot}
                                        isSelected={isSelected}
                                        isDisabled={isDisabled}
                                        onClick={() =>
                                          isSelected ? removeRobot(robot.id) : addRobot(robot.id)
                                        }
                                      />
                                    );
                                  })}
                                </div>
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
            <div className={`min-w-0 md:order-none md:row-span-2 xl:row-span-1 ${selectedRobots.length === 0 ? 'order-2' : 'order-1'}`}>
              <CompareDroppableArea
                id={compareColumnIds.sheet}
                target="sheet"
                isHighlighted={activeDropTarget === 'sheet'}
              >
                {({ setNodeRef, isActive }) => (
                  <section
                    ref={setNodeRef}
                    className={cn(
                      'border border-border-subtle bg-surface-inset p-3 transition-[box-shadow,outline-color] duration-200',
                      isActive && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
                    )}
                  >
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        {uiText.compare.comparisonSheet(orderedIds.length, MAX_COMPARE_ROBOTS)}
                      </span>
                      {orderedIds.length > 0 && (
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

                    <div className="min-h-[6rem] sm:min-h-[22rem]">
                      {selectedRobots.length === 0 && !sheetPreview ? (
                        <div className="flex min-h-[6rem] sm:min-h-[22rem] items-center justify-center text-center py-8">
                          <div className="max-w-md">
                            <p className="text-sm font-medium text-foreground">
                              {uiText.comparison.emptyTitle}
                            </p>
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                              下のメーカーリストからロボットを選んで追加してください。
                            </p>
                          </div>
                        </div>
                      ) : (
                        <SortableContext items={sheetItemIds} strategy={rectSortingStrategy}>
                          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                            {sheetPreviewItems.map((item) => {
                              if (item.type === 'preview') {
                                const manufacturer = manufacturerFor(item.robot.manufacturerId);
                                return (
                                  <motion.div
                                    key={`sheet-preview-${item.robot.id}`}
                                    layout
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={SHEET_LAYOUT_TRANSITION}
                                    className="h-full"
                                  >
                                    <CompareInsertionPreviewCard
                                      robot={item.robot}
                                      manufacturerName={manufacturer?.name ?? item.robot.manufacturerId}
                                      manufacturerLogo={manufacturer?.logo}
                                    />
                                  </motion.div>
                                );
                              }

                              const { robot } = item;
                              const manufacturer = manufacturerFor(robot.manufacturerId);
                              return (
                                <motion.div
                                  key={robot.id}
                                  layout={isInsertionPreviewing}
                                  transition={SHEET_LAYOUT_TRANSITION}
                                  className="h-full"
                                >
                                  <SortableCompareCard
                                    robotId={robot.id}
                                    sortableId={getDndItemId('sheet', robot.id)}
                                    data={{
                                      type: 'robot',
                                      source: 'sheet',
                                      target: 'sheet',
                                      dropType: 'sheet-card',
                                      id: robot.id,
                                    }}
                                  >
                                    {(dragHandleProps) => (
                                      <ComparisonRobotPanel
                                        robot={robot}
                                        manufacturerName={manufacturer?.name ?? robot.manufacturerId}
                                        manufacturerLogo={manufacturer?.logo}
                                        isFavorite={
                                          isMounted ? favorites.includes(robot.id) : false
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
                      )}
                    </div>
                  </section>
                )}
              </CompareDroppableArea>
            </div>

            {/* Right Sidebar - Favorites */}
            <div className="min-w-0 order-3 md:order-none">
              <CompareDroppableArea
                id={compareColumnIds.favorite}
                target="favorite"
                isHighlighted={activeDropTarget === 'favorite'}
              >
                {({ setNodeRef, isActive }) => (
                  <div
                    ref={setNodeRef}
                    className={cn(
                      'border border-border bg-card transition-[box-shadow,outline-color] duration-200 xl:sticky xl:top-[calc(var(--header-h)+1.5rem)]',
                      isActive && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
                    )}
                  >
                    <div className="px-4 py-3 border-b border-border-subtle flex items-center gap-2">
                      <Star className="w-4 h-4 fill-favorite text-favorite" />
                      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {uiText.compare.favorites}
                      </h2>
                    </div>
                    <div className="p-3 max-h-80 overflow-y-auto overscroll-contain xl:max-h-[calc(100vh-200px)]">
                      {!isMounted ? (
                        <div className="text-center py-8" aria-hidden="true" />
                      ) : favoriteRobots.length === 0 ? (
                        <div className="py-8 text-center">
                          <p className="text-xs font-medium text-muted-foreground">
                            {uiText.favorites.empty}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground/70">
                            {uiText.favorites.emptySub}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {favoriteRobots.map((robot) => {
                            const manufacturer = manufacturerFor(robot.manufacturerId);
                            return (
                              <DraggableFavoriteCard
                                key={robot.id}
                                robot={robot}
                                manufacturerName={manufacturer?.name ?? robot.manufacturerId}
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
                    manufacturerName={activeDragManufacturer?.name ?? activeDragRobot.manufacturerId}
                    manufacturerLogo={activeDragManufacturer?.logo}
                    isFavorite={isMounted ? favorites.includes(activeDragRobot.id) : false}
                    onFavoriteToggle={() => {}}
                    onRemove={() => {}}
                  />
                </div>
              ) : (
                <CompareDragOverlayCard
                  robot={activeDragRobot}
                  manufacturerName={activeDragManufacturer?.name ?? activeDragRobot.manufacturerId}
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
