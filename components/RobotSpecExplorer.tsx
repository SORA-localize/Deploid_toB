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
              <FactList rows={group.rows} />
            ) : (
              <p className="border-b border-border py-3 text-xs text-muted-foreground">
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
          className="flex flex-nowrap gap-0 overflow-x-auto border-b border-border"
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
                  'inline-flex min-h-10 shrink-0 items-center border-b-2 px-4 py-2 text-sm transition-colors -mb-px focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-inset',
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

        <div className="h-[420px] min-h-0 min-w-0">
          {groups.map((group, index) => (
            <div
              key={group.key}
              id={`${baseId}-panel-${index}`}
              role="tabpanel"
              aria-labelledby={`${baseId}-tab-${index}`}
              tabIndex={0}
              hidden={index !== activeIndex}
              className="h-full min-h-0 min-w-0 overflow-y-auto py-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-inset"
            >
              {group.rows.length > 0 ? (
                <FactList
                  rows={group.rows.map((row) => ({
                    ...row,
                    valueClassName: 'line-clamp-2',
                  }))}
                />
              ) : (
                <p className="border-b border-border py-3 text-xs text-muted-foreground">
                  {uiText.robots.publicInfoMissing}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
