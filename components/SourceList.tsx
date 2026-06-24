import type { Source } from '@/data/types';
import { reliabilityLabels } from '@/lib/labels';
import { uiText } from '@/lib/uiText';
import { cn } from '@/lib/utils';
import { getReliabilityTone, getVisualToneClassName } from '@/lib/visualSemantics';

const titleVariantClassNames = {
  default: 'text-lg font-semibold text-foreground mb-4',
  meta: 'mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground',
} as const;

interface SourceListProps {
  id?: string;
  title?: string;
  sources: readonly Source[];
  emptyMessage?: string;
  className?: string;
  titleClassName?: string;
  /** 見出しのスタイルプリセット。`titleClassName` を指定した場合はそちらが優先される。
   * 'meta': 記事本文内の出典セクション見出し用（reports/guides の本文メタ見出しと同じ見た目） */
  titleVariant?: keyof typeof titleVariantClassNames;
}

export function SourceList({
  id = 'sources',
  title = uiText.common.resources,
  sources,
  emptyMessage = uiText.emptyStates.sources,
  className = 'mt-6 border border-border bg-card p-6 scroll-mt-site-header',
  titleClassName,
  titleVariant = 'default',
}: SourceListProps) {
  const resolvedTitleClassName = titleClassName ?? titleVariantClassNames[titleVariant];
  return (
    <div id={id} className={className}>
      <h2 className={resolvedTitleClassName}>{title}</h2>
      {sources.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2 text-xs">
          {sources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="text-foreground hover:text-muted-foreground underline"
              >
                {source.title}
              </a>
              <span className="text-muted-foreground">
                {source.publisher ? ` / ${source.publisher}` : ''} / 確認 {source.checkedAt}{' '}
              </span>
              <span
                className={cn(
                  'ml-1 inline-flex border px-1.5 py-0.5 text-[10px] font-medium',
                  getVisualToneClassName(getReliabilityTone(source.reliability)),
                )}
              >
                {reliabilityLabels[source.reliability]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
