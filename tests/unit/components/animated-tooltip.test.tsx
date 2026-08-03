// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import AnimatedTooltip from '@/components/ui/AnimatedTooltip';

// jsdom は matchMedia を実装しない。useHoverDevice が使うため最小のスタブを置く。
beforeAll(() => {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('hover: hover'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
});

// このcomponentは現在アプリ内で描画されていない（PageTabBar が tab.description を持つ
// タブにだけ付けるが、その prop を渡す呼び出し元が無い）。それでも client bundle には
// 載るため、motion から CSS transition へ置換した際の挙動をここで固定する。
describe('AnimatedTooltip', () => {
  const setup = () =>
    render(
      <AnimatedTooltip content="説明文" placement="bottom">
        <button type="button">タブ</button>
      </AnimatedTooltip>,
    );

  it('常時mountされ、display:none を使わない', () => {
    setup();
    const tip = document.querySelector('[role="tooltip"]')!;
    expect(tip).toBeTruthy();
    expect(tip.className).not.toContain('hidden');
    expect(tip.className).toContain('transition-[opacity,transform]');
    expect(tip.className).toContain('motion-reduce:transition-none');
  });

  it('初期状態は aria-hidden=true / opacity-0、aria-describedby は張られない', () => {
    setup();
    const tip = document.querySelector('[role="tooltip"]')!;
    expect(tip.getAttribute('aria-hidden')).toBe('true');
    expect(tip.className).toContain('opacity-0');
    expect(document.querySelector('[aria-describedby]')).toBeNull();
  });

  it('focus で可視になり aria-describedby が張られ、Escape で戻る', () => {
    setup();
    const trigger = document.querySelector('span.relative.inline-flex')!;
    const tip = document.querySelector('[role="tooltip"]')!;

    act(() => { fireEvent.focus(trigger); });
    expect(tip.getAttribute('aria-hidden')).toBe('false');
    expect(tip.className).toContain('opacity-100');
    const described = document.querySelector('[aria-describedby]');
    expect(described).not.toBeNull();
    expect(described!.getAttribute('aria-describedby')).toBe(tip.id);

    act(() => { fireEvent.keyDown(trigger, { key: 'Escape' }); });
    expect(tip.getAttribute('aria-hidden')).toBe('true');
    expect(tip.className).toContain('opacity-0');
    expect(document.querySelector('[aria-describedby]')).toBeNull();
  });

  it('非表示時は placement 方向へずれる（旧 initial transform と同じ向き）', () => {
    setup();
    const tip = document.querySelector('[role="tooltip"]')!;
    expect(tip.className).toContain('-translate-y-1'); // placement=bottom
    expect(tip.className).toContain('scale-95');
  });
});
