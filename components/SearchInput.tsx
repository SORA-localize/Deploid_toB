'use client';

import { SearchField } from '@/components/ui/search-field';
import { uiText } from '@/lib/uiText';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel?: string;
  className?: string;
  inputClassName?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className = '',
  inputClassName = '',
}: SearchInputProps) {
  return (
    <SearchField
      aria-label={ariaLabel ?? placeholder}
      autoComplete="off"
      className={className}
      clearLabel={uiText.controls.clearSearch}
      inputClassName={inputClassName}
      placeholder={placeholder}
      value={value}
      onValueChange={onChange}
    />
  );
}
