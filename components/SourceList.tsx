import type { Source } from '@/data/types';
import { uiText } from '@/lib/uiText';

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
   * 'meta': 記事本文内の出典セクション見出し用（reports の本文メタ見出しと同じ見た目） */
  titleVariant?: keyof typeof titleVariantClassNames;
}

export function SourceList({
  id = 'sources',
  title = uiText.common.resources,
  sources,
  emptyMessage = uiText.emptyStates.sources,
  // 出典欄はカード面にしない（design_system_v1.md「本文ブロックに矩形背景を貼らない」）。
  className = 'mt-6 scroll-mt-site-header',
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
            <li key={source.url} className="break-words [overflow-wrap:anywhere]">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline hover:text-muted-foreground"
              >
                {source.title}
              </a>
              <span className="text-muted-foreground break-words [overflow-wrap:anywhere]">
                {source.publisher ? ` / ${source.publisher}` : ''} / 確認 {source.checkedAt}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
