// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { PageTabBar } from '@/components/PageTabBar';

// jsdom は matchMedia を実装していない。description つきタブが使う AnimatedTooltip が
// hover 可能デバイスかを matchMedia で判定するため、hover なしとして固定する。
beforeAll(() => {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

/**
 * PageTabBar は「ページ内パネルの切り替え」ではなく「URL が変わる絞り込み」であり、
 * WAI-ARIA では tab/tablist ではなく `aria-current` を使うナビゲーションにあたる。
 *
 * 過去に一度 tab semantics（role=tab / aria-selected / roving tabindex）が入り、
 * PR #5（Phase 1）で `role="group"` + `aria-current` へ差し戻された経緯がある。
 * docs/decisions/design_system_v1.md:305 も「PageTabBar は tab semantics を持たない。
 * 見た目だけ揃える」と明記している。ここはその決定を固定するテストで、
 * 「アクセシビリティ改善」に見える再導入を落とすためにある。
 *
 * role=tab を付けると支援技術の利用者はパネルの差し替えを予期するが、
 * 実際に起きるのはページ遷移で、期待と挙動がずれる。
 */

// vitest の globals を有効にしていないため RTL の自動 cleanup は登録されない。
// 明示的に外さないと描画が次のテストへ持ち越される。
afterEach(cleanup);

const tabs = [
  { value: 'all', label: 'すべて' },
  { value: 'news', label: 'ニュース', count: 12 },
  { value: 'policy', label: '政策', description: '規制・制度の動き' },
  { value: 'empty', label: '該当なし', disabled: true },
] as const;

function renderTabBar(onSelect = vi.fn()) {
  render(
    <PageTabBar
      tabs={tabs}
      activeValue="news"
      onSelect={onSelect}
      ariaLabel="記事の絞り込み"
    />,
  );
  return onSelect;
}

describe('PageTabBar', () => {
  it('is a labelled group, not a tablist', () => {
    renderTabBar();
    expect(screen.getByRole('group', { name: '記事の絞り込み' })).toBeInTheDocument();
    expect(screen.queryAllByRole('tablist')).toHaveLength(0);
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
  });

  it('marks the active filter with aria-current, not aria-selected', () => {
    renderTabBar();
    const active = screen.getByRole('button', { name: 'ニュース、12件' });
    expect(active).toHaveAttribute('aria-current', 'page');
    expect(active).not.toHaveAttribute('aria-selected');

    const inactive = screen.getByRole('button', { name: 'すべて' });
    expect(inactive).not.toHaveAttribute('aria-current');
  });

  it('keeps every tab in the Tab sequence (no roving tabindex)', () => {
    renderTabBar();
    // roving tabindex は tablist / toolbar / radiogroup のパターン。
    // ナビゲーションでこれをやると Tab キーで各絞り込みへ到達できなくなる。
    for (const tab of screen.getAllByRole('button')) {
      expect(tab).not.toHaveAttribute('tabindex');
      expect(tab).toHaveProperty('tagName', 'BUTTON');
    }
  });

  it('selects on click', () => {
    const onSelect = renderTabBar();
    fireEvent.click(screen.getByRole('button', { name: 'すべて' }));
    expect(onSelect).toHaveBeenCalledWith('all');
  });

  it('does not select a disabled tab but keeps it focusable', () => {
    const onSelect = renderTabBar();
    const disabled = screen.getByRole('button', { name: '該当なし' });
    // `disabled` 属性ではなく `aria-disabled` にしてあるのは、
    // 選択できない理由をスクリーンリーダー利用者にも読ませるため。
    expect(disabled).toHaveAttribute('aria-disabled', 'true');
    expect(disabled).not.toBeDisabled();

    disabled.focus();
    expect(disabled).toHaveFocus();

    fireEvent.click(disabled);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('keeps semantics when a tab is wrapped in a tooltip', () => {
    renderTabBar();
    // description つきのタブだけ AnimatedTooltip でラップされる。
    // ラッパーが role や aria-current を奪っていないことを確かめる。
    const wrapped = screen.getByRole('button', { name: '政策' });
    expect(wrapped).toBeInTheDocument();
    expect(wrapped).not.toHaveAttribute('role');
  });
});
