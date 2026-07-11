'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Link2, Star } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SelectControl } from '@/components/SelectControl';
import { MenuRobotButton } from '@/components/compare/CompareParts';
import { ComparisonRobotPanel } from '@/components/ComparisonRobotPanel';
import { FavoriteCard } from '@/components/FavoriteCard';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import { SearchInput } from '@/components/SearchInput';
import { SortableCompareCard } from '@/components/SortableCompareCard';
import type { Manufacturer, Robot } from '@/data/types';
import { getComparisonCoreRows, getComparisonDetailRows } from '@/lib/robotDisplay';
import { uiText } from '@/lib/uiText';
import { MAX_COMPARE_ROBOTS } from '@/lib/compareParams';
import { useUrlParamUpdater } from '@/lib/useUrlParamUpdater';
import { useFavorites } from '@/lib/useFavorites';
import { cn } from '@/lib/utils';
import { sortManufacturers, sortRobots } from '@/lib/display';
import { normalizeSearchText } from '@/lib/search';

type CompareView = 'visual' | 'specs';

interface CompareClientProps {
  robots: Robot[];
  manufacturers: Manufacturer[];
  selectedIds: string[];
  initialView: CompareView;
}

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

export function CompareClient({ robots, manufacturers, selectedIds, initialView }: CompareClientProps) {
  const { updateParams } = useUrlParamUpdater();
  const { favorites, toggleFavorite, isMounted } = useFavorites();
  const [mobileManufacturerId, setMobileManufacturerId] = useState('');
  // D&D はシート内の並べ替え専用（カラム間の移動はクリック操作。§8.7）
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // 表示モードはシート全体で一括切替（カード個別のフリップ/開閉は行ズレするため不採用。§8.7）。
  // URLに載せて共有リンクでも表示モードを再現する。
  const [view, setView] = useState<CompareView>(initialView);
  useEffect(() => {
    setView(initialView);
  }, [initialView]);
  const handleViewSelect = (next: CompareView) => {
    if (next === view) return;
    setView(next);
    updateParams({ view: next === 'specs' ? 'specs' : null }, 'replace');
  };

  // メニュー内検索: 90行前後のツリーをスクロールせず目的の機体へ最短で届くための
  // ローカル絞り込み（URLには載せない。共有すべき状態は選択と表示モードのみ）。
  const [menuQuery, setMenuQuery] = useState('');
  const normalizedMenuQuery = normalizeSearchText(menuQuery);
  const menuRobotMatches = (robot: Robot, manufacturer: Manufacturer) => {
    if (!normalizedMenuQuery) return true;
    return [robot.name, robot.nameJa, manufacturer.name, manufacturer.nameJa]
      .some((text) => text && normalizeSearchText(text).includes(normalizedMenuQuery));
  };
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
  const manufacturerFor = (id: string) => manufacturers.find((m) => m.id === id);
  const activeDragRobot = activeDragId ? robotById.get(activeDragId) : undefined;
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

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveDragId(String(active.id));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveDragId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = orderedIds.indexOf(String(active.id));
    const newIndex = orderedIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    commitOrder(arrayMove(orderedIds, oldIndex, newIndex), 'replace');
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
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
          id="compare-sheet-sort"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[16rem_minmax(0,1fr)] lg:grid-cols-[16rem_minmax(0,1fr)_16rem]">
            {/* Left Sidebar - Manufacturer Menu (desktop only) */}
            <div className="hidden md:block min-w-0">
              <div className="border border-border bg-card lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
                    <div className="space-y-2 px-4 py-3 border-b border-border-subtle">
                      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {uiText.compare.manufacturers}
                      </h2>
                      <SearchInput
                        id="compare-menu-search"
                        value={menuQuery}
                        onChange={setMenuQuery}
                        placeholder={uiText.compare.menuSearchPlaceholder}
                        inputClassName="min-h-9 text-xs"
                      />
                    </div>
                    <div className="max-h-80 overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:max-h-[calc(100vh-200px)]">
                      {/* 常時展開ツリー: 開閉操作を持たない。メーカー名はスクロール内 sticky 見出しで、
                          どのメーカーの機体を見ているかを保ちながら全機体へスクロールだけで届く。
                          （ホバー展開のフライアウトは、ここがD&Dのドラッグ元のため不採用。§8.6） */}
                      {sortedManufacturers.map((manufacturer) => {
                        const manufacturerRobots = sortRobots(
                          robots.filter(
                            (r) =>
                              r.manufacturerId === manufacturer.id &&
                              menuRobotMatches(r, manufacturer),
                          ),
                          'name',
                          manufacturers,
                        );
                        if (manufacturerRobots.length === 0) return null;

                        return (
                          <div key={manufacturer.id} className="border-b border-border-subtle last:border-0 pb-2">
                            <div className="sticky top-0 z-[1] flex items-center justify-between bg-card px-4 py-2.5">
                              <ManufacturerLogoName
                                name={manufacturer.nameJa ?? manufacturer.name}
                                logo={manufacturer.logo}
                                className="text-sm font-semibold text-foreground"
                                frameClassName="h-5 w-5"
                                imageClassName="h-4 w-4"
                              />
                              <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                                {manufacturerRobots.length}
                              </span>
                            </div>
                            {manufacturerRobots.map((robot) => {
                              const isSelected = orderedIds.includes(robot.id);
                              const isDisabled =
                                !isSelected && orderedIds.length >= MAX_COMPARE_ROBOTS;
                              return (
                                <MenuRobotButton
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
                        );
                      })}
                    </div>
              </div>
            </div>

            {/* Main Content - Comparison Sheet */}
            <div className="min-w-0">
              <section className="border border-border-subtle bg-surface-inset p-3">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        {uiText.compare.comparisonSheet(orderedIds.length, MAX_COMPARE_ROBOTS)}
                      </span>
                      <div className="flex items-center gap-4">
                        <div
                          role="group"
                          aria-label={uiText.comparison.viewToggleAria}
                          className="flex items-center border border-border bg-background p-0.5 text-xs"
                        >
                          {(
                            [
                              { value: 'visual', label: uiText.comparison.viewVisual },
                              { value: 'specs', label: uiText.comparison.viewSpecs },
                            ] as const
                          ).map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              aria-pressed={view === option.value}
                              onClick={() => handleViewSelect(option.value)}
                              className={cn(
                                'px-2 py-1 transition-colors',
                                view === option.value
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:text-foreground',
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
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
                      {selectedRobots.length === 0 ? (
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
                        <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
                          <div
                            className={
                              view === 'visual'
                                ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4'
                                : 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
                            }
                          >
                            {selectedRobots.map((robot) => {
                              const manufacturer = manufacturerFor(robot.manufacturerId);
                              return (
                                <SortableCompareCard
                                  key={robot.id}
                                  robotId={robot.id}
                                  className="h-full"
                                >
                                  {(dragHandleProps) =>
                                    view === 'visual' ? (
                                      <ComparisonRobotPanel
                                        variant="visual"
                                        robot={robot}
                                        manufacturerName={manufacturer?.name ?? robot.manufacturerId}
                                        isFavorite={
                                          isMounted ? favorites.includes(robot.id) : false
                                        }
                                        onFavoriteToggle={toggleFavorite}
                                        onRemove={removeRobot}
                                        dragHandleProps={dragHandleProps}
                                      />
                                    ) : (
                                      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
                                        <ComparisonRobotPanel
                                          variant="compact"
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
                                    )
                                  }
                                </SortableCompareCard>
                              );
                            })}
                          </div>
                        </SortableContext>
                      )}
                    </div>
              </section>

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
                          <MenuRobotButton
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
              <div className="border border-border bg-card lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
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
                              <FavoriteCard
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
            </div>
          </div>

          {/* 持ち上げ中のカードを描画する層。元カードは SortableCompareCard 側で
              薄いプレースホルダとして残り、着地点を示す。D&D はシート内並べ替え専用。 */}
          <DragOverlay>
            {activeDragRobot ? (
              view === 'visual' ? (
                <div className="h-full shadow-2xl">
                  <ComparisonRobotPanel
                    variant="visual"
                    robot={activeDragRobot}
                    manufacturerName={activeDragManufacturer?.name ?? activeDragRobot.manufacturerId}
                    isFavorite={isMounted ? favorites.includes(activeDragRobot.id) : false}
                    onFavoriteToggle={() => {}}
                    onRemove={() => {}}
                  />
                </div>
              ) : (
                <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
                  <ComparisonRobotPanel
                    variant="compact"
                    robot={activeDragRobot}
                    manufacturerName={activeDragManufacturer?.name ?? activeDragRobot.manufacturerId}
                    isFavorite={isMounted ? favorites.includes(activeDragRobot.id) : false}
                    onFavoriteToggle={() => {}}
                    onRemove={() => {}}
                  />
                  <CompareCardSpecList robot={activeDragRobot} />
                </div>
              )
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
