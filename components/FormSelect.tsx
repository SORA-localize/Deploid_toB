'use client';

import { useState } from 'react';
import { SelectControl, type SelectControlOption } from '@/components/SelectControl';

export type FormSelectOption = SelectControlOption;

interface FormSelectProps {
  id: string;
  name: string;
  label: string;
  options: readonly FormSelectOption[];
  defaultValue?: string;
  required?: boolean;
  className?: string;
  includeLabelField?: boolean;
}

export function FormSelect({
  id,
  name,
  label,
  options,
  defaultValue,
  required = false,
  className = '',
  includeLabelField = true,
}: FormSelectProps) {
  const initial = options.find((option) => option.value === defaultValue) ?? options[0];
  const [selectedValue, setSelectedValue] = useState(initial?.value ?? '');
  const selected = options.find((option) => option.value === selectedValue) ?? initial;

  return (
    <>
      <input type="hidden" name={name} value={selectedValue} required={required} />
      {includeLabelField && (
        <input type="hidden" name={`${name}Label`} value={selected?.label ?? ''} />
      )}
      <SelectControl
        id={id}
        label={label}
        value={selectedValue}
        options={options}
        onChange={setSelectedValue}
        className={className}
        labelClassName="block text-xs font-medium text-neutral-900 mb-2"
        buttonClassName="w-full flex items-center justify-between px-3 py-2 border border-neutral-300 bg-white text-sm text-neutral-900 focus:outline-none focus:border-neutral-500 text-left"
        required={required}
      />
    </>
  );
}
