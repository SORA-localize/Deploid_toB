'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [draftValue, setDraftValue] = useState(value);
  const isComposingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isComposingRef.current) {
      setDraftValue(value);
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const clearPendingCommit = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  };

  const commitValue = (nextValue: string) => {
    clearPendingCommit();
    onChange(nextValue);
  };

  const scheduleCommit = (nextValue: string) => {
    clearPendingCommit();
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      onChange(nextValue);
    }, 250);
  };

  return (
    <SearchField
      aria-label={ariaLabel ?? placeholder}
      autoComplete="off"
      className={className}
      clearLabel={uiText.controls.clearSearch}
      inputClassName={inputClassName}
      placeholder={placeholder}
      value={draftValue}
      variant="underline"
      onCompositionStart={() => {
        isComposingRef.current = true;
        clearPendingCommit();
      }}
      onCompositionEnd={(event) => {
        isComposingRef.current = false;
        const nextValue = event.currentTarget.value;
        setDraftValue(nextValue);
        commitValue(nextValue);
      }}
      onValueChange={(nextValue) => {
        setDraftValue(nextValue);
        if (!isComposingRef.current) {
          scheduleCommit(nextValue);
        }
      }}
    />
  );
}
