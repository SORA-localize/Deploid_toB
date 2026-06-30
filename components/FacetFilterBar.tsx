'use client';

import { useMemo } from 'react';
import { ActiveFilterChips, type ActiveFilterChip } from '@/components/ActiveFilterChips';
import { SelectControl, type SelectControlOption } from '@/components/SelectControl';
import type { FacetConfig } from '@/lib/facetConfig';
import { getTagLabel, matchesTag, toTagOptions } from '@/lib/tags';
import { uiText } from '@/lib/uiText';

interface FacetFilterBarProps<T extends { slug: string }> {
  /** 選択肢・件数の母集団（タブ等で事前に絞ったレコード）。 */
  items: readonly T[];
  facets: readonly FacetConfig<T>[];
  /** 現在のファセット選択（key→値、null/未指定で未選択）。 */
  values: Record<string, string | null>;
  /** フリーテキスト検索のマッチ slug 集合（件数計算に反映）。null=検索なし。 */
  matchedSlugs?: ReadonlySet<string> | null;
  /** 絞り込み後の総件数（「N件」表示用）。 */
  resultCount: number;
  /** いずれかのファセットor検索が有効か（件数・チップ行の表示制御）。 */
  active: boolean;
  /** SelectControl id の接頭辞。reports/use-cases で label 対応を一意に保つ。 */
  idPrefix: string;
  /** chips だけを非表示にする。件数表示は active 時に残す。 */
  showChips?: boolean;
  onChange: (key: string, value: string | null) => void;
}

/**
 * 設定駆動のファセット絞り込みバー。各ファセットの選択肢は「他のファセット＋検索で絞った
 * 部分集合」から件数つきで導出し、0件は無効化して行き止まりを防ぐ（動的ファセット）。
 * 他ファセットは自動リセットしない（選択は保持）。
 */
export function FacetFilterBar<T extends { slug: string }>({
  items,
  facets,
  values,
  matchedSlugs,
  resultCount,
  active,
  idPrefix,
  showChips = true,
  onChange,
}: FacetFilterBarProps<T>) {
  const optionsByKey = useMemo(() => {
    const result: Record<string, SelectControlOption[]> = {};
    for (const facet of facets) {
      // 当該ファセット以外の選択＋検索で母集団を絞る（＝このファセットを切り替えたら何件になるか）
      const subset = items.filter(
        (item) =>
          (!matchedSlugs || matchedSlugs.has(item.slug)) &&
          facets.every(
            (other) => other.key === facet.key || matchesTag(other.getValues(item), values[other.key]),
          ),
      );
      const countByValue = new Map<string, number>();
      toTagOptions(
        subset.flatMap((item) => facet.getValues(item)),
        facet.kind,
      ).forEach((option) => countByValue.set(option.value, option.count));

      // セクション内に存在する全選択肢を安定表示し、現在の絞り込みでの件数を添えて0件は無効化
      const poolOptions = toTagOptions(
        items.flatMap((item) => facet.getValues(item)),
        facet.kind,
      );
      const built: SelectControlOption[] = [
        { value: 'all', label: facet.allLabel },
        ...poolOptions.map((option) => {
          const count = countByValue.get(option.value) ?? 0;
          return { value: option.value, label: option.label, count, disabled: count === 0 };
        }),
      ];
      // URL直打ち等で section 母集団外の選択中値が来ても、Select トリガーが空にならないよう必ず含める
      const selected = values[facet.key];
      if (selected && !built.some((option) => option.value === selected)) {
        built.push({ value: selected, label: getTagLabel(selected, facet.kind), count: 0, disabled: true });
      }
      result[facet.key] = built;
    }
    return result;
  }, [items, facets, values, matchedSlugs]);

  const chips = useMemo<ActiveFilterChip[]>(() => {
    const list: ActiveFilterChip[] = [];
    for (const facet of facets) {
      const value = values[facet.key];
      if (value) {
        list.push({
          key: facet.key,
          label: getTagLabel(value, facet.kind),
          onRemove: () => onChange(facet.key, null),
        });
      }
    }
    return list;
  }, [facets, values, onChange]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 max-w-3xl">
        {facets.map((facet) => (
          <SelectControl
            key={facet.key}
            id={`${idPrefix}-${facet.key}`}
            label={facet.label}
            value={values[facet.key] ?? 'all'}
            onChange={(next) => onChange(facet.key, next === 'all' ? null : next)}
            options={optionsByKey[facet.key]}
          />
        ))}
      </div>

      {active && (
        <div className="flex items-center justify-between gap-3">
          {showChips ? <ActiveFilterChips chips={chips} /> : <div />}
          <span className="shrink-0 text-xs text-muted-foreground">
            {uiText.common.results(resultCount, true)}
          </span>
        </div>
      )}
    </div>
  );
}
