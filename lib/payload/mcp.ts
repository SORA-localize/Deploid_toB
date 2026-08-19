import { mcpPlugin } from '@payloadcms/plugin-mcp';
import type { CollectionConfig, Plugin } from 'payload';
import { isPlatformAdmin } from './access';
import type { ApprovableCollectionSlug } from './publishApprovedVersion';

/**
 * Task 8: Codex MCPが編集できるcollectionの一覧（brief）。
 *
 * `publishApprovedVersion()` の `ApprovableCollectionSlug` と意図的に同じ集合を使う——
 * 「MCPが書けるcollection」と「承認済み公開の対象になりうるcollection」を一致させることで、
 * MCPが公開できないcollection（`admins` / `media` / `content-route-registry` /
 * `environment-marker`）を新設せずに済む。`article-placements` は意図的に含めない
 * （articleとcollectionの結合を表す内部table。編集はarticle経由が正しい導線で、MCPが直接
 * placementを触るuse caseが無い）。
 *
 * **重要**: この一覧は「どのtoolが存在しうるか」を決めるだけで、実際に呼べるかどうかは
 * 依然として`lib/payload/access.ts`の`contentCollectionAccess`と`createPublishGateHook`が
 * 決める。plugin-mcpの標準tool（find/create/update/delete）は`payload.create/update/delete/find`
 * を`overrideAccess: false`で呼ぶだけであり（`node_modules/@payloadcms/plugin-mcp/src/mcp/
 * tools/resource/*.ts` で実装を確認済み）、独立したpublish/unpublish capabilityは無い
 * （brief / `https://payloadcms.com/docs/plugins/mcp`）。ここへ `delete: true` を含めて
 * いるのも意図的: 個々のAPI keyがcheckboxで`delete`を有効化してしまっても、
 * `contentCollectionAccess.delete = isPlatformAdmin` が実際のPayload access層で
 * 拒否することを多層防御として証明する（`tests/content/mcp-access.test.ts` の
 * 「delete capabilityを持つkeyでも拒否される」テスト）。
 */
export const MCP_EDITABLE_COLLECTIONS: readonly ApprovableCollectionSlug[] = [
  'manufacturers',
  'distributors',
  'robot-series',
  'robots',
  'use-cases',
  'deployments',
  'articles',
];

const COLLECTION_DESCRIPTIONS: Record<ApprovableCollectionSlug, string> = {
  manufacturers: 'Humanoid robot manufacturers and other companies tracked by Deploid.',
  distributors: 'Japan-market distributors/resellers for robots tracked by Deploid.',
  'robot-series': 'Product series/family groupings for robots.',
  robots: 'Individual humanoid/general-purpose robot models.',
  'use-cases': 'Deployment use-case write-ups (industry scenarios).',
  deployments: 'Concrete deployment records (who deployed which robot, where, when).',
  articles: 'News/analysis articles.',
};

/**
 * Payload MCP plugin（brief Task 8 Step 0/2）。
 *
 * - `userCollection: 'admins'` — `payload-mcp-api-keys.user` を`admins`（正式role enum4値、
 *   `lib/payload/access.ts`の`AdminRole`）へ結び付ける。MCP経由の全呼び出しは、bindされた
 *   adminのroleがそのまま`req.user`として通常のPayload access control（
 *   `contentCollectionAccess` / `createPublishGateHook`）を通る。
 * - `collections` — `MCP_EDITABLE_COLLECTIONS` のみをexpose する。`admins` /
 *   `media`（binary upload。brief: 「別toolとして明示的に許可したときだけ有効にする」——
 *   このtaskでは許可しない） / `content-route-registry` / `environment-marker` は
 *   一覧に含めないことで、そもそもMCP toolが生成されない（`getEnabledSlugs()` — plugin側の
 *   実装、`collections`に無いslugのtoolは登録されない）。
 * - `globals` — 未設定（`site-settings`もMCPからは触れない。SEO/バナー運用は現状Admin UI経由）。
 * - `experimental` — 未設定。schema変更・config変更・job・authのtoolは常に無効
 *   （`node_modules/@payloadcms/plugin-mcp`の実装は`experimentalTools?.*?.enabled &&
 *   isDevelopment`を要求するため、未設定なら本番はもちろんdevでも登録されない）。
 */
