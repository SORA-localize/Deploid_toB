// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Admin公開ボタン（`docs/plans/admin-publish-ui-plan-v1.md` Task 5）。
 *
 * ## このsuiteが守るもの
 *
 * Payload標準のPublishは `submit({ overrides: { _status: 'published' } })` ——
 * **保存操作そのもの**（`@payloadcms/ui/dist/elements/PublishButton/index.js:157`）。
 * fetchを投げるだけのボタンに置き換えると、**編集中の内容が公開されずエラーにもならない**。
 * したがって最重要のテストは「①draft保存を先に行い、②失敗したら公開へ進まない」の2点。
 *
 * `@payloadcms/ui` のhookはmockする。実providerを組むとadmin全体の初期化が要るうえ、
 * ここで確かめたいのは**ボタンの状態機械**であってPayloadの描画ではない。
 */
const submit = vi.fn();
const setHasPublishedDoc = vi.fn();
const setUnpublishedVersionCount = vi.fn();
const setMostRecentVersionIsAutosaved = vi.fn();
const incrementVersionCount = vi.fn();
const clearRouteCache = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

let docInfo: Record<string, unknown>;
let authUser: Record<string, unknown> | null;
let operation: string;
let modified: boolean;
let processing: boolean;

vi.mock('@payloadcms/ui', () => ({
  useDocumentInfo: () => docInfo,
  useAuth: () => ({ user: authUser }),
  useConfig: () => ({ config: { routes: { api: '/api' } } }),
  useForm: () => ({ submit }),
  useFormModified: () => modified,
  useFormProcessing: () => processing,
  useOperation: () => operation,
  useRouteCache: () => ({ clearRouteCache }),
  useTranslation: () => ({ t: (key: string) => key }),
  toast: { success: toastSuccess, error: toastError },
  // 標準の `Button` は最終的に `<button>` を描画する。ここでは「無効なら押しても
  // 何も起きない」というDOMの挙動だけ再現できればよい。
  Button: ({
    children,
    onClick,
    disabled,
    id,
  }: {
    children: ReactNode;
    onClick: () => void;
    disabled: boolean;
    id?: string;
  }) => (
    <button disabled={disabled} id={id} onClick={onClick} type="button">
      {children}
    </button>
  ),
}));

const { PUBLISH_BUTTON_ID } = await import('@/lib/payload/adminPublishComponents');
const { PublishFromApproval } = await import('@/components/admin/PublishFromApproval');

const ok = (body: unknown = { ok: true, documentId: 1, revalidation: { status: 'ok' } }) =>
  ({ ok: true, status: 200, json: async () => body }) as Response;
const fail = (status: number, body: unknown) =>
  ({ ok: false, status, json: async () => body }) as Response;

