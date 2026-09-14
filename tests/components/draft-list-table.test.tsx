// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DraftListItem } from '@/lib/payload/listDraftDocumentsForAdmin';

/**
 * `/admin/draft-list` の本体（`components/admin/DraftListTable.tsx`）。
 *
 * ## このsuiteが守るもの
 *
 * - `canPublish=false`（content-draft-writer）ではチェックボックス・公開ボタンを
 *   一切描画しない（`tests/components/publish-from-approval.test.tsx`と同じ、
 *   「使えないボタンを見せない」というroleゲートの考え方）。
 * - コレクションごとのカスケード（`<details>`）に分かれ、各セクションの「すべて選択」
 *   チェックボックスが自分のグループの行だけを選択/解除する（他グループへ波及しない）。
 * - 「選択したN件を公開」は選択したitemだけを`/admin/publish/bulk`へ送る。
 * - 部分成功時、成功したitemだけを一覧から消し、失敗したitemは残す
 *   （`bulkPublishFromAdmin`が保証する「1件の失敗が他へ波及しない」を、
 *   このコンポーネントが正しく表示に反映しているかの確認）。
 *
 * `@payloadcms/ui`はmockする。ここで確かめたいのは選択状態とfetch呼び出しの形であって
 * Payloadの描画そのものではない。ネイティブ`<summary>`はaria上role="button"を持つため、
 * 公開ボタンは常に`{ name: /draft-list-publish-selected/ }`で名前指定して掴む
 * （素の`getByRole('button')`はグループ見出しと衝突して曖昧になる）。
 */

vi.mock('@payloadcms/ui', () => ({
  useConfig: () => ({ config: { routes: { api: '/api', admin: '/admin' } } }),
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => (vars ? `${key}:${JSON.stringify(vars)}` : key),
    i18n: { language: 'ja' },
  }),
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: ReactNode;
    onClick: () => void;
    disabled: boolean;
  }) => (
    <button disabled={disabled} onClick={onClick} type="button">
      {children}
    </button>
  ),
  Link: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
  ChevronIcon: ({ direction }: { direction?: string }) => (
    <span data-testid="chevron" data-direction={direction ?? 'down'} aria-hidden="true" />
  ),
}));

const { DraftListTable } = await import('@/components/admin/DraftListTable');

const publishButton = () => screen.getByRole('button', { name: /draft-list-publish-selected/ });

const item = (overrides: Partial<DraftListItem> = {}): DraftListItem => ({
  collection: 'manufacturers',
  id: 1,
  stableId: 'stable-1',
  title: 'Alpha Robotics',
  updatedAt: '2026-09-01T00:00:00.000Z',
  ...overrides,
});

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as Response;
const fail = (status: number, body: unknown) => ({ ok: false, status, json: async () => body }) as Response;

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('canPublishによる表示切り替え', () => {
  it('canPublish=falseではチェックボックスと公開ボタンを出さない（一覧のみ）', () => {
    render(<DraftListTable initialItems={[item()]} canPublish={false} />);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /draft-list-publish-selected/ })).not.toBeInTheDocument();
    expect(screen.getByText('Alpha Robotics')).toBeInTheDocument();
  });

  it('canPublish=trueでは行チェックボックス・グループチェックボックス・公開ボタンを出す', () => {
    render(<DraftListTable initialItems={[item()]} canPublish={true} />);
    // グループの「すべて選択」+ 行のチェックボックスで2つ。
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    expect(publishButton()).toBeInTheDocument();
  });

  it('一覧が空ならdraft-list-emptyを表示する', () => {
    render(<DraftListTable initialItems={[]} canPublish={true} />);
    expect(screen.getByText(/draft-list-empty/)).toBeInTheDocument();
  });
});

