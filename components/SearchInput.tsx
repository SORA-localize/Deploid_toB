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
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        aria-label={ariaLabel ?? placeholder}
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full border border-border bg-input-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:outline-none ${inputClassName}`}
      />
    </div>
  );
}
