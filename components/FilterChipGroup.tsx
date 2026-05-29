'use client';

export interface FilterChipOption<T extends string> {
  value: T;
  label: string;
}

interface FilterChipGroupProps<T extends string> {
  options: readonly FilterChipOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  allowDeselect?: boolean;
  onClear?: () => void;
  ariaLabel?: string;
  className?: string;
  buttonClassName?: string;
}

const defaultButtonClassName = 'px-3 py-1.5 text-xs';

export function FilterChipGroup<T extends string>({
  options,
  value,
  onChange,
  allowDeselect = false,
  onClear,
  ariaLabel,
  className = '',
  buttonClassName = defaultButtonClassName,
}: FilterChipGroupProps<T>) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`} role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => {
              if (selected && allowDeselect) {
                onClear?.();
                return;
              }
              onChange(option.value);
            }}
            className={`${buttonClassName} border transition-colors ${
              selected
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