export function createMcpPlugin(): Plugin {
  return mcpPlugin({
    userCollection: 'admins',
    collections: Object.fromEntries(
      MCP_EDITABLE_COLLECTIONS.map((slug) => [
        slug,
        {
          description: COLLECTION_DESCRIPTIONS[slug],
          enabled: { find: true, create: true, update: true, delete: true },
        },
      ]),
    ),
    /**
     * `overrideApiKeyCollection` で plugin-mcp既定の `payload-mcp-api-keys` collectionへ
     * 2つの修正を入れる。どちらも「動かしてみて実機で見つけた」問題で、brief原文には無い。
     *
     * 1. **fail-open（access が既定で無い）**: `createApiKeysCollection.ts` はこの collection へ
     *    `access` を一切指定しない。Payloadの `defaultAccess`（`Boolean(user)`）——「**なんらかの**
     *    認証済みuserであれば許可」——だけが効くと、`content-reader` roleの管理者でも自分で
     *    MCP API keyを新規発行でき、しかも`user`（keyを紐づけるadmin）fieldにも独自accessが
     *    無いため、**任意のadmin id**（platform-adminのidを含む）を指定できる。これは
     *    「MCP経由のcapabilityはbindされたuserのroleがそのまま通常のPayload accessを通る」
     *    という本file冒頭の設計を前提から崩す（content-readerがplatform-admin紐づけのkeyを
     *    自作すれば、MCP越しにplatform-adminとして振る舞える）。→ create/read/update/deleteを
     *    `platform-admin`限定にする（`collections/Admins.ts`の管理権限と同じ粒度）。
     *
     * 2. **schema自己矛盾（NOT NULL列にSET NULLのFKを向けている）**: plugin既定の`user` field は
     *    `required: true` だが、Payload/drizzleが生成するFK（`user_id`が参照する`admins`側）は
     *    `ON DELETE SET NULL` になる（`migrations/20260819_102308_add_payload_mcp_api_keys.ts`
     *    で確認済み）。列がNOT NULLのままSET NULLしようとするFK actionは自己矛盾で、
     *    「MCP keyが紐づいているadminを削除する」だけで
     *    `null value in column "user_id" ... violates not-null constraint` が発生し、
     *    その削除transaction全体が `current transaction is aborted` で壊れる（実機再現済み——
     *    `tests/content/mcp-access.test.ts` の payload-mcp-api-keys 経路と
     *    `tests/content/admin-access.test.ts` の delete-all admins が同じtransactionを共有する
     *    実運用では、admin削除そのものが機能しなくなる重大なfail）。`user` field を
     *    `required: false` に緩めて列をnullableにし、NOT NULL制約とFKのSET NULL挙動を
     *    一致させることでこの矛盾を解消する（brief範囲外の追加修正。理由は
     *    `migrations/20260819_102308_add_payload_mcp_api_keys.ts` の追記コメント、
     *    再現手順は task-8-report.md 参照）。
     */
    overrideApiKeyCollection: (collection: CollectionConfig): CollectionConfig => ({
      ...collection,
      access: {
        create: isPlatformAdmin,
        read: isPlatformAdmin,
        update: isPlatformAdmin,
        delete: isPlatformAdmin,
      },
      fields: collection.fields.map((field) =>
        'name' in field && field.name === 'user' ? { ...field, required: false } : field,
      ),
    }),
    mcp: {
      serverOptions: {
        instructions:
          'Deploid content workflow: schema取得 → 対象と参照先を検索 → draft作成/更新 → domain validation ' +
          '→ diff要約 → 人間のAdmin reviewを経てcontent-publisherが公開。draft→published遷移は ' +
          'publishApprovedVersion() 経由のみ可能で、MCP経由のupdateで直接 _status: published を書くことはできない。' +
          '詳細は .codex/content-workflow.md を参照。',
        serverInfo: { name: 'Deploid Content MCP Server', version: '1.0.0' },
      },
    },
  });
}