beforeEach(() => {
  vi.clearAllMocks();
  docInfo = {
    id: 42,
    collectionSlug: 'manufacturers',
    setHasPublishedDoc,
    setUnpublishedVersionCount,
    setMostRecentVersionIsAutosaved,
    incrementVersionCount,
  };
  authUser = { id: 1, role: 'content-publisher' };
  operation = 'update';
  modified = true;
  processing = false;
  submit.mockResolvedValue({ res: { ok: true } });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok()));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('表示条件', () => {
  it.each([['content-reader'], ['content-draft-writer']])('%s には表示しない', (role) => {
    // `hasPublishPermission` は当てにならない（`contentCollectionAccess.update = canWriteDraft`
    // が `data` を見ないので draft-writer でも true になる）。roleで判定する。
    authUser = { id: 1, role };
    const { container } = render(<PublishFromApproval />);
    expect(container).toBeEmptyDOMElement();
  });

  it.each([['content-publisher'], ['platform-admin']])('%s には表示する', (role) => {
    authUser = { id: 1, role };
    render(<PublishFromApproval />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('安定したidを振る（e2eがこのidでボタンを掴む）', () => {
    // 文言で掴むとadmin言語が `ja` のとき Payload の「公開時の内容に戻す」と衝突する。
    // idを消すとe2eが「ボタンが無い」という分かりにくい形で落ちるので、ここで固定する。
    render(<PublishFromApproval />);
    expect(screen.getByRole('button')).toHaveAttribute('id', PUBLISH_BUTTON_ID);
  });

  it('未ログインでは表示しない', () => {
    authUser = null;
    const { container } = render(<PublishFromApproval />);
    expect(container).toBeEmptyDOMElement();
  });

  it('create画面では表示しない（idが無く、保存後もclosureから取れない）', () => {
    operation = 'create';
    docInfo = { ...docInfo, id: undefined };
    const { container } = render(<PublishFromApproval />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('2段構え（最重要）', () => {
  it('先にdraft保存し、そのあとで公開routeを呼ぶ', async () => {
    render(<PublishFromApproval />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(fetch).toHaveBeenCalled());

    // ①保存が先。`draft=true` と `skipValidation` を必ず付ける
    //（`_status: 'draft'` だけの通常updateだと公開中documentをunpublishし得る）。
    const arg = submit.mock.calls[0][0] as {
      action: string;
      method: string;
      skipValidation: boolean;
      overrides: Record<string, unknown>;
    };
    expect(arg.action).toContain('draft=true');
    expect(arg.method).toBe('PATCH');
    expect(arg.skipValidation).toBe(true);
    expect(arg.overrides).toEqual({ _status: 'draft' });

    // ②tokenはquery paramで運ぶ（form dataに載せない。hidden fieldは再送されるため）
    expect(arg.action).toMatch(/adminPublishIntent=[0-9a-f-]{36}/);

    // ③routeへは同じtokenを送る
    const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
    const tokenInAction = arg.action.match(/adminPublishIntent=([0-9a-f-]{36})/)?.[1];
    expect(body).toMatchObject({ collection: 'manufacturers', id: 42, publishIntentToken: tokenInAction });
  });

  it('draft保存が失敗したら公開routeを呼ばない', async () => {
    // `submit()` はclient検証失敗・APIエラー・ネットワークエラーで undefined を返しうる。
    submit.mockResolvedValue({ res: { ok: false, status: 400 } });
    render(<PublishFromApproval />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(submit).toHaveBeenCalled());
    expect(fetch).not.toHaveBeenCalled();
  });

  it('submit()がundefinedを返しても公開routeを呼ばない', async () => {
    submit.mockResolvedValue(undefined);
    render(<PublishFromApproval />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(submit).toHaveBeenCalled());
    expect(fetch).not.toHaveBeenCalled();
  });

  it('毎回あたらしいtokenを発行する（使い回さない）', async () => {
    render(<PublishFromApproval />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const first = (submit.mock.calls[0][0] as { action: string }).action;

    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    const second = (submit.mock.calls[1][0] as { action: string }).action;

    expect(first).not.toBe(second);
  });
});

describe('成功後の状態同期', () => {
  it('公開後にDocumentInfoを更新し、routeCacheを落とす', async () => {
    // 呼ばないと `Status` が "Changed" のまま残る（`Status/index.js:52-58`）。
    render(<PublishFromApproval />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(setHasPublishedDoc).toHaveBeenCalledWith(true));
    expect(setUnpublishedVersionCount).toHaveBeenCalledWith(0);
    expect(setMostRecentVersionIsAutosaved).toHaveBeenCalledWith(false);
    expect(incrementVersionCount).toHaveBeenCalled();
    expect(clearRouteCache).toHaveBeenCalled();
  });

  it('失敗時は状態を更新しない', async () => {
    vi.mocked(fetch).mockResolvedValue(fail(409, { ok: false, error: 'publish-candidate-replaced' }));
    render(<PublishFromApproval />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(setHasPublishedDoc).not.toHaveBeenCalled();
    expect(clearRouteCache).not.toHaveBeenCalled();
  });
});

describe('反映通知（revalidation）の結果に応じた文言', () => {
  // 公開自体は成功しているので、`revalidation`の結果に関わらず状態同期（setHasPublishedDoc等）は
  // 行う。ここで見るのはtoastの出し分けだけ（`docs/plans/admin-ux-and-revalidation-fix-plan-v1.md`
  // Task 2）。`ok`は「タグ無効化を受理した」であって「ページに反映済み」ではないが、
  // 編集者へは通常の成功文言のままでよい——反映通知そのものが失敗したときだけ追加で知らせる。
  it('revalidation.status=okなら通常の成功文言だけ出す', async () => {
    vi.mocked(fetch).mockResolvedValue(ok({ ok: true, documentId: 1, revalidation: { status: 'ok' } }));
    render(<PublishFromApproval />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('deploidPublish:publish-succeeded'));
    expect(toastError).not.toHaveBeenCalled();
  });

  it.each([['non-ok'], ['unreachable']])(
    'revalidation.status=%sなら公開成功のまま反映失敗を知らせる',
    async (status) => {
      vi.mocked(fetch).mockResolvedValue(ok({ ok: true, documentId: 1, revalidation: { status } }));
      render(<PublishFromApproval />);
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => expect(toastError).toHaveBeenCalledWith('deploidPublish:publish-succeeded-reflection-failed'));
      // 公開自体は成功しているので、状態同期は行う（toast.errorだが公開は失敗していない）。
      expect(setHasPublishedDoc).toHaveBeenCalledWith(true);
      expect(toastSuccess).not.toHaveBeenCalled();
    },
  );

  it.each([['missing-secret'], ['missing-base-url']])(
    'revalidation.status=%sなら未設定であることを知らせる',
    async (status) => {
      vi.mocked(fetch).mockResolvedValue(ok({ ok: true, documentId: 1, revalidation: { status } }));
      render(<PublishFromApproval />);
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() =>
        expect(toastError).toHaveBeenCalledWith('deploidPublish:publish-succeeded-reflection-not-configured'),
      );
      expect(setHasPublishedDoc).toHaveBeenCalledWith(true);
    },
  );

  it('応答bodyの読み取りに失敗しても、公開成功として扱う（読み取り不能を反映失敗と誤認しない）', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200, json: async () => { throw new Error('boom'); } } as never);
    render(<PublishFromApproval />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(setHasPublishedDoc).toHaveBeenCalledWith(true));
    expect(toastSuccess).toHaveBeenCalledWith('deploidPublish:publish-succeeded');
    expect(toastError).not.toHaveBeenCalled();
  });
});

describe('無効化の条件', () => {
  it('form processing中は押せない', () => {
    processing = true;
    render(<PublishFromApproval />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('送信中は押せない（二重送信で publish-candidate-replaced を誤表示しない）', async () => {
    let release: (v: unknown) => void = () => {};
    submit.mockReturnValue(new Promise((r) => { release = r; }));
    render(<PublishFromApproval />);

    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByRole('button')).toBeDisabled());

    release({ res: { ok: true } });
  });
});
