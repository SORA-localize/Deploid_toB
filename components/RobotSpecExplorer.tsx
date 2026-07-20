'use client';

import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { FactList } from '@/components/FactList';
import type { RobotSpecGroupView } from '@/lib/robotCatalog';
import { uiText } from '@/lib/uiText';
import { cn } from '@/lib/utils';

interface RobotSpecExplorerProps {
  groups: readonly RobotSpecGroupView[];
}

export function RobotSpecExplorer({ groups }: RobotSpecExplorerProps) {
  const baseId = useId();
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectAndFocus = (index: number) => {
    setActiveIndex(index);
    tabRefs.current[index]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | undefined;

    if (event.key === 'ArrowRight') {
      nextIndex = (index + 1) % groups.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + groups.length) % groups.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = groups.length - 1;
    }

    if (nextIndex == null) return;
    event.preventDefault();
    selectAndFocus(nextIndex);
  };

  return (
    <>
      <div className="space-y-7 lg:hidden">
        {groups.map((group) => (
          <section key={group.key}>
            <h3 className="mb-2 text-sm font-semibold text-foreground">{group.label}</h3>
            {group.rows.length > 0 ? (
              <FactList rows={group.rows} rowClassName="last:border-b-0" />
            ) : (
              <p className="py-3 text-xs text-muted-foreground">
                {uiText.robots.publicInfoMissing}
              </p>
            )}
          </section>
        ))}
      </div>

      <div className="hidden min-w-0 lg:block">
        <div
          role="tablist"
          aria-label={uiText.robots.specExplorerAria}
          className="flex flex-nowrap gap-0 overflow-x-auto"
        >
          {groups.map((group, index) => {
            const selected = index === activeIndex;
            const tabId = `${baseId}-tab-${index}`;
            const panelId = `${baseId}-panel-${index}`;

            return (
              <button
                key={group.key}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                id={tabId}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={panelId}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveIndex(index)}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={cn(
                  'inline-flex min-h-10 shrink-0 items-center border-b-2 px-4 py-2 text-sm transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-inset',
                  selected
                    ? 'border-foreground font-semibold text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {group.label}
              </button>
            );
          })}
        </div>

        {/*
          全パネルを同じグリッドセルに重ねて配置し、非表示パネルも
          visibility:hidden（display:none にしない）で残すことで、
          グリッドのトラック高さが4グループ中もっとも背の高いパネルへ
          自動で決まる。固定pxを指定せずに「タブ切替でレイアウトが
          跳ねない」を満たしつつ、機体ごとの実コンテンツ量に高さを
          合わせられる。max-hは想定外に長い公式値が来た場合の安全弁。
        */}
        <div className="grid min-w-0">
          {groups.map((group, index) => {
            const selected = index === activeIndex;
            return (
              <div
                key={group.key}
                id={`${baseId}-panel-${index}`}
                role="tabpanel"
                aria-labelledby={`${baseId}-tab-${index}`}
                aria-hidden={selected ? undefined : true}
                tabIndex={selected ? 0 : -1}
                className={cn(
                  'col-start-1 row-start-1 min-h-0 min-w-0 max-h-[440px] overflow-y-auto pt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-inset',
                  selected ? 'visible' : 'invisible pointer-events-none',
                )}
              >
                {group.rows.length > 0 ? (
                  <FactList
                    rows={group.rows.map((row) => ({
                      ...row,
                      valueClassName: 'line-clamp-2',
                    }))}
                    rowClassName="last:border-b-0"
                  />
                ) : (
                  <p className="py-3 text-xs text-muted-foreground">
                    {uiText.robots.publicInfoMissing}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
