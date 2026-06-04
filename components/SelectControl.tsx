'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  required?: boolean;
}

export function SelectControl({
  id,
  label,
  value,
  options,
  onChange,
  className = '',
  required = false,
}: SelectControlProps) {
  return (
    <div className={className}>
      <label htmlFor={`${id}-trigger`} className="mb-2 block text-xs text-muted-foreground">
        {label}
      </label>
      <Select value={value} onValueChange={onChange} required={required}>
        <SelectTrigger
          id={`${id}-trigger`}
          className="h-auto w-full border-border bg-input-background px-3 py-2 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:border-ring"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="min-w-(--radix-select-trigger-width)">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
