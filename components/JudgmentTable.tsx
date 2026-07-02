import { Check, CircleAlert, Minus, ShieldAlert, type LucideIcon } from 'lucide-react';
import { DefinitionList } from '@/components/DefinitionList';
import { getVisualToneTextClassName, type VisualTone } from '@/lib/visualSemantics';
import { cn } from '@/lib/utils';

/**
 * 定性判断（強み/留意点/リスク、確認あり/限定的/なし 等）を見せるための密なdt/ddテーブル。
 * 数値化できない判断をグラフで捏造しないための代替表現。ドメインの列挙値には依存せず、
 * 呼び出し側が lib/visualSemantics.ts の tone マップで VisualTone に正規化して渡す。
 * レイアウトは DefinitionList の 'judgment' バリアントに委譲する。
 */
export interface JudgmentRow {
  key: string;
  label: string;
  statusLabel: string;
  tone: VisualTone;
  body: string;
}

const TONE_ICON: Record<VisualTone, LucideIcon> = {
  success: Check,
  brand: Check,
  favorite: Check,
  info: CircleAlert,
  warning: CircleAlert,
  danger: ShieldAlert,
  neutral: Minus,
  unknown: Minus,
};

export function JudgmentTable({ rows }: { rows: JudgmentRow[] }) {
  return (
    <DefinitionList
      variant="judgment"
      rows={rows.map((row) => {
        const Icon = TONE_ICON[row.tone];
        return {
          label: (
            <span className="flex items-start gap-2">
              <Icon
                aria-hidden="true"
                className={cn('mt-0.5 h-4 w-4 shrink-0', getVisualToneTextClassName(row.tone))}
              />
              <span>
                <span className="block font-semibold leading-snug">{row.label}</span>
                <span className="block text-xs text-muted-foreground">{row.statusLabel}</span>
              </span>
            </span>
          ),
          value: row.body,
        };
      })}
    />
  );
}
