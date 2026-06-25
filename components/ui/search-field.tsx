"use client"

import * as React from "react"
import { Search, X } from "lucide-react"

import { cn } from "@/lib/utils"

interface SearchFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "type" | "value"> {
  clearLabel: string
  inputClassName?: string
  label?: string
  onValueChange: (value: string) => void
  value: string
  variant?: 'default' | 'underline'
}

const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(
  (
    {
      className,
      clearLabel,
      disabled,
      id,
      inputClassName,
      label,
      onValueChange,
      value,
      variant = 'default',
      ...props
    },
    ref
  ) => {
    const canClear = value.length > 0 && !disabled
    const isUnderline = variant === 'underline'

    return (
      <div className={className}>
        {label && (
          <label htmlFor={id} className="mb-2 block text-xs text-muted-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          <Search
            className={cn(
              "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
              isUnderline ? "h-5 w-5" : "h-4 w-4"
            )}
          />
          <input
            ref={ref}
            id={id}
            type="search"
            value={value}
            disabled={disabled}
            onChange={(event) => onValueChange(event.target.value)}
            className={cn(
              "w-full appearance-none text-foreground outline-none transition-colors placeholder:text-muted-foreground [&::-webkit-search-decoration]:hidden [&::-webkit-search-cancel-button]:hidden disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
              isUnderline
                ? "min-h-11 rounded-none border-0 border-b border-border bg-transparent py-3 pl-11 pr-10 text-sm focus-visible:border-ring focus-visible:ring-0"
                : "min-h-11 rounded-md border border-border bg-input-background py-3 pl-10 pr-10 text-sm focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:bg-input/50",
              inputClassName
            )}
            {...props}
          />
          {canClear && (
            <button
              type="button"
              aria-label={clearLabel}
              onClick={() => onValueChange("")}
              className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }
)

SearchField.displayName = "SearchField"

export { SearchField }
