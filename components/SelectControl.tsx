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
  labelClassName = 'mb-2 block text-xs text-muted-foreground',
  buttonClassName = 'w-full flex items-center justify-between border border-border bg-input-background px-3 py-2 text-sm text-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:outline-none text-left transition-all',
  listClassName = 'absolute z-50 w-full border border-border bg-popover text-popover-foreground mt-px max-h-80 overflow-y-auto overscroll-contain shadow-lg animate-in fade-in zoom-in-95 duration-100',
  required = false,
}: SelectControlProps) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerId = `${id}-trigger`;
  const listId = `${id}-list`;

  const selectedOption = options.find((option) => option.value === value) ?? options[0];
  const activeOptionId = open && focusedIndex >= 0 ? `${id}-option-${focusedIndex}` : undefined;

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
          aria-activedescendant={activeOptionId}
          aria-required={required || undefined}
          onKeyDown={handleKeyDown}
          onClick={() => setOpen((current) => !current)}
          className={buttonClassName}
        >
          <span>{selectedOption?.label ?? ''}</span>
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={`shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
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
                  id={`${id}-option-${index}`}
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
                      ? 'bg-primary text-primary-foreground'
                      : isFocused
                        ? 'bg-muted text-foreground'
                        : 'text-popover-foreground hover:bg-muted'
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
