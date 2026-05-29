'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FilterSelectOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  id: string;
  label: string;
  value: string;
  options: readonly FilterSelectOption[];
  onChange: (value: string) => void;
  className?: string;
}

export function FilterSelect({
  id,
  label,
  value,
  options,
  onChange,
  className = '',
}: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerId = `${id}-trigger`;
  const listId = `${id}-list`;

  const selectedOption = options.find((o) => o.value === value) ?? options[0];

  // 外側クリックで閉じる
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // 開いたとき選択中にフォーカスを合わせる
  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value);
      setFocusedIndex(idx >= 0 ? idx : 0);
    }
  }, [open, options, value]);

  // フォーカス中の項目をスクロール表示
  useEffect(() => {
    if (!open || focusedIndex < 0) return;
    const item = listRef.current?.children[focusedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [open, focusedIndex]);

  const select = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (focusedIndex >= 0) select(options[focusedIndex].value);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div className={className} ref={containerRef}>
      <label htmlFor={triggerId} className="mb-2 block text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </label>

      <div className="relative">
        <button
          id={triggerId}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listId}
          onKeyDown={handleKeyDown}
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none text-left"
        >
          <span>{selectedOption.label}</span>
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={`shrink-0 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <ul
            id={listId}
            ref={listRef}
            role="listbox"
            aria-label={label}
            onKeyDown={handleKeyDown}
            className="absolute z-10 w-full border border-neutral-300 bg-white mt-px max-h-60 overflow-y-auto"
          >
            {options.map((option, i) => {
              const isSelected = option.value === value;
              const isFocused = i === focusedIndex;
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={() => select(option.value)}
                  onMouseEnter={() => setFocusedIndex(i)}
                  className={`px-3 py-2 text-sm cursor-pointer select-none ${
                    isSelected
                      ? 'bg-neutral-900 text-white'
                      : isFocused
                        ? 'bg-neutral-100 text-neutral-900'
                        : 'text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  {option.label}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
