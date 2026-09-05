/**
 * `tests/e2e/payload-admin-publish.spec.ts` 専用のヘルパー。`createDraftUpdateForE2E.mts` と
 * 同じ設計（Playwright specから `execFileSync` で子processとして起動する）。
 *
 * ## なぜ専用の作成scriptが要るのか
 *
 * `scripts/seed-ci-site-settings.mts` が作るCI用adminは、パスワードが
 * `ci-${crypto.randomUUID()}-Disposable!` で**その場で捨てられる**。ログインできないので
 * admin UIを実際に操作するe2eには使えない。かといってseed側を「決まったパスワード」に変えると、
 * publish gateのためだけに存在するあのアカウントの性質が変わる。ここで別に作る。
 *
 * 作るのは使い捨てDB（`content_e2e_test`）の中だけ。`payload:migrate` と同じ
 * `DATABASE_URL` を見るので、throwaway判定（`lib/content/databaseSafety.ts`）の外へは出ない。
 *
 * Usage: `npx tsx tests/e2e/createAdminUserForE2E.mts <email> <password> <role>`
 */
import { getPayload } from 'payload';
import config from '../../payload.config';

async function main(): Promise<void> {
  const [, , email, password, role] = process.argv;
  if (!email || !password || !role) {
    console.error('usage: tsx createAdminUserForE2E.mts <email> <password> <role>');
    process.exitCode = 1;
    return;
  }

  const payload = await getPayload({ config });
  try {
    const { docs } = await payload.find({
      collection: 'admins',
      where: { email: { equals: email } },
      overrideAccess: true,
      limit: 1,
      depth: 0,
    });
    const existing = docs[0] as { id: string | number } | undefined;

    if (existing) {
      // 同じjob内で再実行されても同じ資格情報で入れるようにする（specの再試行で落ちないため）。
      await payload.update({
        collection: 'admins',
        id: existing.id,
        overrideAccess: true,
        data: { password, role } as never,
      });
    } else {
      await payload.create({
        collection: 'admins',
        overrideAccess: true,
        data: { email, password, role } as never,
      });
    }
    console.log(`OK: admin ${email} ready with role ${role}`);
  } finally {
    await payload.destroy();
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit(process.exitCode ?? 0);
  });
