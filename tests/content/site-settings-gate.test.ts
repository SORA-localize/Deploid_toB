import { getPayload, type Payload } from 'payload';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config from '../../payload.config';
import { assertLocalThrowawayDatabase } from './testDbGuard';

/**
 * remediation group 1 / 必須修正1-2 の回帰テスト。
 *
 * 監査の指摘: `globals/SiteSettings.ts` は `access.update` が `canWriteDraft`（draft-writer以上なら
 * 誰でも）で、`hooks` を一切持っていなかった。`versions: { drafts: true }` のglobalは
 * `_status: 'published'` を含むupdateをそのまま受け付けるため、content-draft-writerが
 * SiteSettingsを直接publishできてしまう。collectionと同等のpublish/unpublish gateを入れる。
 */
const PASSWORD = 'Str0ngPassw0rd!23';

describe('SiteSettings global publish gate (real Payload Local API)', () => {
  let payload: Payload;

  beforeAll(async () => {
    assertLocalThrowawayDatabase('tests/content/site-settings-gate.test.ts');
    payload = await getPayload({ config });
    await payload.delete({ collection: 'admins', where: {}, overrideAccess: true });

    const owner = await payload.create({
      collection: 'admins',
      overrideAccess: false,
      data: { email: 'settings-owner@example.com', password: PASSWORD, role: 'content-reader' },
    });
    for (const [email, role] of [
      ['settings-reader@example.com', 'content-reader'],
      ['settings-writer@example.com', 'content-draft-writer'],
      ['settings-publisher@example.com', 'content-publisher'],
    ] as const) {
      await payload.create({
        collection: 'admins',
        overrideAccess: false,
        user: owner,
        data: { email, password: PASSWORD, role },
      });
    }

    // globalはcollectionと違い「全件delete」で初期化できず、前回実行のpublished状態が
    // そのまま残る。このsuiteは「未公開 → publish → 公開後」の順で検証するので、
    // platform-admin（= gateを通過できるrole）で未公開状態へ明示的に戻してから始める。
    await payload.updateGlobal({
      slug: 'site-settings',
      overrideAccess: true,
      user: owner,
      data: {
        _status: 'draft',
        defaultSeo: { metaTitle: null, metaDescription: null },
        announcementBanner: { enabled: false, message: null, url: null },
      } as never,
    });
  });

  afterAll(async () => {
    await payload?.destroy();
  });

  async function loginAs(email: string) {
    const result = await payload.login({ collection: 'admins', data: { email, password: PASSWORD } });
    if (!result.user) throw new Error(`login failed for ${email}`);
    return result.user;
  }

  it('rejects a content-draft-writer publishing SiteSettings', async () => {
    const writer = await loginAs('settings-writer@example.com');

    await expect(
      payload.updateGlobal({
        slug: 'site-settings',
        overrideAccess: false,
        user: writer,
        data: {
          _status: 'published',
          defaultSeo: { metaTitle: 'Published by a draft writer' },
        },
      }),
    ).rejects.toThrow(/publish-role-required/);

    const current = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true, depth: 0 });
    expect(current?.defaultSeo?.metaTitle ?? null).not.toBe('Published by a draft writer');
  });

  it('rejects a content-reader updating SiteSettings at all', async () => {
    const reader = await loginAs('settings-reader@example.com');

    await expect(
      payload.updateGlobal({
        slug: 'site-settings',
        overrideAccess: false,
        user: reader,
        data: { defaultSeo: { metaTitle: 'Reader edit' } },
      }),
    ).rejects.toThrow();
  });

  it('lets a content-draft-writer save a SiteSettings draft', async () => {
    const writer = await loginAs('settings-writer@example.com');

    const saved = await payload.updateGlobal({
      slug: 'site-settings',
      overrideAccess: false,
      draft: true,
      user: writer,
      data: { defaultSeo: { metaTitle: 'Draft title from a writer' } },
    });
    expect(saved._status).toBe('draft');
  });

  it('lets a content-publisher publish SiteSettings', async () => {
    const publisher = await loginAs('settings-publisher@example.com');

    const published = await payload.updateGlobal({
      slug: 'site-settings',
      overrideAccess: false,
      user: publisher,
      data: {
        _status: 'published',
        defaultSeo: { metaTitle: 'Published by a publisher' },
      },
    });
    expect(published._status).toBe('published');
  });

  /**
   * collection側の必須修正1-1と同じ穴が global にもある: `_status` を送らない通常のupdateは
   * 公開中のmain rowをそのまま書き換える（Payloadの `isSavingDraft` が false なので
   * `db.updateGlobal` が走る）。role検査を「`_status` を送ったとき」に限ると素通りする。
   */
  it('rejects a content-draft-writer editing SiteSettings while it is published', async () => {
    const writer = await loginAs('settings-writer@example.com');

    await expect(
      payload.updateGlobal({
        slug: 'site-settings',
        overrideAccess: false,
        user: writer,
        data: { announcementBanner: { enabled: true, message: 'writer edited live settings' } },
      }),
    ).rejects.toThrow(/publish-role-required/);

    const current = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true, depth: 0 });
    expect(current.announcementBanner?.enabled ?? false).toBe(false);
    expect(current.defaultSeo?.metaTitle).toBe('Published by a publisher');
  });

  it('rejects a content-draft-writer unpublishing SiteSettings once it is published', async () => {
    const writer = await loginAs('settings-writer@example.com');

    await expect(
      payload.updateGlobal({
        slug: 'site-settings',
        overrideAccess: false,
        user: writer,
        data: { _status: 'draft' },
      }),
    ).rejects.toThrow(/publish-role-required/);

    const current = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true, depth: 0 });
    expect(current._status).toBe('published');
  });
});
