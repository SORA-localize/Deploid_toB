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
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground hover:border-foreground/40'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
