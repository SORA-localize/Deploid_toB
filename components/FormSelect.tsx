'use client';

import { ChevronDown } from 'lucide-react';

export type FormSelectOption = { value: string; label: string };

interface FormSelectProps {
  id: string;
  name: string;
  label: string;
  options: readonly FormSelectOption[];
  defaultValue?: string;
  required?: boolean;
  className?: string;
}

export function FormSelect({
  id,
  name,
  label,
  options,
  defaultValue,
  required = false,
  className = '',
}: FormSelectProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-xs font-medium text-foreground mb-2">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          name={name}
          defaultValue={defaultValue ?? options[0]?.value}
          required={required}
          className="h-10 w-full appearance-none rounded-md border border-border bg-input-background px-3 py-2 pr-9 text-sm text-foreground transition-colors outline-none focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
      </div>
    </div>
  );
}
