'use client';

import { useCallback, useMemo, useState } from 'react';
import { Button, Link, useConfig, useTranslation } from '@payloadcms/ui';
import {
  type AdminPublishErrorCode,
  type AdminPublishMessageKey,
  adminPublishMessageKey,
} from '@/lib/payload/adminPublishMessages';
import type { DraftListItem } from '@/lib/payload/listDraftDocumentsForAdmin';
import type { BulkPublishItemResult } from '@/lib/payload/bulkPublishFromAdmin';

/**
 * `/admin/draft-list` の本体。`DraftListView.tsx`（server）から初期データを受け取り、
 * 選択状態と「選択したN件を公開」の実行はここ（client）で持つ。
 *
 * `canPublish=false`（content-draft-writerロール）のときはチェックボックス・公開ボタンを
 * 出さず一覧のみ表示する——`DraftListView.tsx`側で既にrole判定は済んでいるが、propsの形で
 * 明示することで「なぜここにcheckboxが無いか」がこのファイル単体で読んで分かるようにする。
 */

function rowKey(collection: string, id: string | number): string {
  return `${collection}:${id}`;
}

export interface DraftListTableProps {
  initialItems: DraftListItem[];
  canPublish: boolean;
}

export function DraftListTable({ initialItems, canPublish }: DraftListTableProps) {
  const { config } = useConfig();
  const { t } = useTranslation();
  const [items, setItems] = useState(initialItems);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<BulkPublishItemResult[] | null>(null);
  const [inFlight, setInFlight] = useState(false);

  const message = useCallback(
    (code: AdminPublishMessageKey, vars?: Record<string, string | undefined>) =>
      (t as unknown as (key: string, vars?: Record<string, unknown>) => string)(adminPublishMessageKey(code), vars),
    [t],
  );

  const toggle = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const selectedItems = useMemo(
    () => items.filter((item) => selected.has(rowKey(item.collection, item.id))),
    [items, selected],
  );

  const publishSelected = useCallback(async () => {
    if (selectedItems.length === 0) return;
    setInFlight(true);
    try {
      const response = await fetch(`${config.routes.api}/admin/publish/bulk`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems.map((item) => ({ collection: item.collection, id: item.id })),
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: AdminPublishErrorCode };
        const code: AdminPublishErrorCode = body.error ?? 'publish-internal-error';
        setResults([
          ...selectedItems.map((item) => ({
            collection: item.collection,
            id: item.id,
            ok: false as const,
            error: code,
          })),
        ]);
        return;
      }

      const body = (await response.json()) as { results: BulkPublishItemResult[] };
      setResults(body.results);

      const succeededKeys = new Set(
        body.results.filter((r) => r.ok).map((r) => rowKey(r.collection, r.id)),
      );
      setItems((prev) => prev.filter((item) => !succeededKeys.has(rowKey(item.collection, item.id))));
      setSelected((prev) => {
        const next = new Set(prev);
        for (const key of succeededKeys) next.delete(key);
        return next;
      });
    } catch {
      setResults(
        selectedItems.map((item) => ({
          collection: item.collection,
          id: item.id,
          ok: false as const,
          error: 'publish-internal-error',
        })),
      );
    } finally {
      setInFlight(false);
    }
  }, [config.routes.api, selectedItems]);

  if (items.length === 0 && !results) {
    return <p>{message('draft-list-empty')}</p>;
  }

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {canPublish && <th style={{ textAlign: 'left', padding: '8px 4px' }} />}
            <th style={{ textAlign: 'left', padding: '8px 4px' }}>{message('draft-list-column-collection')}</th>
            <th style={{ textAlign: 'left', padding: '8px 4px' }}>{message('draft-list-column-title')}</th>
            <th style={{ textAlign: 'left', padding: '8px 4px' }}>{message('draft-list-column-updated-at')}</th>
            <th style={{ textAlign: 'left', padding: '8px 4px' }} />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const key = rowKey(item.collection, item.id);
            return (
              <tr key={key} style={{ borderTop: '1px solid var(--theme-elevation-100)' }}>
                {canPublish && (
                  <td style={{ padding: '8px 4px' }}>
                    <input
                      type="checkbox"
                      checked={selected.has(key)}
                      onChange={() => toggle(key)}
                      aria-label={item.title}
                    />
                  </td>
                )}
                <td style={{ padding: '8px 4px' }}>{item.collection}</td>
                <td style={{ padding: '8px 4px' }}>{item.title}</td>
                <td style={{ padding: '8px 4px' }}>{item.updatedAt}</td>
                <td style={{ padding: '8px 4px' }}>
                  <Link href={`${config.routes.admin}/collections/${item.collection}/${item.id}`}>
                    {message('draft-list-edit-link')}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {canPublish && (
        <div style={{ marginTop: '1rem' }}>
          <Button
            buttonStyle="primary"
            disabled={selected.size === 0 || inFlight}
            onClick={publishSelected}
            size="medium"
            type="button"
          >
            {message('draft-list-publish-selected', { count: String(selected.size) })}
          </Button>
        </div>
      )}

      {results && (
        <div style={{ marginTop: '1.5rem' }}>
          <h2>{message('draft-list-results-heading')}</h2>
          <ul>
            {results.map((result) => (
              <li key={rowKey(result.collection, result.id)}>
                {result.collection} / {String(result.id)}:{' '}
                {result.ok ? message('publish-succeeded') : message(result.error, { fields: result.fields?.join(', ') })}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default DraftListTable;
