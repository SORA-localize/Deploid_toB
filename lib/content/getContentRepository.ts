/**
 * source選択（`docs/plans/content-platform-migration-plan-v1.md` Task 4 Step 7）。
 *
 * ページ・view modelがcontentへ到達する**唯一の入口**。返り値 `ContentRepository` は
 * `readSnapshot()` を持たないため、ページ処理からimport / export / parity用の全件読み出しへは
 * 到達できない（brief Step 3の依存方向）。
 *
 * 未設定・typoを別sourceへ倒さない。全環境で `CONTENT_SOURCE=payload` を明示する。
 * Productionで `local` を許すのはTask 9の24時間rollback windowだけで、その間だけ
 * `ALLOW_LOCAL_CONTENT_ROLLBACK=true` を設定し、終了時に変数自体を削除する。
 * export / restoreはruntime envを暗黙利用せず、署名済みsnapshot経路を明示する。
 * （Task 5以降）。
 */
import { createContentRepository, type ContentRepository } from './createContentRepository';
import { createPayloadContentSource } from './payloadSource';

export async function getContentRepository() {
  const sourceName = process.env.CONTENT_SOURCE;
  if (sourceName !== 'payload') {
    throw new Error(`CONTENT_SOURCE must be payload after the Production cutover; received ${String(sourceName)}`);
  }
  return createContentRepository(createPayloadContentSource());
}

export type { ContentRepository };
