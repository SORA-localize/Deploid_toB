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
import { ChevronDown, ChevronRight, Link2, Star } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SelectControl } from '@/components/SelectControl';
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
import { getComparisonCoreRows, getComparisonDetailRows } from '@/lib/robotDisplay';
import { uiText } from '@/lib/uiText';
import { MAX_COMPARE_ROBOTS } from '@/lib/compareParams';
import { useUrlParamUpdater } from '@/lib/useUrlParamUpdater';
import { useFavorites } from '@/lib/useFavorites';
import { cn } from '@/lib/utils';
import { sortManufacturers, sortRobots } from '@/lib/display';

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

/**
 * カード内蔵のスペック一覧。共有ラベル列を持たず、各カードが自分のラベル+値を持つ。
 * 行の構成・順序は robotDisplay の関数が全ロボットで同一なので、min-h を揃えれば
 * 隣のカードと行が揃い、横方向のスキャン比較が成立する。
 */
function CompareCardSpecList({ robot }: { robot: Robot }) {
  const groups = [
    { heading: uiText.comparison.coreVariables, rows: getComparisonCoreRows(robot) },
    { heading: uiText.comparison.detailedData, rows: getComparisonDetailRows(robot) },
  ];

  return (
    <div className="flex-1 px-3 pb-3">
      {groups.map((group) => (
        <div key={group.heading}>
          <p className="mt-3 mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {group.heading}
          </p>
          <dl>
            {group.rows.map((row) => (
              <div
                key={row.label}
                className="flex min-h-9 items-center justify-between gap-3 border-b border-border-subtle py-1 text-xs last:border-0"
              >
                <dt className="shrink-0 text-muted-foreground">{row.label}</dt>
                <dd className="text-right font-medium text-foreground [overflow-wrap:anywhere]">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

export function CompareClient({ robots, manufacturers, selectedIds }: CompareClientProps) {
  const { updateParams } = useUrlParamUpdater();
  const { favorites, toggleFavorite, isMounted } = useFavorites();
  const [expandedManufacturers, setExpandedManufacturers] = useState<string[]>([]);
  const [mobileManufacturerId, setMobileManufacturerId] = useState('');
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
  const [orderedIds, setOrderedIds] = useState<string[]>(urlSelectedIds);
  useEffect(() => {
    // 共有リンク/戻る・進む等で URL が外部から変わった時だけ local を追従させる。
    // 自分の操作で書き換えた場合は値が一致するので no-op。
    setOrderedIds((prev) =>
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
  const mobileManufacturerRobots = useMemo(
    () =>
      mobileManufacturerId
        ? sortRobots(
            robots.filter((r) => r.manufacturerId === mobileManufacturerId),
            'name',
            manufacturers,
          )
        : [],
    [robots, manufacturers, mobileManufacturerId],
  );
  const mobileManufacturerOptions = useMemo(
    () => [
      { value: '', label: uiText.compare.selectManufacturer },
      ...sortedManufacturers
        .filter((m) => robots.some((r) => r.manufacturerId === m.id))
        .map((m) => ({ value: m.id, label: m.nameJa ?? m.name })),
    ],
    [sortedManufacturers, robots],
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

  const manufacturerFor = (id: string) => manufacturers.find((m) => m.id === id);
  const activeDragRobot = activeDrag ? robotById.get(activeDrag.id) : undefined;
  const activeDragManufacturer = activeDragRobot
    ? manufacturerFor(activeDragRobot.manufacturerId)
    : undefined;

  // 並び順を local state へ即時反映し、URL も同じ値へ同期する(共有・履歴用)。
  const commitOrder = (nextIds: string[], mode: 'push' | 'replace' = 'push') => {
    setOrderedIds(nextIds);
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

  // メニューからの追加は5列目以降で画面外に着地することがあるため、
  // お気に入りクリック時と同じ自動スクロール+ハイライトで追加位置を知らせる。
  const handleMenuRobotClick = (id: string) => {
    if (orderedIds.includes(id)) {
      removeRobot(id);
      return;
    }
    if (addRobot(id)) {
      setTimeout(() => highlightRobot(id), 100);
    }
  };

  const clearAll = () => {
    commitOrder([]);
  };

  // 共有: 選択・並び順はURLが正本（commitOrder が同期済み）なので、現在のURLを
  // コピーするだけで比較状態を再現できるリンクになる。
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  useEffect(() => {
    if (shareStatus === 'idle') return;
    const timer = setTimeout(() => setShareStatus('idle'), 2500);
    return () => clearTimeout(timer);
  }, [shareStatus]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus('copied');
    } catch {
      setShareStatus('failed');
    }
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
          <p className="text-sm text-muted-foreground max-w-3xl hidden md:block">
            {uiText.compare.desktopDescription}
          </p>
          <p className="text-sm text-muted-foreground max-w-3xl md:hidden">
            {uiText.compare.mobileDescription}
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[16rem_minmax(0,1fr)] lg:grid-cols-[16rem_minmax(0,1fr)_16rem]">
            {/* Left Sidebar - Manufacturer Menu (desktop only) */}
            <div className="hidden md:block min-w-0">
              <CompareDroppableArea
                id={compareColumnIds.menu}
                target="menu"
                isHighlighted={activeDropTarget === 'menu'}
              >
                {({ setNodeRef, isActive }) => (
                  <div
                    ref={setNodeRef}
                    className={cn(
                      'border border-border bg-card transition-[box-shadow,outline-color] duration-200 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]',
                      isActive && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
                    )}
                  >
                    <div className="px-4 py-3 border-b border-border-subtle">
                      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {uiText.compare.manufacturers}
                      </h2>
                    </div>
                    <div className="max-h-80 overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:max-h-[calc(100vh-200px)]">
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
                                        isFavorite={isMounted ? favorites.includes(robot.id) : false}
                                        onClick={() => handleMenuRobotClick(robot.id)}
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
            <div className="min-w-0">
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
                      <div className="flex items-center gap-4">
                        <span role="status" className="text-xs text-muted-foreground">
                          {shareStatus === 'copied' && uiText.comparison.shareCopied}
                          {shareStatus === 'failed' && uiText.comparison.shareFailed}
                        </span>
                        {orderedIds.length > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={handleShare}
                              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                              {uiText.comparison.shareLink}
                            </button>
                            <button
                              type="button"
                              aria-label={uiText.comparison.clearAria}
                              onClick={clearAll}
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              {uiText.common.clearAll}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="min-h-[6rem]">
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
                        // ラベル内蔵カードの折り返しグリッド。共有ラベル列を持たないので
                        // 横スクロールも sticky 列も不要になり、縦方向に画面を使い切る。
                        // 並べ替えは元実装と同じ rectSortingStrategy（グリッド内 D&D）。
                        <SortableContext items={sheetItemIds} strategy={rectSortingStrategy}>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                            {sheetPreviewItems.map((item) => {
                              if (item.type === 'preview') {
                                const manufacturer = manufacturerFor(item.robot.manufacturerId);
                                return (
                                  <div key={`sheet-preview-${item.robot.id}`} className="h-full">
                                    <CompareInsertionPreviewCard
                                      robot={item.robot}
                                      manufacturerName={manufacturer?.name ?? item.robot.manufacturerId}
                                      manufacturerLogo={manufacturer?.logo}
                                    />
                                  </div>
                                );
                              }

                              const { robot } = item;
                              const manufacturer = manufacturerFor(robot.manufacturerId);
                              return (
                                <SortableCompareCard
                                  key={robot.id}
                                  robotId={robot.id}
                                  sortableId={getDndItemId('sheet', robot.id)}
                                  className="h-full"
                                  data={{
                                    type: 'robot',
                                    source: 'sheet',
                                    target: 'sheet',
                                    dropType: 'sheet-card',
                                    id: robot.id,
                                  }}
                                >
                                  {(dragHandleProps) => (
                                    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
                                      <ComparisonRobotPanel
                                        robot={robot}
                                        manufacturerName={manufacturer?.name ?? robot.manufacturerId}
                                        isFavorite={
                                          isMounted ? favorites.includes(robot.id) : false
                                        }
                                        onFavoriteToggle={toggleFavorite}
                                        onRemove={removeRobot}
                                        dragHandleProps={dragHandleProps}
                                      />
                                      <CompareCardSpecList robot={robot} />
                                    </div>
                                  )}
                                </SortableCompareCard>
                              );
                            })}
                          </div>
                        </SortableContext>
                      )}
                    </div>
                  </section>
                )}
              </CompareDroppableArea>

              {/* Mobile-only: add robots after the comparison sheet so the selected set stays primary. */}
              <div className="mt-4 border border-border bg-card md:hidden">
                <div className="px-4 pb-3 pt-4">
                  <SelectControl
                    id="mobile-manufacturer"
                    label={uiText.compare.manufacturers}
                    value={mobileManufacturerId}
                    options={mobileManufacturerOptions}
                    onChange={setMobileManufacturerId}
                    searchable
                  />
                </div>
                {mobileManufacturerId && (
                  <div className="max-h-[45vh] overflow-y-auto border-t border-border-subtle">
                    {mobileManufacturerRobots.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-muted-foreground">
                        {uiText.compare.manufacturerEmpty}
                      </p>
                    ) : (
                      mobileManufacturerRobots.map((robot) => {
                        const isSelected = orderedIds.includes(robot.id);
                        const isDisabled =
                          !isSelected && orderedIds.length >= MAX_COMPARE_ROBOTS;
                        return (
                          <DraggableMenuRobotButton
                            key={robot.id}
                            robot={robot}
                            isSelected={isSelected}
                            isDisabled={isDisabled}
                            isFavorite={isMounted ? favorites.includes(robot.id) : false}
                            onClick={() => handleMenuRobotClick(robot.id)}
                          />
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar - Favorites (desktop xl+ only) */}
            <div className="hidden lg:block min-w-0">
              <CompareDroppableArea
                id={compareColumnIds.favorite}
                target="favorite"
                isHighlighted={activeDropTarget === 'favorite'}
              >
                {({ setNodeRef, isActive }) => (
                  <div
                    ref={setNodeRef}
                    className={cn(
                      'border border-border bg-card transition-[box-shadow,outline-color] duration-200 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]',
                      isActive && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
                    )}
                  >
                    <div className="px-4 py-3 border-b border-border-subtle flex items-center gap-2">
                      <Star className="w-4 h-4 fill-favorite text-favorite" />
                      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {uiText.compare.favorites}
                      </h2>
                    </div>
                    <div className="p-3 max-h-80 overflow-y-auto overscroll-contain lg:max-h-[calc(100vh-200px)]">
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
                <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
                  <ComparisonRobotPanel
                    robot={activeDragRobot}
                    manufacturerName={activeDragManufacturer?.name ?? activeDragRobot.manufacturerId}
                    isFavorite={isMounted ? favorites.includes(activeDragRobot.id) : false}
                    onFavoriteToggle={() => {}}
                    onRemove={() => {}}
                  />
                  <CompareCardSpecList robot={activeDragRobot} />
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
