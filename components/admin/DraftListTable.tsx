'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Link, useConfig, useTranslation } from '@payloadcms/ui';
import {
  type AdminPublishErrorCode,
  type AdminPublishMessageKey,
  adminPublishMessageKey,
} from '@/lib/payload/adminPublishMessages';
import { DRAFT_LIST_COLLECTION_LABELS, PUBLISHABLE_COLLECTIONS } from '@/lib/payload/adminPublishableCollections';
import type { ApprovableCollectionSlug } from '@/lib/payload/publishApprovedVersion';
import type { DraftListItem } from '@/lib/payload/listDraftDocumentsForAdmin';
import type { BulkPublishItemResult } from '@/lib/payload/bulkPublishFromAdmin';

/**
 * `/admin/draft-list` の本体。`DraftListView.tsx`（server）から初期データを受け取り、
 * 選択状態と「選択したN件を公開」の実行はここ（client）で持つ。
 *
 * ## レイアウト
 *
 * 「選択したN件を公開」は見出し直下の操作バーに置く（コンテンツ最下部だと、コレクション数・
 * 件数が増えるほどボタンまでスクロールが必要になり実用に耐えない）。一覧そのものは
 * コレクションごとに折りたたみ可能なセクション（カスケード）へ分け、各セクションの見出しに
 * 「このコレクションをすべて選択」チェックボックスを置く——コレクション単位でまとめて選ぶ操作が
 * 個別チェックより圧倒的に多いという想定（`docs`の運用より）。
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

/** 3値(未選択/一部選択/全選択)を持つネイティブcheckbox。`indeterminate`はDOM propertyのみで
 *  React属性としては存在しないため、refへ命令的に設定する。 */
function TriStateCheckbox({
  checked,
  indeterminate,
  onChange,
  onClick,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  onClick?: (event: React.MouseEvent) => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      onClick={onClick}
      aria-label={ariaLabel}
    />
  );
}

export function DraftListTable({ initialItems, canPublish }: DraftListTableProps) {
  const { config } = useConfig();
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState(initialItems);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<BulkPublishItemResult[] | null>(null);
  const [inFlight, setInFlight] = useState(false);

  const locale = i18n.language === 'ja' ? 'ja' : 'en';

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

  const toggleGroup = useCallback((groupItems: DraftListItem[], checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const item of groupItems) {
        const key = rowKey(item.collection, item.id);
        if (checked) next.add(key);
        else next.delete(key);
      }
      return next;
    });
  }, []);

  const selectedItems = useMemo(
    () => items.filter((item) => selected.has(rowKey(item.collection, item.id))),
    [items, selected],
  );

  /** コレクションごとにグループ化し、`PUBLISHABLE_COLLECTIONS`の宣言順(≒サイドナビの並び)を保つ。
   *  1件も無いコレクションのセクションは出さない。 */
  const groups = useMemo(() => {
    const byCollection = new Map<ApprovableCollectionSlug, DraftListItem[]>();
    for (const collection of Object.keys(PUBLISHABLE_COLLECTIONS) as ApprovableCollectionSlug[]) {
      byCollection.set(collection, []);
    }
    for (const item of items) {
      byCollection.get(item.collection)?.push(item);
    }
    return Array.from(byCollection.entries()).filter(([, groupItems]) => groupItems.length > 0);
  }, [items]);

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
      {canPublish && (
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '0.75rem 0',
            marginBottom: '1rem',
            background: 'var(--theme-elevation-0)',
            borderBottom: '1px solid var(--theme-elevation-100)',
          }}
        >
          <span>{message('draft-list-selected-count', { count: String(selected.size) })}</span>
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

      {groups.map(([collection, groupItems]) => {
        const groupKeys = groupItems.map((item) => rowKey(item.collection, item.id));
        const selectedInGroup = groupKeys.filter((key) => selected.has(key)).length;
        const collectionLabel = DRAFT_LIST_COLLECTION_LABELS[collection][locale];

        return (
          <details key={collection} open style={{ marginBottom: '1rem' }}>
            <summary
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {canPublish && (
                <TriStateCheckbox
                  checked={selectedInGroup === groupKeys.length}
                  indeterminate={selectedInGroup > 0 && selectedInGroup < groupKeys.length}
                  onChange={() => toggleGroup(groupItems, selectedInGroup !== groupKeys.length)}
                  onClick={(event) => event.stopPropagation()}
                  ariaLabel={message('draft-list-group-select-all', { collection: collectionLabel })}
                />
              )}
              <span>{collectionLabel}</span>
              <span style={{ fontWeight: 400, color: 'var(--theme-elevation-500)' }}>
                {message('draft-list-group-count', { count: String(groupItems.length) })}
              </span>
            </summary>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {canPublish && <th style={{ textAlign: 'left', padding: '8px 4px' }} />}
                  <th style={{ textAlign: 'left', padding: '8px 4px' }}>{message('draft-list-column-title')}</th>
                  <th style={{ textAlign: 'left', padding: '8px 4px' }}>{message('draft-list-column-updated-at')}</th>
                  <th style={{ textAlign: 'left', padding: '8px 4px' }} />
                </tr>
              </thead>
              <tbody>
                {groupItems.map((item) => {
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
          </details>
        );
      })}

      {results && (
        <div style={{ marginTop: '1.5rem' }}>
          <h2>{message('draft-list-results-heading')}</h2>
          <ul>
            {results.map((result) => (
              <li key={rowKey(result.collection, result.id)}>
                {DRAFT_LIST_COLLECTION_LABELS[result.collection][locale]} / {String(result.id)}:{' '}
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
