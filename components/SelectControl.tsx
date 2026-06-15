'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import { uiText } from '@/lib/uiText';

export interface SelectControlOption {
  value: string;
  label: string;
  description?: string;
  keywords?: readonly string[];
}

interface SelectControlProps {
  id: string;
  label: string;
  value: string;
  options: readonly SelectControlOption[];
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  searchable?: boolean;
}

export function SelectControl({
  id,
  label,
  value,
  options,
  onChange,
  className = '',
  required = false,
  searchable = false,
}: SelectControlProps) {
  return (
    <div className={className}>
      <label htmlFor={`${id}-trigger`} className="mb-2 block text-xs text-muted-foreground">
        {label}
      </label>
      {searchable ? (
        <SearchableDropdown
          id={id}
          label={label}
          value={value}
          onValueChange={onChange}
          items={options}
          searchPlaceholder={uiText.controls.dropdownSearchPlaceholder(label)}
          searchAriaLabel={uiText.controls.dropdownSearchAria(label)}
          emptyMessage={uiText.controls.dropdownEmpty}
          clearSearchLabel={uiText.controls.clearSearch}
        />
      ) : (
        <Select value={value} onValueChange={onChange} required={required}>
          <SelectTrigger
            id={`${id}-trigger`}
            className="min-h-11 h-auto w-full px-3 py-2 text-sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" className="min-w-(--radix-select-trigger-width)">
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
