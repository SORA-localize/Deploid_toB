'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

export type UrlParamValue = string | null | undefined;
export type UrlUpdateMode = 'push' | 'replace';

const URL_CHANGE_EVENT = 'deploid:urlchange';

function normalizeInitialSearch(initialSearch: string) {
  if (!initialSearch) return '';
  return initialSearch.startsWith('?') ? initialSearch : `?${initialSearch}`;
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener('popstate', onStoreChange);
  window.addEventListener(URL_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('popstate', onStoreChange);
    window.removeEventListener(URL_CHANGE_EVENT, onStoreChange);
  };
}

function getBrowserSnapshot() {
  return window.location.search;
}

export function updateCatalogUrl(
  updates: Record<string, UrlParamValue>,
  mode: UrlUpdateMode = 'push',
) {
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(updates)) {
    const normalized = value?.trim();
    if (!normalized) params.delete(key);
    else params.set(key, normalized);
  }
  const query = params.toString();
  const href = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  const method = mode === 'replace' ? 'replaceState' : 'pushState';
  window.history[method](window.history.state, '', href);
  window.dispatchEvent(new Event(URL_CHANGE_EVENT));
}

export function useCatalogUrlState(initialSearch: string) {
  const serverSnapshot = normalizeInitialSearch(initialSearch);
  const search = useSyncExternalStore(subscribe, getBrowserSnapshot, () => serverSnapshot);
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const updateParams = useCallback(
    (updates: Record<string, UrlParamValue>, mode: UrlUpdateMode = 'push') =>
      updateCatalogUrl(updates, mode),
    [],
  );
  return { searchParams, updateParams };
}
