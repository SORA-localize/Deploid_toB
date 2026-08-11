import type { CollectionConfig } from 'payload';
import { isPlatformAdmin } from '../lib/payload/access';

/**
 * Task 3.5: 「このDBはpreviewかproductionのどちらか」を1行だけ持つmarker table。
 * `docs/reference/database-migration-runbook-v1.md` の `environment:stamp` が書き込む先。
 *
 * `dbName: '_environment_marker'` でtable名をbrief記載の値へ固定する（collection slugを
 * そのままsnake_case変換すると `environment_marker` になり、先頭 `_` が付かないため明示指定
 * している）。
 *
 * `singleton` フィールドは常に `1` だけを入れ、`unique: true` で「このtableには最大1行しか
 * 存在できない」をDB制約として強制する（app側のcheck-then-insertだけに頼らない。並行実行での
 * race — 例えば同時に2つのdeployが誤って走った場合 — でも2行目のinsertはunique制約違反で
 * 確実に失敗する）。`environment` の値自体（preview/production）は問わない — 「このDBの
 * 環境は1つに固定される」という制約は `singleton` 列が担い、「その1つの値が何か」は
 * `environment` 列が持つ、という役割分担。
 *
 * 手動でこのcollectionのdocumentを作成・更新・削除するAPIパスは無い（create/update/deleteは
 * すべて `false`）。書き込みは `scripts/stamp-environment.mts` が `overrideAccess: true` の
 * Local APIで行う一度きりの操作。
 */
export const EnvironmentMarkerCollection: CollectionConfig = {
  slug: 'environment-marker',
  dbName: '_environment_marker',
  admin: { hidden: true, useAsTitle: 'environment' },
  access: {
    read: isPlatformAdmin,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'environment',
      type: 'select',
      required: true,
      options: [
        { label: 'Preview', value: 'preview' },
        { label: 'Production', value: 'production' },
      ],
    },
    {
      name: 'singleton',
      type: 'number',
      required: true,
      defaultValue: 1,
      unique: true,
      admin: { hidden: true, description: 'Always 1. Unique constraint caps this table at a single row.' },
    },
  ],
};
