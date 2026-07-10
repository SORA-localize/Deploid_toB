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
  /** ファセットの該当件数。指定すると「ラベル (件数)」で表示する。 */
  count?: number;
  /** 0件などで選択不可にする。Select/SearchableDropdown 両系統で無効化される。 */
  disabled?: boolean;
}

/**
 * searchable 指定時でも、選択肢がこの数未満なら検索窓なしの通常 Select にする。
 * 一覧して選べる規模（例: 地域10件）に検索UIは過剰なため。
 * 閾値の根拠は docs/planning/compare-and-catalog-ui-improvement-plan-v1.md §2
 * （地域10 / メーカー27 の間に境界を置く）。
 */
const SEARCHABLE_MIN_OPTIONS = 12;

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
  const withCount = (option: SelectControlOption) =>
    option.count != null ? `${option.label} (${option.count})` : option.label;

  const showSearch = searchable && options.length >= SEARCHABLE_MIN_OPTIONS;

  return (
    <div className={className}>
      <label htmlFor={`${id}-trigger`} className="mb-2 block text-xs text-muted-foreground">
        {label}
      </label>
      {showSearch ? (
        <SearchableDropdown
          id={id}
          label={label}
          value={value}
          onValueChange={onChange}
          items={options.map((option) => ({ ...option, label: withCount(option) }))}
          triggerId={`${id}-trigger`}
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
          <SelectContent
            position="popper"
            className="w-(--radix-select-trigger-width) min-w-0"
          >
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                {withCount(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
