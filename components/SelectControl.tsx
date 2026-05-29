'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectControlOption {
  value: string;
  label: string;
}

interface SelectControlProps {
  id: string;
  label: string;
  value: string;
  options: readonly SelectControlOption[];
  onChange: (value: string) => void;
  className?: string;
  labelClassName?: string;
  buttonClassName?: string;
  listClassName?: string;
  required?: boolean;
}

export function SelectControl({
  id,
  label,
  value,
  options,
  onChange,
  className = '',
  labelClassName = 'mb-2 block text-xs uppercase tracking-wide text-neutral-500',
  buttonClassName = 'w-full flex items-center justify-between border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none text-left',
  listClassName = 'absolute z-10 w-full border border-neutral-300 bg-white mt-px max-h-60 overflow-y-auto',
  required = false,
}: SelectControlProps) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerId = `${id}-trigger`;
  const listId = `${id}-list`;

  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const index = options.findIndex((option) => option.value === value);
    setFocusedIndex(index >= 0 ? index : 0);
  }, [open, options, value]);

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

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!open) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setFocusedIndex((index) => Math.min(index + 1, options.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setFocusedIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const focusedOption = options[focusedIndex];
      if (focusedOption) select(focusedOption.value);
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div className={className} ref={containerRef}>
      <label htmlFor={triggerId} className={labelClassName}>
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
          aria-required={required || undefined}
          onKeyDown={handleKeyDown}
          onClick={() => setOpen((current) => !current)}
          className={buttonClassName}
        >
          <span>{selectedOption?.label ?? ''}</span>
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
            className={listClassName}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isFocused = index === focusedIndex;
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    select(option.value);
                  }}
                  onMouseEnter={() => setFocusedIndex(index)}
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
