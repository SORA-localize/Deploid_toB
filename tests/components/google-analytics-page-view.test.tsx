// @vitest-environment jsdom
import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleAnalyticsPageView } from '@/components/GoogleAnalyticsPageView';
import { URL_CHANGE_EVENT } from '@/lib/catalog/urlState';

const usePathnameMock = vi.fn();
const useSearchParamsMock = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
  useSearchParams: () => useSearchParamsMock(),
}));

describe('GoogleAnalyticsPageView', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/robots');
    usePathnameMock.mockReturnValue('/robots');
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
    window.gtag = vi.fn();
  });

  it('reports the page view for a real Next.js navigation', () => {
    render(<GoogleAnalyticsPageView measurementId="G-TEST" />);
    expect(window.gtag).toHaveBeenCalledWith('config', 'G-TEST', { page_path: '/robots' });
  });

  it('reports a page view when a catalog filter update dispatches deploid:urlchange, bypassing next/navigation', () => {
    render(<GoogleAnalyticsPageView measurementId="G-TEST" />);
    (window.gtag as ReturnType<typeof vi.fn>).mockClear();

    // Simulates lib/catalog/urlState.ts#updateCatalogUrl: a raw history mutation
    // that next/navigation's usePathname/useSearchParams never observes, followed
    // by the custom event urlState.ts dispatches after every pushState/replaceState.
    act(() => {
      window.history.pushState(null, '', '/robots?industry=logistics');
      window.dispatchEvent(new Event(URL_CHANGE_EVENT));
    });

    expect(window.gtag).toHaveBeenCalledWith('config', 'G-TEST', {
      page_path: '/robots?industry=logistics',
    });
  });
});
