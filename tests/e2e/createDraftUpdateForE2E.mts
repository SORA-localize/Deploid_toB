/**
 * `tests/e2e/draft-mode-wiring.spec.ts` 専用のヘルパー。`tests/e2e/updateContentForE2E.mts`と
 * 同じ設計（Playwright specからは`execFileSync`で子processとして起動する）だが、こちらは
 * **公開中documentの上に未承認draft updateを積む**（`draft: true`）——main table row
 * （通常のfindが見る場所）は書き換えない。
 *
 * `isDraftSave`（`draft: true`かつ`_status: 'published'`を送らない）なので、publish gate
 * （`lib/payload/access.ts`の`createPublishGateHook`）はcontent-publisher以上のroleも
 * approval contextも要求しない——通常のcontent-draft-writerによるdraft保存と同じ形。
 *
 * Usage: `npx tsx tests/e2e/createDraftUpdateForE2E.mts <collection> <stableId> <field> <value>`
 */
import { getPayload } from 'payload';
import config from '../../payload.config';

async function main(): Promise<void> {
  const [, , collection, stableId, field, value] = process.argv;
  if (!collection || !stableId || !field || value === undefined) {
    console.error('usage: tsx createDraftUpdateForE2E.mts <collection> <stableId> <field> <value>');
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

    await payload.update({
      collection: collection as never,
      id: doc.id,
      draft: true,
      overrideAccess: true,
      data: { [field]: value } as never,
    });

    console.log(`OK: created a pending draft update on ${collection}/${stableId}.${field} (main row untouched)`);
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
