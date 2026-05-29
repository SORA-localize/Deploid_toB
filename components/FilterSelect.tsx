'use client';

import { SelectControl, type SelectControlOption } from '@/components/SelectControl';

export type FilterSelectOption = SelectControlOption;

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
    <SelectControl
      id={id}
      label={label}
      value={value}
      options={options}
      onChange={onChange}
      className={className}
    />
  );
}
