import type { CollectionConfig } from 'payload';

/**
 * `docs/reference/task9-audit-upload-endpoint-design-v1.md`「session状態の保存先」。
 *
 * Vercel FunctionはstatelessなのでStep 1（署名検証・許可object一覧の確立）〜Step 3
 * （completion marker書き込み）を跨ぐ状態をここへ持たせる。**署名検証に成功したあとにしか
 * 行を作らない**（実装時に必須の追加事項——未検証のsessionが後から使われる余地を作らない）。
 *
 * `allowedObjects`はStep 1で署名検証済みmanifestから機械的に導出した値だけを持つ
 * （client申告値を書き込まない）。`uploaded`はStep 2で実際にBlobへ書き終えたobjectだけtrueに
 * 更新する。Step 3はこの記録を鵜呑みにせず、Blobへ`head()`等で再確認してからmarkerを書く
 * （TOCTOU対策、route実装側の責務）。
 *
 * 手動でこのcollectionのdocumentを作成・更新・削除するAPIパスは無い（create/update/deleteは
 * すべて`false`）。書き込みはaudit-upload routeが`overrideAccess: true`のLocal APIで行う。
 */
export const AuditUploadSessionsCollection: CollectionConfig = {
  slug: 'audit-upload-sessions',
  dbName: '_audit_upload_sessions',
  admin: { hidden: true, useAsTitle: 'sessionId' },
  access: {
    read: () => false,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'sessionId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description:
          'crypto.randomBytes由来の推測不能な値。Payloadの自動採番idは連番で推測可能なため、' +
          'これをURL path paramとして使う（自動採番idは使わない）。',
      },
    },
    {
      name: 'requestId',
      type: 'text',
      required: true,
      admin: { description: 'CLI側が生成したcorrelation ID。Step 2/3/DELETEで一致を要求する。' },
    },
    {
      name: 'manifestSha256',
      type: 'text',
      required: true,
      admin: { description: 'canonicalJson(manifest)のsha256。session全体がどのmanifestに紐づくかの記録。' },
    },
    {
      name: 'baselineObjectKey',
      type: 'text',
      required: true,
      admin: { description: 'manifest.storage.objectKey。許可prefix判定の基準値。' },
    },
    {
      name: 'baselineRunId',
      type: 'text',
      required: true,
      admin: {
        description:
          'manifest.provenance.baselineRunId。completion markerへ書く値はここに保存した値を使う' +
          '（Step 3のrequest bodyの値をそのまま信用しない——一致しなければ拒否する）。',
      },
    },
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
      name: 'allowedObjects',
      type: 'array',
      required: true,
      admin: { description: '署名検証済みmanifestから導出した許可object一覧（client申告値ではない）。' },
      fields: [
        { name: 'objectKey', type: 'text', required: true },
        {
          name: 'sha256',
          type: 'text',
          admin: {
            description:
              'signature bundle entryだけnull（manifestに事前宣言されたsha256が無いため。' +
              '`lib/payload/auditUploadSession.ts`のコメント参照）。それ以外は必ず設定される。',
          },
        },
        {
          name: 'size',
          type: 'number',
          admin: {
            description:
              'manifestが値を持つ場合（media）だけ設定する。snapshot本体・signature bundleは' +
              'manifestにsize欄が無いためnull——sha256一致だけがそれらの正当性の根拠になる' +
              '（sha256が実質的に長さも含めて内容を一意に決める）。',
          },
        },
        { name: 'uploaded', type: 'checkbox', required: true, defaultValue: false },
        {
          name: 'stableId',
          type: 'text',
          admin: {
            description:
              'media entryだけ設定する（`MediaInventoryEntry.stableId`）。Step 3で' +
              '`manifest.mediaInventory`と同じ形を再構築し、既存exporterと同じ' +
              '`sha256Hex(canonicalJson(mediaInventory))`でmediaInventorySha256を計算するために必要。',
          },
        },
        { name: 'filename', type: 'text', admin: { description: 'media entryだけ設定する。' } },
        { name: 'mimeType', type: 'text', admin: { description: 'media entryだけ設定する。' } },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Completed', value: 'completed' },
      ],
      admin: {
        description:
          'completedになったsessionはStep 2/3を二度と受け付けない（replay防止）。期限切れ判定は' +
          '`expiresAt`との比較で別途行う（statusをexpiredへ書き換える専用処理は持たない）。',
      },
    },
    {
      name: 'expiresAt',
      type: 'text',
      required: true,
      admin: { description: 'ISO date。この時刻を過ぎたpending sessionはStep 2/3を拒否し、cleanup対象になる。' },
    },
  ],
};
