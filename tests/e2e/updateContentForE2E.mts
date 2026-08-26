/**
 * `tests/e2e/cache-revalidation.spec.ts` 専用のヘルパー。Playwrightのspec本体からは
 * `execSync`で子processとして起動する（spec自体はPayload Local APIを直接importせず、
 * moduleの解決・tsconfig pathsまわりの複雑さを避けるため——`tests/content/
 * migrationTestSupport.ts`の`runTsxScript`と同じ設計判断）。
 *
 * 実行しているPayload Local APIの書き込みは、実際に動いているNext.jsサーバー
 * （`npm run start`、`playwright.config.ts`の`webServer`）とは**別processの別DB接続**だが、
 * 同じ`payload.config.ts`（同じcollection hook定義）を読み込むため、`afterChange`hook
 * （`lib/payload/revalidationHook.ts`）はこのprocess側で実行され、`PAYLOAD_PUBLIC_SERVER_URL`
 * 宛てに実際のHTTP POSTを行う——つまり「別の場所で起きた書き込みが、動いているサーバーの
 * cacheへ本当に届くか」を検証できる（Payload管理画面やCLIからの更新と同じ経路）。
 *
 * Usage: `npx tsx tests/e2e/updateContentForE2E.mts <collection> <stableId> <field> <value>`
 */
import { getPayload } from 'payload';
import config from '../../payload.config';
import { privilegedPublishContext } from '../../lib/payload/publishAuthorization';

async function main(): Promise<void> {
  const [, , collection, stableId, field, value] = process.argv;
  if (!collection || !stableId || !field || value === undefined) {
    console.error('usage: tsx updateContentForE2E.mts <collection> <stableId> <field> <value>');
    process.exitCode = 1;
    return;
  }

  const payload = await getPayload({ config });
  try {
    const { docs } = await payload.find({
      collection: collection as never,
      where: { stableId: { equals: stableId } },
      overrideAccess: true,
      limit: 1,
      depth: 0,
    });
    const doc = docs[0] as { id: string | number } | undefined;
    if (!doc) {
      throw new Error(`${collection}/${stableId} not found`);
    }

    // publish gate（`lib/payload/access.ts`の`createPublishGateHook`）はprivilegedPublishContext
    // だけでは足りず、published main rowを書くwriteに`content-publisher`以上のroleを持つuserを
    // 要求する。`content:import --bootstrap-admin`が作った1人目のadmin（platform-adminへ
    // bootstrapされる）でログインして使う。
    const { docs: admins } = await payload.find({
      collection: 'admins',
      overrideAccess: true,
      limit: 1,
      sort: 'createdAt',
      depth: 0,
    });
    const owner = admins[0] as { id: string | number } | undefined;
    if (!owner) {
      throw new Error('no admins collection user found — run content:import --bootstrap-admin first');
    }

    await payload.update({
      collection: collection as never,
      id: doc.id,
      draft: false,
      overrideAccess: true,
      user: owner as never,
      // 公開ページの日本語表示は `nameJa` を優先する。CI fixture の検証値を
      // 実際の見出しへ反映するため、name の更新時は表示用フィールドも同じ値にする。
      data: (field === 'name' ? { name: value, nameJa: value } : { [field]: value }) as never,
      // 既にpublished状態のdocumentを書き換えるだけ（状態遷移なし）だが、publish gateは
      // published main rowを書くwrite全てにcontent-publisher以上のroleを要求するため、
      // fixture更新と同じ特権経路を使う（`tests/content/repository.contract.test.ts`と同じ）。
      context: privilegedPublishContext({
        runId: `e2e-cache-revalidation-${Date.now()}`,
        actorId: 'e2e-test',
        reason: 'tests/e2e/cache-revalidation.spec.ts field update',
      }),
    });

    console.log(`OK: updated ${collection}/${stableId}.${field}`);
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
    // payload.destroy()だけではpg poolのsocketが残りprocessが自然終了しないことがある
    // （docs/reference/database-migration-runbook-v1.md の stamp-environment.mts と同じ現象）。
    process.exit(process.exitCode ?? 0);
  });
