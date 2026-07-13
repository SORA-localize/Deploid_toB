'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
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
import { ChevronRight, Link2, Star } from 'lucide-react';
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
  const handleSpecToggle = () => {
    const next: CompareView = view === 'specs' ? 'visual' : 'specs';
    setView(next);
    updateParams({ view: next === 'specs' ? 'specs' : null }, 'replace');
    toast(next === 'specs' ? uiText.comparison.toastSpecsOn : uiText.comparison.toastSpecsOff);
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

  // カスケードメニュー: メーカー行の hover/クリック/フォーカスで、行の右に機体リストを出す。
  // パネルは position:fixed（メニューの overflow-y に切り取られないため）。
  // メニューのスクロールで座標が古くなるので、スクロール時は閉じる。
  const MENU_FLYOUT_MAX_HEIGHT = 336;
  const [menuFlyout, setMenuFlyout] = useState<{
    manufacturerId: string;
    top: number;
    left: number;
  } | null>(null);
  // パネルは portal で body 直下に描画する。メニュー列は lg:sticky で
  // スタッキングコンテキストを作るため、DOM子のままだと fixed でも
  // 後続のシート列（比較カード）に重なり負けする。
  // portal で DOM が離れるぶん、行→パネル間の hover 維持は猶予タイマーで行う。
  const flyoutCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelFlyoutClose = () => {
    if (flyoutCloseTimer.current) {
      clearTimeout(flyoutCloseTimer.current);
      flyoutCloseTimer.current = null;
    }
  };
  const scheduleFlyoutClose = () => {
    cancelFlyoutClose();
    flyoutCloseTimer.current = setTimeout(() => setMenuFlyout(null), 120);
  };
  useEffect(() => cancelFlyoutClose, []);
  const openMenuFlyout = (manufacturerId: string, element: HTMLElement) => {
    cancelFlyoutClose();
    const rect = element.getBoundingClientRect();
    const top = Math.max(
      12,
      Math.min(rect.top, window.innerHeight - MENU_FLYOUT_MAX_HEIGHT - 12),
    );
    setMenuFlyout({ manufacturerId, top, left: rect.right });
  };
  const closeMenuFlyout = () => {
    cancelFlyoutClose();
    setMenuFlyout(null);
  };
  // ウィンドウのスクロール/リサイズはアンカー行を動かすが fixed のパネルは動かない。
  // 座標が古くなったら追従せず閉じる（メニュー内スクロールの onScroll と同じ方針）。
  useEffect(() => {
    if (!menuFlyout) return;
    const close = () => setMenuFlyout(null);
    window.addEventListener('scroll', close, { passive: true });
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close);
      window.removeEventListener('resize', close);
    };
  }, [menuFlyout]);
  const menuFlyoutManufacturer = menuFlyout ? manufacturerFor(menuFlyout.manufacturerId) : undefined;
  const menuFlyoutRobots =
    menuFlyout && menuFlyoutManufacturer
      ? sortRobots(
          robots.filter(
            (r) =>
              r.manufacturerId === menuFlyout.manufacturerId &&
              menuRobotMatches(r, menuFlyoutManufacturer),
          ),
          'name',
          manufacturers,
        )
      : [];
  // 検索でアンカーの機体が全滅したら（行ごと消えるので）幽霊パネルを残さない
  useEffect(() => {
    if (menuFlyout && menuFlyoutRobots.length === 0) setMenuFlyout(null);
  }, [menuFlyout, menuFlyoutRobots.length]);

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
  // コピーするだけで比較状態を再現できるリンクになる。通知はオーバーレイ（sonner）。
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast(uiText.comparison.shareCopied);
    } catch {
      toast.error(uiText.comparison.shareFailed);
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
              {/* パネルはこの div の DOM 子なので、行→パネルへポインタを移しても mouseleave しない */}
              <div
                onMouseLeave={scheduleFlyoutClose}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') closeMenuFlyout();
                }}
                className="border border-border bg-card lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
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
                    <div
                      onScroll={closeMenuFlyout}
                      className="max-h-80 overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:max-h-[calc(100vh-200px)]"
                    >
                      {sortedManufacturers.map((manufacturer) => {
                        const manufacturerRobots = robots.filter(
                          (r) =>
                            r.manufacturerId === manufacturer.id &&
                            menuRobotMatches(r, manufacturer),
                        );
                        if (manufacturerRobots.length === 0) return null;
                        const isOpen = menuFlyout?.manufacturerId === manufacturer.id;
                        // 選択インジケータは検索フィルタと無関係の全体状態から出す
                        // （検索で選択中の機体が隠れても選択は生きているため）
                        const hasSelection = orderedIds.some(
                          (id) => robotById.get(id)?.manufacturerId === manufacturer.id,
                        );

                        return (
                          <button
                            key={manufacturer.id}
                            type="button"
                            aria-haspopup="true"
                            aria-expanded={isOpen}
                            onMouseEnter={(e) => openMenuFlyout(manufacturer.id, e.currentTarget)}
                            onFocus={(e) => openMenuFlyout(manufacturer.id, e.currentTarget)}
                            onClick={(e) =>
                              isOpen ? closeMenuFlyout() : openMenuFlyout(manufacturer.id, e.currentTarget)
                            }
                            className={cn(
                              'flex w-full items-center justify-between gap-2 border-b border-border-subtle border-l-2 px-4 py-2.5 text-left transition-colors last:border-b-0',
                              hasSelection ? 'border-l-primary' : 'border-l-transparent',
                              isOpen ? 'bg-muted' : 'hover:bg-muted/60',
                            )}
                          >
                            <ManufacturerLogoName
                              name={manufacturer.nameJa ?? manufacturer.name}
                              logos={manufacturer.logos}
                              variant="combined"
                              className="text-sm font-semibold text-foreground"
                              targetAreaPx={20 * 84}
                              maxHeightPx={20}
                              maxWidthPx={84}
                              hideName
                            />
                            <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-muted-foreground tabular-nums">
                              {manufacturerRobots.length}
                              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* 機体リストのフライアウトパネル（行の右に portal で出す） */}
                    {menuFlyout && menuFlyoutManufacturer && createPortal(
                      <div
                        onMouseEnter={cancelFlyoutClose}
                        onMouseLeave={scheduleFlyoutClose}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') closeMenuFlyout();
                        }}
                        style={{ top: menuFlyout.top, left: menuFlyout.left, maxHeight: MENU_FLYOUT_MAX_HEIGHT }}
                        className="fixed z-[var(--z-dropdown)] w-64 overflow-y-auto border border-border bg-card shadow-xl"
                      >
                        <div className="border-b border-border-subtle px-4 py-2 text-xs font-semibold text-foreground">
                          {menuFlyoutManufacturer.nameJa ?? menuFlyoutManufacturer.name}
                        </div>
                        {menuFlyoutRobots.map((robot) => {
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
                      </div>,
                      document.body,
                    )}
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
                        <button
                          type="button"
                          role="switch"
                          aria-checked={view === 'specs'}
                          aria-label={uiText.comparison.viewToggleAria}
                          onClick={handleSpecToggle}
                          className="group flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <span>{uiText.comparison.specToggleLabel}</span>
                          <span
                            aria-hidden="true"
                            className={cn(
                              'relative h-5 w-9 rounded-full transition-colors',
                              view === 'specs' ? 'bg-primary' : 'bg-border',
                            )}
                          >
                            <span
                              className={cn(
                                'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background shadow transition-transform',
                                view === 'specs' && 'translate-x-4',
                              )}
                            />
                          </span>
                        </button>
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
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground md:hidden">
                              {uiText.comparison.emptyDescriptionMobile}
                            </p>
                            <p className="mt-2 hidden text-xs leading-relaxed text-muted-foreground md:block">
                              {uiText.comparison.emptyDescription}
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
                                manufacturerLogos={manufacturer?.logos}
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
