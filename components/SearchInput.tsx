'use client';

import { Search } from 'lucide-react';

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
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <input
        type="search"
        aria-label={ariaLabel ?? placeholder}
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full border border-neutral-300 bg-white py-3 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 transition-all focus:border-accent focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:outline-none ${inputClassName}`}
      />
    </div>
  );
}
