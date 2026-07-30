// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useCatalogUrlState } from '@/lib/catalog/urlState';

describe('useCatalogUrlState', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/robots?q=old');
  });

  it('replaces a parameter without navigating the document', () => {
    const { result } = renderHook(() => useCatalogUrlState('?q=old'));
    act(() => result.current.updateParams({ q: 'new', industry: 'logistics' }, 'replace'));
    expect(window.location.pathname).toBe('/robots');
    expect(window.location.search).toBe('?q=new&industry=logistics');
    expect(result.current.searchParams.get('q')).toBe('new');
  });

  it('deletes null and blank values', () => {
    const { result } = renderHook(() => useCatalogUrlState('?q=old'));
    act(() => result.current.updateParams({ q: ' ', industry: null }));
    expect(window.location.search).toBe('');
  });

  it('reacts to popstate', () => {
    const { result } = renderHook(() => useCatalogUrlState('?q=old'));
    act(() => {
      window.history.replaceState(null, '', '/robots?q=back');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(result.current.searchParams.get('q')).toBe('back');
  });
});
