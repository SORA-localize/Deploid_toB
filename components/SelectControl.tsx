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
 * 閾値の根拠は docs/archive/compare-and-catalog-ui-improvement-plan-v1.md §2
 * （地域10 / メーカー27 の間に境界を置く）。
 */
const SEARCHABLE_MIN_OPTIONS = 12;

/**
 * Radix の `Select.Item` は空文字の `value` を禁止する（空文字は「選択をクリアする」ために
 * `Select` 側が予約しているため）。一方 React のフォーム慣習では「未選択」は空文字で表す。
 * この2つの規約の変換がこのコンポーネントの責務なので、Radix 経路に入る直前だけ空文字を
 * この内部 sentinel へ写し、`onChange` で空文字へ戻す。呼び出し側は空文字のまま扱ってよい。
 *
 * これが無いと、空文字 option を渡した呼び出し側は**ページ全体がクライアント側で落ちる**
 * （error boundary の「ページを表示できませんでした」になる）。しかも Radix 経路へ入るのは
 * `options.length < SEARCHABLE_MIN_OPTIONS` のときだけなので、選択肢が多い環境では再現せず、
 * 少ない環境でだけ落ちるというデータ依存の不具合になる。実際 `/compare` は本番（メーカー26件）
 * では動き、CI fixture（メーカー2件）でだけ落ちていた。
 * 値そのものを持たない sentinel なので、呼び出し側の値空間とは衝突しない。
 */
const EMPTY_VALUE_SENTINEL = '__select-control-empty__';

const toRadixValue = (value: string) => (value === '' ? EMPTY_VALUE_SENTINEL : value);
const fromRadixValue = (value: string) => (value === EMPTY_VALUE_SENTINEL ? '' : value);

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
        <Select
          value={toRadixValue(value)}
          onValueChange={(next) => onChange(fromRadixValue(next))}
          required={required}
        >
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
              <SelectItem
                key={option.value}
                value={toRadixValue(option.value)}
                disabled={option.disabled}
              >
                {withCount(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