describe('コレクションごとのカスケード', () => {
  it('コレクションごとにセクションが分かれ、件数を表示する', () => {
    const items = [
      item({ id: 1, stableId: 'm1', title: 'Mfr One' }),
      item({ id: 2, stableId: 'm2', title: 'Mfr Two' }),
      item({ collection: 'articles', id: 3, stableId: 'a1', title: 'Article One' }),
    ];
    render(<DraftListTable initialItems={items} canPublish={true} />);

    expect(screen.getByText('メーカー')).toBeInTheDocument();
    expect(screen.getByText('記事')).toBeInTheDocument();
    expect(screen.getByText(/draft-list-group-count:\{"count":"2"\}/)).toBeInTheDocument();
    expect(screen.getByText(/draft-list-group-count:\{"count":"1"\}/)).toBeInTheDocument();
  });

  it('件数が0のコレクションのセクションは出さない', () => {
    render(<DraftListTable initialItems={[item()]} canPublish={true} />);
    expect(screen.queryByText('記事')).not.toBeInTheDocument();
    expect(screen.queryByText('代理店')).not.toBeInTheDocument();
  });

  it('グループの「すべて選択」は自分のグループの行だけを選択し、他グループには波及しない', () => {
    const items = [
      item({ id: 1, stableId: 'm1', title: 'Mfr One' }),
      item({ id: 2, stableId: 'm2', title: 'Mfr Two' }),
      item({ collection: 'articles', id: 3, stableId: 'a1', title: 'Article One' }),
    ];
    render(<DraftListTable initialItems={items} canPublish={true} />);

    const mfrGroupCheckbox = screen.getByLabelText(/draft-list-group-select-all:\{"collection":"メーカー"\}/);
    fireEvent.click(mfrGroupCheckbox);

    expect(screen.getByLabelText('Mfr One')).toBeChecked();
    expect(screen.getByLabelText('Mfr Two')).toBeChecked();
    expect(screen.getByLabelText('Article One')).not.toBeChecked();

    // もう一度クリックすると解除される。
    fireEvent.click(mfrGroupCheckbox);
    expect(screen.getByLabelText('Mfr One')).not.toBeChecked();
    expect(screen.getByLabelText('Mfr Two')).not.toBeChecked();
  });

  it('チェブロンはセクションの開閉状態を表し、開閉のtoggleイベントで向きが変わる', () => {
    // jsdomは`<summary>`クリックの既定動作（`<details>`のopen切り替え）自体は実装しないため、
    // 実際のブラウザ操作の結果として起きる`toggle`イベントを直接発火させ、
    // `onToggle`ハンドラがstateへ正しく同期するかだけを確認する
    // （`<details>`自体の開閉挙動はネイティブ機能でありこのコンポーネントの責務ではない）。
    render(<DraftListTable initialItems={[item()]} canPublish={true} />);

    const details = screen.getByText('メーカー').closest('details') as HTMLDetailsElement;

    // 既定は開（down）。
    expect(screen.getByTestId('chevron')).toHaveAttribute('data-direction', 'down');
    expect(details.open).toBe(true);

    details.open = false;
    fireEvent(details, new Event('toggle'));
    expect(screen.getByTestId('chevron')).toHaveAttribute('data-direction', 'right');

    details.open = true;
    fireEvent(details, new Event('toggle'));
    expect(screen.getByTestId('chevron')).toHaveAttribute('data-direction', 'down');
  });

  it('グループ内の行を個別に全部選ぶと、グループチェックボックスも選択済みになる', () => {
    const items = [item({ id: 1, stableId: 'm1', title: 'Mfr One' }), item({ id: 2, stableId: 'm2', title: 'Mfr Two' })];
    render(<DraftListTable initialItems={items} canPublish={true} />);

    fireEvent.click(screen.getByLabelText('Mfr One'));
    fireEvent.click(screen.getByLabelText('Mfr Two'));

    expect(screen.getByLabelText(/draft-list-group-select-all/)).toBeChecked();
  });
});

describe('選択と公開', () => {
  it('選択したitemだけを/admin/publish/bulkへ送る', async () => {
    const items = [item({ id: 1, stableId: 's1', title: 'One' }), item({ id: 2, stableId: 's2', title: 'Two' })];
    vi.mocked(fetch).mockResolvedValue(ok({ results: [{ collection: 'manufacturers', id: 1, ok: true }] }));
    render(<DraftListTable initialItems={items} canPublish={true} />);

    fireEvent.click(screen.getByLabelText('One'));
    fireEvent.click(publishButton());

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('/api/admin/publish/bulk');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toEqual({ items: [{ collection: 'manufacturers', id: 1 }] });
  });

  it('公開ボタンは未選択のときは押せない', () => {
    render(<DraftListTable initialItems={[item()]} canPublish={true} />);
    expect(publishButton()).toBeDisabled();
  });

  it('部分成功時、成功したitemだけ一覧から消え、失敗したitemは残る', async () => {
    const items = [item({ id: 1, stableId: 's1', title: 'Succeeds' }), item({ id: 2, stableId: 's2', title: 'Fails' })];
    vi.mocked(fetch).mockResolvedValue(
      ok({
        results: [
          { collection: 'manufacturers', id: 1, ok: true },
          { collection: 'manufacturers', id: 2, ok: false, error: 'publish-validation-failed', fields: ['description'] },
        ],
      }),
    );
    render(<DraftListTable initialItems={items} canPublish={true} />);

    fireEvent.click(screen.getByLabelText('Succeeds'));
    fireEvent.click(screen.getByLabelText('Fails'));
    fireEvent.click(publishButton());

    await waitFor(() => expect(screen.queryByText('Succeeds')).not.toBeInTheDocument());
    expect(screen.getByText('Fails')).toBeInTheDocument();
    expect(screen.getByText(/draft-list-results-heading/)).toBeInTheDocument();
  });

  it('request自体が失敗（非200）した場合、選択した全itemを失敗として表示する', async () => {
    const items = [item({ id: 1, stableId: 's1', title: 'One' })];
    vi.mocked(fetch).mockResolvedValue(fail(403, { error: 'insufficient-role' }));
    render(<DraftListTable initialItems={items} canPublish={true} />);

    fireEvent.click(screen.getByLabelText('One'));
    fireEvent.click(publishButton());

    await waitFor(() => expect(screen.getByText(/draft-list-results-heading/)).toBeInTheDocument());
    const resultsHeading = screen.getByText(/draft-list-results-heading/);
    expect(within(resultsHeading.parentElement as HTMLElement).getByText(/insufficient-role/)).toBeInTheDocument();
    // 消えずに一覧にも残っている(公開されていない)。
    expect(screen.getByText('One')).toBeInTheDocument();
  });

  it('fetch自体が例外を投げた場合も選択itemを失敗として表示する', async () => {
    const items = [item({ id: 1, stableId: 's1', title: 'One' })];
    vi.mocked(fetch).mockRejectedValue(new Error('network down'));
    render(<DraftListTable initialItems={items} canPublish={true} />);

    fireEvent.click(screen.getByLabelText('One'));
    fireEvent.click(publishButton());

    await waitFor(() => expect(screen.getByText(/draft-list-results-heading/)).toBeInTheDocument());
    expect(screen.getByText(/publish-internal-error/)).toBeInTheDocument();
  });
});
