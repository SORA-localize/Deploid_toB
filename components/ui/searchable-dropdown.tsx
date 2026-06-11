"use client"

import * as React from "react"
import { CheckIcon, ChevronDownIcon } from "lucide-react"
import { Popover as PopoverPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { SearchField } from "@/components/ui/search-field"

export interface SearchableDropdownItem {
  description?: string
  disabled?: boolean
  icon?: React.ReactNode
  keywords?: readonly string[]
  label: string
  value: string
}

interface SearchableDropdownProps {
  className?: string
  clearSearchLabel: string
  emptyMessage: string
  id: string
  items: readonly SearchableDropdownItem[]
  label: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchAriaLabel: string
  searchPlaceholder: string
  triggerClassName?: string
  value: string
}

const normalizeForSearch = (value: string) => value.trim().toLowerCase()

export function SearchableDropdown({
  className,
  clearSearchLabel,
  emptyMessage,
  id,
  items,
  label,
  onValueChange,
  placeholder,
  searchAriaLabel,
  searchPlaceholder,
  triggerClassName,
  value,
}: SearchableDropdownProps) {
  const reactId = React.useId()
  const baseId = `${id}-${reactId}`
  const triggerId = `${baseId}-trigger`
  const inputId = `${baseId}-input`
  const listboxId = `${baseId}-listbox`
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [activeIndex, setActiveIndex] = React.useState(-1)

  const selectedItem = React.useMemo(
    () => items.find((item) => item.value === value),
    [items, value]
  )

  const filteredItems = React.useMemo(() => {
    const normalizedQuery = normalizeForSearch(query)
    if (!normalizedQuery) {
      return items
    }

    return items.filter((item) => {
      const haystack = [
        item.label,
        item.description,
        ...(item.keywords ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [items, query])

  const getOptionId = React.useCallback(
    (index: number) => `${baseId}-option-${index}`,
    [baseId]
  )

  const activeOptionId =
    activeIndex >= 0 && filteredItems[activeIndex] ? getOptionId(activeIndex) : undefined

  const moveActiveIndex = React.useCallback(
    (direction: 1 | -1) => {
      if (filteredItems.length === 0) {
        setActiveIndex(-1)
        return
      }

      const startIndex = activeIndex < 0 ? (direction === 1 ? -1 : 0) : activeIndex
      for (let offset = 1; offset <= filteredItems.length; offset++) {
        const nextIndex =
          (startIndex + direction * offset + filteredItems.length) % filteredItems.length
        if (!filteredItems[nextIndex]?.disabled) {
          setActiveIndex(nextIndex)
          return
        }
      }

      setActiveIndex(-1)
    },
    [activeIndex, filteredItems]
  )

  const setFirstEnabledIndex = React.useCallback(() => {
    setActiveIndex(filteredItems.findIndex((item) => !item.disabled))
  }, [filteredItems])

  const setLastEnabledIndex = React.useCallback(() => {
    for (let index = filteredItems.length - 1; index >= 0; index--) {
      if (!filteredItems[index]?.disabled) {
        setActiveIndex(index)
        return
      }
    }
    setActiveIndex(-1)
  }, [filteredItems])

  const closeAndRestoreFocus = React.useCallback(() => {
    setOpen(false)
    setQuery("")
    setActiveIndex(-1)
    window.setTimeout(() => triggerRef.current?.focus(), 0)
  }, [])

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    setOpen(nextOpen)
    setQuery("")
    setActiveIndex(-1)
  }, [])

  const handleSelect = React.useCallback(
    (item: SearchableDropdownItem) => {
      if (item.disabled) {
        return
      }
      onValueChange(item.value)
      closeAndRestoreFocus()
    },
    [closeAndRestoreFocus, onValueChange]
  )

  React.useEffect(() => {
    if (!open) {
      return
    }

    const frame = window.requestAnimationFrame(() => inputRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  React.useEffect(() => {
    if (!activeOptionId) {
      return
    }
    document.getElementById(activeOptionId)?.scrollIntoView({ block: "nearest" })
  }, [activeOptionId])

  React.useEffect(() => {
    setActiveIndex(-1)
  }, [query])

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <div className={cn("relative", className)}>
        <PopoverPrimitive.Trigger asChild>
          <button
            ref={triggerRef}
            id={triggerId}
            type="button"
            aria-controls={open ? listboxId : undefined}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-label={`${label}: ${selectedItem?.label ?? placeholder ?? label}`}
            className={cn(
              "flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-border bg-input-background px-3 py-2 text-left text-sm text-foreground transition-colors outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
              triggerClassName
            )}
          >
            <span className="block truncate">{selectedItem?.label ?? placeholder ?? label}</span>
            <ChevronDownIcon
              aria-hidden="true"
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150",
                open && "rotate-180"
              )}
            />
          </button>
        </PopoverPrimitive.Trigger>
      </div>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          collisionPadding={8}
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="z-50 w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-1rem)] rounded-md border border-border bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 data-[side=bottom]:animate-in data-[side=bottom]:fade-in-0 data-[side=bottom]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 motion-reduce:animate-none"
        >
          <div className="border-b border-border p-2">
            <SearchField
              ref={inputRef}
              id={inputId}
              role="combobox"
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-activedescendant={activeOptionId}
              aria-expanded={open}
              aria-label={searchAriaLabel}
              autoComplete="off"
              clearLabel={clearSearchLabel}
              inputClassName="min-h-10 py-2"
              placeholder={searchPlaceholder}
              value={query}
              onValueChange={setQuery}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault()
                  closeAndRestoreFocus()
                  return
                }
                if (event.key === "ArrowDown") {
                  event.preventDefault()
                  moveActiveIndex(1)
                  return
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault()
                  moveActiveIndex(-1)
                  return
                }
                if (event.key === "Home") {
                  event.preventDefault()
                  setFirstEnabledIndex()
                  return
                }
                if (event.key === "End") {
                  event.preventDefault()
                  setLastEnabledIndex()
                  return
                }
                if (event.key === "Enter" && activeIndex >= 0) {
                  event.preventDefault()
                  const activeItem = filteredItems[activeIndex]
                  if (activeItem) {
                    handleSelect(activeItem)
                  }
                  return
                }
                if (event.key === "Tab") {
                  setOpen(false)
                }
              }}
            />
          </div>
          <ul
            id={listboxId}
            role="listbox"
            aria-label={label}
            className="max-h-60 overflow-y-auto p-1"
          >
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => {
                const selected = item.value === value
                const active = index === activeIndex
                return (
                  <li key={item.value} role="none">
                    <button
                      id={getOptionId(index)}
                      type="button"
                      role="option"
                      tabIndex={-1}
                      aria-disabled={item.disabled || undefined}
                      aria-selected={selected}
                      disabled={item.disabled}
                      onMouseEnter={() => {
                        if (!item.disabled) {
                          setActiveIndex(index)
                        }
                      }}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelect(item)}
                      className={cn(
                        "flex min-h-10 w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm transition-colors outline-none disabled:pointer-events-none disabled:opacity-50",
                        active ? "bg-muted text-foreground" : "hover:bg-muted",
                        selected && "font-medium text-foreground"
                      )}
                    >
                      {item.icon && <span className="shrink-0">{item.icon}</span>}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{item.label}</span>
                        {item.description && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        )}
                      </span>
                      {selected && (
                        <CheckIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-foreground" />
                      )}
                    </button>
                  </li>
                )
              })
            ) : (
              <li className="px-3 py-8 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </li>
            )}
          </ul>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
