import type { Source } from '@/data/types';
import { reliabilityLabels } from '@/lib/labels';
import { uiText } from '@/lib/uiText';

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
  className = 'border border-neutral-300 bg-white p-6 scroll-mt-6',
  titleClassName = 'text-lg font-semibold text-neutral-900 mb-4',
}: SourceListProps) {
  return (
    <div id={id} className={className}>
      <h2 className={titleClassName}>{title}</h2>
      {sources.length === 0 ? (
        <p className="text-xs text-neutral-500">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2 text-xs">
          {sources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="text-neutral-900 hover:text-neutral-600 underline"
              >
                {source.title}
              </a>
              <span className="text-neutral-500">
                {source.publisher ? ` / ${source.publisher}` : ''} / 確認 {source.checkedAt}{' '}
                / {reliabilityLabels[source.reliability]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
