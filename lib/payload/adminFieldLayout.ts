/**
 * Payload Admin の編集画面レイアウト分割ヘルパー
 * （`docs/plans/admin-ux-and-revalidation-fix-plan-v1.md` Task 6）。
 *
 * `type: 'tabs'`（unnamed tab）・`type: 'collapsible'`・`admin.position: 'sidebar'`は
 * いずれも**表示だけの構造**で、`name`を持たずdata pathを増やさない
 * （`node_modules/payload/dist/fields/config/types.d.ts`の`UnnamedTab`/`CollapsibleField`は
 * `name`を持てない）。よってこれらでfieldを並べ替えても、Postgresのcolumn構成・
 * `payload:migrate:create`の生成物には影響しない——**新規`group`を追加するのとは違う**。
 *
 * `baseContentFields()`/`baseRecordContentFields()`（`lib/payload/access.ts`）が返す
 * shared fieldは、全collection共通の配列として1回組み立てられる。collection側で
 * sidebar／tab別に並べ替えるには、その配列を`name`で振り分け直す必要があるため、
 * ここに汎用の振り分け関数を置く。**`access.ts`側のshared field自体は変更しない**
 * （他collectionへの影響を避ける。1 collectionのPOCというTask 6のスコープに合わせる）。
 */
import type { Field } from 'payload';

function fieldName(field: Field): string | undefined {
  return (field as Field & { name?: string }).name;
}

/**
 * `fields`を、`names`に含まれる`name`を持つもの（`matched`、`names`の順序で返す）と
 * それ以外（`rest`、元の順序を維持）に分ける。**同じfieldオブジェクトをそのまま**
 * 振り分けるだけで、複製・変更はしない（labelやaccessが引き継がれる）。
 *
 * `names`に無い名前を書き忘れると、そのfieldは`rest`に残ったまま画面から消えずに済む
 * ——ただしレイアウト上どこにも意図して置いていないことになるため、呼び出し側は
 * `rest`が空になることを別途確認する（`Manufacturers.ts`のコメント参照）。
 */
export function partitionFieldsByName(
  fields: Field[],
  names: readonly string[],
): { matched: Field[]; rest: Field[] } {
  const byName = new Map(fields.filter((f) => fieldName(f) !== undefined).map((f) => [fieldName(f), f]));
  const matched: Field[] = [];
  for (const name of names) {
    const field = byName.get(name);
    if (field) matched.push(field);
  }
  const matchedNames = new Set(names);
  const rest = fields.filter((f) => {
    const name = fieldName(f);
    return name === undefined || !matchedNames.has(name);
  });
  return { matched, rest };
}

/** `fields`の各要素へ`admin.position: 'sidebar'`を付ける（既存の`admin`は保持する）。 */
export function withSidebarPosition<T extends Field[]>(fields: T): T {
  for (const field of fields) {
    const withAdmin = field as Field & { admin?: Record<string, unknown> };
    withAdmin.admin = { ...withAdmin.admin, position: 'sidebar' };
  }
  return fields;
}
