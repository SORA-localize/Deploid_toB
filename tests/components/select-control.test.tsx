// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { SelectControl, type SelectControlOption } from '@/components/SelectControl';

// Radix の Select はマウント時に ResizeObserver / matchMedia を触る。jsdom はどちらも
// 実装していないので、レンダリングできる最小限のスタブを置く。
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
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

/**
 * 2026-08-29 の回帰テスト。`/compare` が**本番では動くのに CI fixture でだけ
 * クライアント側で落ちる**という、データ依存の実バグを固定する。
 *
 * 経緯:
 * `components/CompareClient.tsx` の mobile メーカー選択は「未選択」を空文字の option
 * （`{ value: '', label: 'メーカーを選択' }`）で表していた。React のフォーム慣習としては
 * 正しいが、Radix の `Select.Item` は空文字の `value` を禁止しており、レンダリング時に
 * throw する。throw はページ全体の error boundary まで上がり、`/compare` は
 * `<h1>ページを表示できませんでした</h1>` になる。
 *
 * これが本番で表面化しなかったのは `SelectControl` の分岐のため。
 * `searchable` かつ `options.length >= SEARCHABLE_MIN_OPTIONS`(12) なら Radix ではなく
 * `SearchableDropdown` を描く。本番はメーカー26件なので常に検索UI経路へ入り、Radix の
 * 制約に触れない。CI fixture はメーカー2件なので Radix 経路へ落ち、そこで初めて落ちた。
 *
 * つまり「選択肢が閾値未満のときだけページが落ちる」という形の不具合で、
 * 実データが減れば本番でも起きる。修正は `SelectControl` 側（Radix 経路へ入る直前で
 * 空文字を内部 sentinel へ写す）に置いたので、呼び出し側が空文字を渡しても安全になる。
 * このテストはその境界を固定する。呼び出し側1箇所を直すだけの修正へ戻すと落ちる。
 */
describe('SelectControl は空文字の option value を安全に扱う', () => {
  const noneOption: SelectControlOption = { value: '', label: 'メーカーを選択' };
  const optionsBelowThreshold: SelectControlOption[] = [
    noneOption,
    { value: 'mfr-a', label: 'アルファロボティクス' },
  ];

  it('選択肢が検索UIの閾値未満（= Radix Select 経路）でも throw せず描画できる', () => {
    // 修正前はこの render 自体が
    // "A <Select.Item /> must have a value prop that is not an empty string" で throw した。
    expect(() =>
      render(
        <SelectControl
          id="mobile-manufacturer"
          label="メーカー"
          value=""
          options={optionsBelowThreshold}
          onChange={() => {}}
          searchable
        />,
      ),
    ).not.toThrow();

    expect(screen.getByLabelText('メーカー')).toBeInTheDocument();
  });

  it('未選択（空文字）のとき、空文字 option のラベルを表示する', () => {
    render(
      <SelectControl
        id="mobile-manufacturer"
        label="メーカー"
        value=""
        options={optionsBelowThreshold}
        onChange={() => {}}
        searchable
      />,
    );

    // 空文字が内部 sentinel へ写っても、利用者に見える表示は「未選択の option のラベル」のまま。
    expect(screen.getByLabelText('メーカー')).toHaveTextContent('メーカーを選択');
  });

  it('閾値以上なら SearchableDropdown 経路に入り、こちらも空文字 option で throw しない', () => {
    const manyOptions: SelectControlOption[] = [
      noneOption,
      ...Array.from({ length: 20 }, (_, index) => ({
        value: `mfr-${index}`,
        label: `メーカー${index}`,
      })),
    ];

    expect(() =>
      render(
        <SelectControl
          id="mobile-manufacturer"
          label="メーカー"
          value=""
          options={manyOptions}
          onChange={() => {}}
          searchable
        />,
      ),
    ).not.toThrow();
  });
});
