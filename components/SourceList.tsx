import type { Source } from '@/data/types';
import { reliabilityLabels } from '@/lib/labels';
import { uiText } from '@/lib/uiText';
import { cn } from '@/lib/utils';
import { getReliabilityTone, getVisualToneClassName } from '@/lib/visualSemantics';

interface SourceListProps {
  id?: string;
  title?: string;
  sources: readonly Source[];
  emptyMessage?: string;
  className?: string;
  titleClassName?: string;
}

export function SourceList({
  id = 'sources',
  title = uiText.common.resources,
  sources,
  emptyMessage = uiText.emptyStates.sources,
  className = 'border border-border bg-card p-6 scroll-mt-site-header',
  titleClassName = 'text-lg font-semibold text-foreground mb-4',
}: SourceListProps) {
  return (
    <div id={id} className={className}>
      <h2 className={titleClassName}>{title}</h2>
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
