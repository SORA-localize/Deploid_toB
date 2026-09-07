/**
 * `payload generate:types`の等価物を、明示的に`await`する形で直接呼ぶラッパー。
 *
 * 背景（`docs/plans/admin-layout-rollout-plan-v1.md` T1〜T7）: インストール済み
 * Payload 3.87.1は、`getPayload()`起動時に型生成を`void this.bin({ args: ['generate:types'],
 * log: false })`というfire-and-forgetで実行しており、awaitしていない
 * （`node_modules/payload/dist/index.js:359`）。そのため`getPayload()`が返った時点で
 * 型生成がまだ進行中の可能性があり、直後に`payload-types.ts`を読むと古い内容を
 * 比較してしまう——さらに`payload:migrate:create`はコマンド完了時に`process.exit(0)`する
 * ため、バックグラウンドの型生成がファイル書き込み前に打ち切られるケースもある。
 *
 * このscriptは`payload/node`が公開する`generateTypes()`
 * （`node_modules/payload/dist/exports/node.js`）を直接・同期的にawaitする。
 * `generateTypes()`はconfigを読むだけで`payload.init()`やDB接続を必要としない
 * （`node_modules/payload/dist/bin/generateTypes.js`実体、`node_modules/payload/dist/bin/index.js`
 * の呼び出し方と同じ——configのdynamic importを解決してそのまま渡すだけ）。
 *
 * Usage: `tsx scripts/generate-payload-types.mts`
 *
 * Env vars: `payload.config.ts`が読むもの（`DATABASE_URL`, `PAYLOAD_SECRET`）が必要
 * （`requireEnv`参照）。`PAYLOAD_CONFIG_PATH`は省略可——省略時は
 * `<repo root>/payload.config.ts`（`run-payload-migration-cli.mts`と同じ解決）。
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { generateTypes } from 'payload/node';

async function main(): Promise<void> {
  const configPathRaw = process.env.PAYLOAD_CONFIG_PATH;
  const configPath = configPathRaw
    ? path.isAbsolute(configPathRaw)
      ? configPathRaw
      : path.resolve(process.cwd(), configPathRaw)
    : path.resolve(process.cwd(), 'payload.config.ts');

  const imported = (await import(pathToFileURL(configPath).toString())) as {
    default?: unknown;
  };
  const config = imported.default !== undefined ? await imported.default : imported;

  await generateTypes(config as Parameters<typeof generateTypes>[0]);
  console.log('Done.');
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
