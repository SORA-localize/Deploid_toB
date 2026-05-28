'use client';

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
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
