---
title: Payload Admin 公開UI 実行計画
status: plan
updated: 2026-09-03
scope: content-platform-migration
---

# Payload Admin 公開UI 実行計画 v1

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development`
> (recommended) or `superpowers:executing-plans` to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.
> 実装前に `ai/rules/10-workflow.md` §0（最重要原則）と §0.5（特に避けること）を読むこと。

**Goal:** `content-publisher` 以上が Payload Admin の Publish ボタンから、
いま画面で見ている内容を公開できるようにする。権限モデルと publish gate は変更しない。

**Architecture:** Payload 標準と同じ `draft=true` の下書き保存を先に行い、保存要求ごとの
暗号学的ランダムtokenをversionへ記録する。公開routeはtokenが最新versionに一致するときだけ
既存の `publishApprovedVersion()` へ正確なversion idを渡し、別利用者の版を誤公開しない。

**Tech Stack:** Payload CMS 3.87.1 / Next.js 16 App Router / React 19 / Postgres

**Spec:** `docs/plans/admin-publish-ui-plan-v1.md` の「設計」節（本書内包）

---

## Context

Payload Admin から記事・ロボットを**公開できない**。`publishApprovedVersion()`
（`lib/payload/publishApprovedVersion.ts`）は完成しているが `src/app` から呼ぶ経路が1つも無く、
カスタムUIコンポーネントの実績もゼロ（`src/app/(payload)/admin/importMap.js` はプラグイン提供の2件のみ）。

### 今 Publish を押すと何が起きるか

`createPublishGateHook`（`lib/payload/access.ts:489`）が承認context無しの publish を
素の `Error('publish-approval-required')` で拒否する。素の `Error` は `status` を持たないため
`payload/dist/utilities/routeError.js` が **HTTP 500** にし、`isErrorPublic` が false なので
本文を `'Something went wrong.'` へ差し替える。

**編集者には原因も次の行動も分からない。** `publish-approval-required` はサーバーログにしか出ない。

### 承認contextは route から発行できない（構造的制約・正しい設計）

`approvedPublishContext` は `req.context` 経由で渡され、**WeakSet でオブジェクト同一性まで検証**
される（`lib/payload/publishAuthorization.ts:26-27, 71-81`）。同形の複製オブジェクトは弾かれる。

さらに `scripts/check-publish-authorization-boundaries.mjs` が
「import してよいのは `publishApprovedVersion.ts` だけ」を機械強制し、`npm run check` に入っている。
HTTP 経由の書き込みは `createPayloadRequest.js:55` が `context: {}` を固定するため、
外部からの context 注入も構造的に不可能。

**したがって新しい route は必ず `publishApprovedVersion()` を経由する。**

---

## 2026-09-03 計画監査の結果（着手前に必ず読む）

初版計画は「UI が versionId を送って版に意図を束縛する」設計だった。
`ai/rules/10-workflow.md` §1.5 に従って監査した結果、**24件の指摘があり、うち2件が Critical で
中核設計が成立しないことが判明した。** 以下は訂正済みの事実。

| 初版の前提 | 実際（実コードで確認） |
|---|---|
| カスタム PublishButton は版情報を受け取れる | `PublishButtonClientProps = {}` — **空**（`payload/dist/admin/elements/PublishButton.d.ts`）。`DocumentInfoContext` も `versionCount`（数）だけで版 id を持たない |
| Publish は「公開を指示する」操作 | **保存操作**。標準実装は `submit({ overrides: { _status: 'published' } })`（`@payloadcms/ui/dist/elements/PublishButton/index.js:157`） |
| `Admins.ts` は `auth: true` なので SameSite が付かない | **誤り**。`collections/config/defaults.js:131-135` が `{ sameSite: 'Lax', secure: false }` を必ず入れる。**本当の穴は `secure: false`**（下記 D-1） |
| 許可originに `resolvePublicServerUrl()` を使う | **不可**。undefined を返しうるうえ、Preview では branch URL を返すので deployment 固有URLから開いた admin が全て 403 になる |
| 文言を `lib/uiText.ts` に置く | admin は Payload 独自 i18n（`@payloadcms/translations` に `ja` 同梱）。公開サイト用の表に混ぜると英語ロケールで日本語ボタンが混在する |

**特に2つ目が致命的。** fetch を投げるだけのボタンにすると、**編集中の内容が公開されず、
しかもエラーにならない**。初版の検証手順「編集 → Publish → 公開される」は、
古い内容が公開されて緑になるため、ゲートとして機能していなかった。

### 2026-09-03 再レビューで追加修正した事項

| 再レビューで見つかった問題 | 本版での修正 |
|---|---|
| `_status: 'draft'` だけではdraft保存にならない | Payload標準と同じ `draft=true`、PATCH、`skipValidation: true` を必須化 |
| routeが保存後の「最新」を選ぶと他人の版を拾う | 保存要求固有の `adminPublishIntentToken` と最新versionを照合 |
| 新規作成時は `id` が無く、保存後にもbutton closureから取得できない | `operation === 'create'` ではPublishを表示しない。Save Draft後の編集画面から公開 |
| `submit()` の失敗時戻り値が曖昧 | `result?.res.ok === true` の場合だけ公開routeへ進む |
| route/UI/競合がrequired CIで未検証 | route service・componentテストを `npm run check` に含め、Admin E2Eを `content-e2e` へ追加 |
| API側の日本語化とja/en UIが衝突 | APIは安定したerror code/field pathだけ返し、翻訳はclientで行う |

---

## Global Constraints

- `lib/payload/publishApprovedVersion.ts` の公開関数・引数・戻り値の契約を変更しない
- `lib/payload/access.ts` の publish gate を変更しない
- `approvedPublishContext` / `privilegedPublishContext` を新しいファイルから import しない
  （`check:publish-authorization-boundaries` が機械強制）
- admin 用の文言を `lib/uiText.ts`（公開サイト用）へ入れない
- 環境変数に依存する許可origin allowlist を作らない
- `export const runtime` を route に書かない（`cacheComponents: true` と非互換。
  実測コメントが `src/app/api/admin/audit-upload/session/route.ts:11-15` にある）
- 新規作成画面ではカスタム PublishButton を表示しない。先に Save Draft を成功させてIDを確定する
- APIレスポンスに日本語・英語の表示文言を埋め込まない。`error` と `fields` は安定した識別子にする
- **`lib/content/payloadMappers.ts` と `lib/content/domainTypes.ts` を変更しない。**
  mapper が field を明示列挙する方式であることが、`adminPublishIntentToken` を
  snapshot・parity・公開サイトから隔離する唯一の仕組み。ここへ token を足すと
  export が snapshot schema の `unknown field is not allowed` で落ちる
  （`scripts/snapshotSchema.mts:153`。`:190` の `unknown key` は `specs`/`fieldEvidence` 専用の
  `openRecordOf` 用で、top-level を拒否するのは `:153` の `object()` 側）

---

## 設計

### D-1. `draft=true` の下書き保存 → tokenで版を束縛 → 公開

カスタム PublishButton は次を行う。

```
① token = crypto.randomUUID()
② Payload標準と同じ action（?draft=true）へPATCHし、
   {_status: 'draft', adminPublishIntentToken: token} をversionとして保存
③ submitの result?.res.ok === true の場合だけ
   POST /api/admin/publish { collection, id, publishIntentToken: token }
④ routeが最新versionのtoken一致を確認し、そのversion idをpublishApprovedVersion()へ渡す
```

`submit()` には必ず次を渡す。通常のDocumentInfo actionには `draft=true` が無く、
`_status: 'draft'` だけを渡すと公開済みmain rowをunpublishし得るため、省略禁止。

```ts
await submit({
  action: `${api}/${collectionSlug}/${id}?depth=0&draft=true&fallback-locale=null`
        + `&locale=${locale}&adminPublishIntent=${publishIntentToken}`,
  method: 'PATCH',
  overrides: { _status: 'draft' },
  skipValidation: true,
  disableSuccessStatus: true,
})
```

**tokenは form data ではなく query param で送る。これは必須。**

`overrides` で送る案は**実装を読んで却下した**。`fieldSchemasToFormState/addFieldStatePromise.js:80-88`
は hidden field を「描画しないだけ」で、値は `fieldState.value` として form state に載せる:

```js
if (passesCondition === false && field.type !== 'tab' && !isPresentationalWithSubFields) {
  if (fieldAffectsData(field) && data?.[field.name] !== undefined) {
    fieldState.value = data[field.name];   // 値は載る
  }
  state[path] = fieldState;
  return;                                   // 描画だけ止める
}
```

したがって `overrides` 方式だと、一度 Publish した後の form state が token T を保持し、
**その後の通常の Save Draft が T を再送する**（`Form/index.js:293-297` の overrides は
Publish 側だけに効き、通常保存は form state をそのまま送る）。結果
「Save Draft しただけの版が公開可能になる」となり、token の前提が崩れる。

query param なら token は form state に一切入らないため、この経路が**原理的に消える**。

`beforeChange` hook は `req.searchParams.get('adminPublishIntent')` を読み、
無ければ `null` を書く。`PayloadRequest` は URL 由来の `searchParams` を持ち
（`payload/dist/types/index.d.ts:71`）、`createPayloadRequest.js:20` が実 URL から投入する。
通常の Save Draft・autosave・別利用者の更新には param が無いので、確実に `null` になる。

`adminPublishIntentToken` field は `admin: { hidden: true }` に加えて
**`access: { create: () => false, update: () => false }`** を付ける。
値を書けるのは hook だけになり、API client から直接 token を差し込む経路が閉じる。
APIの認可境界ではなく、**「どの保存要求が作ったversionか」を識別する競合制御用marker**である。

routeは「最新versionを取ったから正しい」と仮定しない。最新versionの
`version.adminPublishIntentToken === publishIntentToken` を確認し、不一致なら409
`publish-candidate-replaced` で停止する。一致した場合だけ、そのversion idとtokenを除外した
canonical hashを `publishApprovedVersion()` へ渡す。

`publishApprovedVersion.ts` の `SYSTEM_FIELDS` に `adminPublishIntentToken` を追加する。
これによりtokenはcanonical contentにも公開main rowにもコピーされず、関数の公開契約は変わらない。

競合防御は2層になる。

1. routeがversionを選ぶ前の割り込み: token不一致で停止
2. routeがversionを選んだ後の割り込み: `assertApprovedVersionIsStillLatest`
   （`publishApprovedVersion.ts:126, 148`）で停止

フェーズ①が失敗した場合はrouteを呼ばない。フェーズ①成功後にフェーズ③以降が失敗しても、
`draft=true` 保存なので公開済みmain rowは変更されず、既存の公開内容が残る。

**`approvalManifestHash` の位置づけを正直に書く**: 承認と公開が同一アクター・同一リクエストなので、
このハッシュは二者承認の証明ではなく**同値性の記録**でしかない。TOCTOU 防御は
token照合と `assertApprovedVersionIsStillLatest` が担う。将来「承認済みだから安全」と誤読させないこと。

### D-1b. なぜ2リクエストのままにするか（DB schema を触る判断の根拠）

**この計画は8 collection + version tableへ列を足す（計16列）。** その代償を払う理由を明記する。

token が要るのは「draft保存」と「公開」が**別のHTTPリクエスト**だからである。
検討した代替は3つ。

**案A: routeがLocal APIでdraft保存も行う（token不要）**

client が form data を route へ送り、route が `payload.update({ draft: true })` → 公開を
**同一プロセス・同一transaction**で行う。tokenも列もmigrationも不要になり、
本計画の Task 1・Task 2 が丸ごと消え、MCP露出・`payload-types.ts` drift・
snapshot leak リスクも消える。

**採らない理由**: Payload の form submission 機構を全て自前で持つことになる。
具体的には (1) field単位のvalidation error表示（`Form` が response の `errors[].field` を
form state へ書き戻す経路）、(2) 保存成功後の form state リセットと `modified` 解除、
(3) locale・`beforeSubmit` hook。これらは admin UI の使い勝手そのもので、
再実装すると「公開だけ挙動が違う画面」になる。

なお **upload の扱いは代償に含まれない**。対象7 collectionに upload field は無く、
`Media` は `ApprovableCollectionSlug` 外である。案Aの費用は当初見積もりより小さいが、
(1)〜(3) だけでも十分重いと判断した。

**案C: 保存応答の `updatedAt` で束縛（列不要）** — **実装不能。検証済み。**

`submit()` は `{ formState, res }` を返すが、`Form/index.js:345` が
`json = await res.json()` で**ボディを既に消費している**。Response body は一度しか読めないため、
呼び出し側は保存されたdocを読めない。`res.ok` は property なので参照できる（D-1 の成功判定はこれ）。

**採用: 案B（2リクエスト + token）**

案Aの費用（form機構の再実装）と案Bの費用（14列 + migration）を比べ、
**案Bの費用は一度払えば終わり**である一方、案Aの費用は Payload のバージョン更新のたびに
追随コストが続くと判断した。列は `admin.hidden` の運用メタデータで、mapper が明示列挙方式のため
公開系へは一切現れない（Global Constraints 参照）。

**この判断を将来見直す条件**: Payload が custom PublishButton へ版情報を渡すようになった場合、
または `submit()` が保存応答を呼び出し側へ返すようになった場合。どちらかが実現すれば
token は不要になるので、そのときは列を落とす。

### D-1c. `submit()` の戻り値は experimental API である

`@payloadcms/ui/dist/forms/Form/types.d.ts:97-101` の `Submit` 型には

> `@experimental` - Note: the `{ res: ... }` return type is experimental and may change in the future.

と明記されている。D-1 の成功判定（`result?.res.ok === true`）はこれに依存する。

**破壊された場合の兆候**: `result` が `undefined` になり、成功しても公開へ進まなくなる
（＝fail-closed。誤って公開されることはない）。Task 5 の component テストがこれを検出する。
Payload を上げるときは、このテストの結果を必ず確認する。

### D-2. 作成画面と編集画面を分ける

`useDocumentInfo().id` はcreate画面では未定義で、`submit()` のresponse bodyはForm内部で消費される。
本計画では作成と公開を1クリックに統合しない。`useOperation() !== 'update'` または `id == null` の場合、
カスタムPublishButtonは `null` を返す。利用者は標準Save Draftで作成し、IDが付いた編集画面で公開する。

### D-3. 同一オリジン判定はリクエスト自身の値で行う

`payload.config.ts` は `csrf` 未設定 → `extractJWT.js:21` が **任意 Origin の cookie を受け入れる**。

判定条件（env 不要）:
- `Sec-Fetch-Site === 'same-origin'` を必須（無い / `cross-site` / `same-site` は拒否）
- `Origin` のホストが `x-forwarded-host`（無ければ `Host`）と一致

local / Preview / 本番 / 独自ドメインの全てで追加設定なしに動き、合成 `Request` で単体テストできる。

**2条件の位置づけを明確にしておく**: ブラウザ由来の CSRF を塞いでいるのは
`Sec-Fetch-Site: same-origin` の方である（この header は JS から偽装できない）。
`Origin` / `x-forwarded-host` の一致は **defense in depth** であって必須条件ではない。
将来 proxy 構成を変えて後者が壊れたとき、何を守っていたのかが分かるようにここに書いておく。

**別タスクへ切り出すもの**:
- `payload.config.ts` の `csrf` 全体適用（全 Payload route を守れるが、静的allowlistなので
  誤ると admin ログインごと壊れる。本番originを env へ確実に配線してから）
- `Admins` の cookie `secure`（`defaults.js` が `secure: false` を入れるため
  `generateCookie` の `secure = secureArg || sameSite === 'None'` が false になり、
  **本番HTTPSでも `Secure` 属性が付かない**）

### D-4. Next route を使う（Payload endpoint / Server Action ではなく）

初版は「HTTP経由は `context: {}` 固定だから」を根拠にしていたが、
`publishApprovedVersion` は自前でトランザクションを張り HTTP の req を使わないため、
**この制約は3案すべてに等しく当てはまる**。根拠として不成立だったので差し替える。

Next route を選ぶ理由は**既存前例に揃えるため**。`src/app/api/admin/audit-upload/**` と
`src/app/api/draft-mode/enable/route.ts`（`payload.auth` + role チェックのみで認証）があり、
純粋関数 + `.d.mts` + 単体テストという検証の型も既存に揃う。

---

## File Structure

### 新規作成

| file | 役割 |
|---|---|
| `lib/payload/adminPublishIntent.ts` | token field定義、通常保存で古いtokenを消すhook、token照合 |
| `lib/payload/publishRequestAuth.ts` | 同一オリジン判定 + 401/403を区別するpublisher認証 |
| `lib/payload/publishFromAdmin.ts` | document/version解決、token照合、既存publish service呼び出し |
| `src/app/api/admin/publish/route.ts` | POST限定。入力・origin・認証を検証しserviceの結果をHTTPへ写像 |
| `components/admin/PublishFromApproval.tsx` | PublishButton 差し替え |
| `migrations/20260903_000000_admin_publish_intent_token.ts` | 7つのmain/version tableへnullable token列を追加 |
| `migrations/20260903_000000_admin_publish_intent_token.json` | 上記migration後のPayload schema snapshot |
| `scripts/check-admin-import-map.mjs` | importMap のキー欠落検出（下記 T4 参照） |
| `scripts/check-admin-import-map.d.mts` | 型宣言（`allowJs: false` のため必須） |
| `tests/content/admin-publish-intent.test.ts` | tokenの保存・消去・canonical hash除外 |
| `tests/content/publish-request-auth.test.ts` | オリジン / role の単体テスト |
| `tests/content/admin-publish-route.test.ts` | route/service、404、競合、error codeのテスト |
| `tests/content/admin-import-map.test.ts` | キー欠落検出の単体テスト |
| `tests/components/publish-from-approval.test.tsx` | UIの保存→公開順序、失敗停止、表示条件 |
| `tests/e2e/payload-admin-publish.spec.ts` | publisher でログイン → 編集 → Publish → 公開反映 |
| `tests/e2e/seedAdminPublishE2E.mts` | throwaway DBへpublisher/draft-writer fixtureを冪等投入 |

### 変更

| file | 変更内容 |
|---|---|
| `collections/*.ts`（7つ） | token field/hookと `admin.components.edit.PublishButton` を追加 |
| `lib/payload/publishApprovedVersion.ts` | tokenをsystem fieldとしてcanonical hash・公開dataから除外 |
| `src/app/(payload)/admin/importMap.js` | 再生成またはキー追記 |
| `migrations/index.ts` | token migrationを登録 |
| `package.json` / `package-lock.json` | `@payloadcms/ui` を直接依存へ追加しcheck scriptを配線 |
| `knip.json` | `src/app/(payload)/admin/importMap.js` を entry へ |
| `payload.config.ts` | `i18n.translations` に admin 用文言 |
| `.github/workflows/content-e2e.yml` | Admin publish E2Eを既存の直列Playwright stepへ追加 |
| `docs/README.md` | active plan一覧へ本計画を登録。完了時はarchive移動と同時に削除 |

### 変更しない

`lib/payload/access.ts` / `lib/payload/publishAuthorization.ts` / `lib/uiText.ts`

---

## Tasks

> **Task 1 に入る前に**: `docs/README.md` の「いま動いているもの」へ本計画・branch・開始日を追加する
> （`ai/rules/80-doc-governance.md`）。完了時は本書を `docs/archive/` へ移し active table から削除する。
>
> **同じく Task 1 の前に**: `npm ci` を実行する。本計画は `@payloadcms/ui` と `payload` の
> 実装を多数引用しており、それらが解決できない環境では前提を検証できない。


### Task 1: 公開要求tokenをschemaとversionへ追加する

**Files:** `lib/payload/adminPublishIntent.ts`, `lib/payload/publishApprovedVersion.ts`,
`collections/Manufacturers.ts`, `collections/Distributors.ts`, `collections/RobotSeries.ts`,
`collections/Robots.ts`, `collections/UseCases.ts`, `collections/Deployments.ts`, `collections/Articles.ts`,
`tests/content/admin-publish-intent.test.ts`

**Interfaces:**
- Produces: `ADMIN_PUBLISH_INTENT_FIELD = 'adminPublishIntentToken'`
- Produces: `adminPublishIntentField(): Field`
- Produces: `clearUnclaimedAdminPublishIntent: CollectionBeforeChangeHook`
- Produces: `assertLatestVersionMatchesPublishIntent(version, expectedToken): void`

- [x] **Step 0: `admin.hidden` の挙動を実測した（結論のみ。再実行不要）**

**結果: hidden field は描画されないだけで、値は form state に載る。**
`@payloadcms/ui/dist/forms/fieldSchemasToFormState/addFieldStatePromise.js:74-88` に
「Short-circuit hidden fields to prevent recursing and **rendering**」とあり、
`fieldState.value = data[field.name]` を設定してから `return` する。

したがって当初案（`overrides` で token を送る）は
**一度 Publish した後の通常 Save Draft が token を再送する**ため成立しない。
D-1 を query param 方式へ変更済み。この Step の目的は達成されたので実装時の作業は無い。

**hook が読むのは `req.searchParams` であって `data` ではない。**
Step 1 以降のテストはこの前提で書くこと。

- [ ] **Step 1: 失敗するtoken単体テストを書く**

次を固定する。

```ts
expect(adminPublishIntentField()).toMatchObject({
  name: 'adminPublishIntentToken',
  type: 'text',
  admin: { hidden: true },
})
expect(() => assertLatestVersionMatchesPublishIntent(
  { version: { adminPublishIntentToken: 'token-b' } },
  'token-a',
)).toThrow('publish-candidate-replaced')
```

hookは **`req.searchParams` の `adminPublishIntent`** を読み、無ければ `null` を書く（Step 0）。
`data` は見ない。これによりAのtokenをBの通常保存が引き継がない。

```ts
const withParam = { searchParams: new URLSearchParams('adminPublishIntent=tok') };
const withoutParam = { searchParams: new URLSearchParams() };

expect(clearUnclaimedAdminPublishIntent({ data: {}, req: withParam }))
  .toMatchObject({ adminPublishIntentToken: 'tok' });
expect(clearUnclaimedAdminPublishIntent({ data: { adminPublishIntentToken: 'stale' }, req: withoutParam }))
  .toMatchObject({ adminPublishIntentToken: null });   // form state の再送を無視する
```

- [ ] **Step 2: テストが未実装で落ちることを確認する**

Run: `npx vitest run tests/content/admin-publish-intent.test.ts`

Expected: moduleまたはexport未定義でFAIL。

- [ ] **Step 3: field・hook・照合関数を最小実装する**

**hook は `req.searchParams.get('adminPublishIntent')` を読む。`data` は見ない**（Step 0）。

```ts
// 全 content collection 共通の beforeChange hook
({ data, req }) => ({
  ...data,
  adminPublishIntentToken: req.searchParams?.get('adminPublishIntent') ?? null,
})
```

param が無い保存（通常のSave Draft・autosave・別利用者の更新・import/restore）は必ず `null` になる。

field は次を満たす。

- `admin: { hidden: true }` — 編集画面に出さない
- **`access: { create: () => false, update: () => false }`** — 値を書けるのは hook だけ。
  API client から直接 token を差し込む経路を閉じる
- `access.read` は認証済みadminに限定（公開APIへ露出させない）

tokenは認可情報ではないので update access の代用にしない。
照合は空文字・null・不一致をすべて `publish-candidate-replaced` としてfail-closedにする。

- [ ] **Step 4: 7 collectionへfieldとhookを配線する**

各collectionのfieldsへ `adminPublishIntentField()` を1回だけ追加する。
`clearUnclaimedAdminPublishIntent` は既存の `beforeChange` を置き換えず配列へ追加し、
publishクリックの明示tokenは保持し、それ以外の書き込みではnullへする。

- [ ] **Step 5: tokenをcanonical contentと公開dataから除外する**

`publishApprovedVersion.ts` の `SYSTEM_FIELDS` に `adminPublishIntentToken` を追加し、次をテストする。

```ts
expect(computeCanonicalHash({ name: 'A', adminPublishIntentToken: 'x' }))
  .toBe(computeCanonicalHash({ name: 'A', adminPublishIntentToken: 'y' }))
```

- [ ] **Step 6: Task 1テストを緑にする**

Run: `npx vitest run tests/content/admin-publish-intent.test.ts tests/content/publish-approved-version.test.ts tests/content/publish-gates.test.ts`

Expected: PASS。

---

### Task 2: token列のmigrationを追加する

**Files:** `migrations/20260903_074709_admin_publish_intent_token.ts`,
`migrations/20260903_074709_admin_publish_intent_token.json`, `migrations/index.ts`,
`tests/content/migration.test.ts`

**Interfaces:**
- Consumes: Task 1の `adminPublishIntentToken` field
- Produces: main/version table双方のnullable `admin_publish_intent_token` 列（計16）

- [ ] **Step 1: migration未適用を検出するテストを書く**

既存migration testへ、**8つ**のmain tableと対応する`_v` tableの双方に
`admin_publish_intent_token` / `version_admin_publish_intent_token` が存在することを追加する。
**対象は合計16列**（Task 1 で `baseContentFields()` へ入れたため7ではなく8 collection。
実測で確認済み: main 8列 + version 8列）。

- [ ] **Step 2: テストが列不足で落ちることを確認する**

Run: `npx vitest run tests/content/migration.test.ts`

Expected: 最初の対象tableでcolumn not found。

- [ ] **Step 3: migrationを生成・監査してindexへ登録する**

Run: `npm run payload:migrate:create -- admin_publish_intent_token`

生成名が異なる場合も、この計画の参照と `migrations/index.ts` を実際の生成名へ同じcommitで揃える。
upは16列をnullable varcharとして追加し、downは同じ16列だけを削除することを目視確認する。
既存列・tableのdropや型変更が混ざった場合は採用せず、schema差分の原因を先に直す。

- [ ] **Step 4: 空のthrowaway DBで往復検証する**

Run: `npm run payload:migrate && npx vitest run tests/content/migration.test.ts`

Expected: migrationとtestがPASS。

- [x] **Step 5: Preview DB へ適用する（2026-09-03 完了）**

**これを飛ばすとPreview deploymentが必ず失敗する。** 実際にPR #53で踏んだ:

```
column manufacturers.admin_publish_intent_token does not exist
Error: Failed to collect page data for /manufacturers/[slug]
Command "npm run vercel-build" exited with 1
```

`verify` と `content-e2e` は使い捨てPostgresへ自分でmigrateするので緑になるが、
**Vercel Preview buildは Preview Supabase を読む**。列が無ければ全ページのdata収集で落ちる。

Vercelのbuild pipelineがmigrationを自動適用する仕組みは**無い**
（`vercel-build` は `fetch-cosign-binary` → `next build` → `check:audit-upload-traces` のみ）。
`docs/reference/database-migration-runbook-v1.md` §2 のとおり**人が事前に適用する**。

```bash
# runbook §2。Vercelの環境変数DATABASE_URL（transaction pooler:6543）は使わない。
# migrationにはsession pooler（port 5432）を明示exportする。
DATABASE_URL="<preview session pooler URL:5432>" npm run payload:migrate
DATABASE_URL="<preview session pooler URL:5432>" npm run payload:migrate:status
```

接続文字列は `~/secrets/deploid-supabase-connections.txt` の `pooler` 行
（`?sslmode=require&uselibpqcompat=true` 必須）。`PAYLOAD_SECRET` も要る
（`~/secrets/deploid-payload-secret-preview.txt`。無いと config 評価で fail-closed する）。

**適用してからPreview deploymentをredeployする。**

#### `payload:migrate` が固まる場合（2026-09-03 実際に踏んだ）

`scripts/run-payload-migration-cli.mts:1-40` が記録している **`payload/bin.js` の
worker-thread race** を踏むと、CLI が **DBへ接続する前に無反応のまま止まる**。
実測: プロセス `SN`、TCP接続0本、DB側クエリ0件、8分経過。
`migrate:status` は同じCLIで完走するので、接続やcredentialの問題と誤診しないこと。

race は確率的なので数回試して通ることもあるが、CI では3回連続で踏んだ記録がある。
通らない場合は **psql で直接適用する**。以下は実際に成功した手順。

1. **SQL を機械抽出して検証**（手打ちしない）。migration の `up()` から文を取り出し、
   16文すべてが `ALTER TABLE ... ADD COLUMN ... varchar` で
   `NOT NULL` / `DROP` / `DEFAULT` を含まないことをプログラムで確認する
2. **列追加と記録行を単一トランザクションにする**。Payload自身も `commitTransaction` で
   同じ構造。片方だけ入る状態を作らない
3. **batch 番号は実装から決める**。`payload/dist/database/migrations/getMigrations.js` は
   `where: { batch: { not_equals: -1 } }` で **dev-push が残す `batch: -1` 行を除外**し、
   `latestBatch + 1` を使う。適用直前に
   `select max(batch) from payload_migrations where batch <> -1` で確認する
4. `name` は **migration のファイル名（拡張子なし）と完全一致**させる。
   ずれると `migrate:status` が未適用と誤表示し、次回 `migrate` が二重適用を試みて
   `column already exists` で失敗する

```sql
BEGIN;
  ALTER TABLE "manufacturers" ADD COLUMN "admin_publish_intent_token" varchar;
  -- ...（up() の16文）
  INSERT INTO payload_migrations (name, batch) VALUES ('<migration file name>', <latestBatch+1>);
COMMIT;
```

**検証は `migrate:status` が `Yes` を返すことで行う。** Payload 自身に読ませて
「適用済み」と認識させられれば、手書きの記録行が正しい形だと確認できる。

**2026-09-03 Preview 適用済み**: 16列（全て nullable varchar）、`batch=3`、
`migrate:status` が `Yes`、marker `preview` 不変、データ件数不変
（robots 63 / manufacturers 26 / articles 34）、Preview build 成功。

**列がnullableなので、この順序は安全**: 先に列を足しても既存の古いコードは列を知らないだけで壊れない
（backward compatible）。逆順（コードを先にdeploy）は今回踏んだとおり壊れる。

- [ ] **Step 6: Production への適用は本番cutover時に行う**

同じ手順をProduction session poolerに対して実行する。**mainへmergeする前に適用しておく**
（mergeするとProduction deploymentが走り、列が無ければ本番サイトのbuildが落ちる）。
Rollback節のとおり、列は残す判断が既定。


---

### Task 3: 同一オリジン判定と401/403を区別する認証を実装する

**Files:** `lib/payload/publishRequestAuth.ts`, `tests/content/publish-request-auth.test.ts`

**Interfaces:**
- Produces: `isSameOriginRequest(request: Request): boolean`
- Produces: `authenticatePublisher(request, payload): Promise<PublisherAuthResult>`

```ts
type PublisherAuthResult =
  | { ok: true; user: AuthenticatedAdminUser }
  | { ok: false; status: 401; error: 'unauthenticated' }
  | { ok: false; status: 403; error: 'insufficient-role' }
```

- [ ] **Step 1: 合成Requestとauth stubで失敗するテストを書く**

同一origin許可、`Sec-Fetch-Site` 欠落/cross-site/same-site拒否、OriginとHost不一致拒否、
`x-forwarded-host` 優先を固定する。認証はuser無しを401、draft-writerを403、publisher以上をokにする。

- [ ] **Step 2: テストが未実装で落ちることを確認する**

Run: `npx vitest run tests/content/publish-request-auth.test.ts`

- [ ] **Step 3: 純粋関数を実装する**

`payload.auth({ headers: request.headers })` の結果を先に認証有無、次に
`isContentPublisherOrAboveUser` でrole判定する。nullへ畳み込まない。

- [ ] **Step 4: テストを緑にし、origin判定のmutationで赤転を確認する**

Run: `npx vitest run tests/content/publish-request-auth.test.ts`

Expected: PASS。確認後、一時的に `Sec-Fetch-Site` 判定を外してFAILすることを確認し、元へ戻す。

---

### Task 4: tokenに束縛された公開serviceとAPI routeを実装する

**Files:** `lib/payload/publishFromAdmin.ts`, `src/app/api/admin/publish/route.ts`,
`tests/content/admin-publish-route.test.ts`

**Interfaces:**
- Consumes: Task 1のtoken照合、Task 3のorigin/auth、既存 `publishApprovedVersion()`
- Produces: `publishFromAdmin(args): Promise<PublishApprovedVersionResult>`
- Produces: `POST(request: Request): Promise<Response>`

```ts
interface AdminPublishBody {
  collection: ApprovableCollectionSlug
  id: string | number
  publishIntentToken: string
}
```

- [ ] **Step 1: service/routeの失敗テストを書く**

最低限、body不正400、未認証401、role不足403、origin不正403、document不在404、version不在404、
token不一致409、ValidationError 422、lock/transaction unavailable 503、未知例外500を固定する。
`findByID` 不在は例外任せにせず `disableErrors: true` で404にする。

- [ ] **Step 2: 競合とmain row保全の統合テストを書く**

実Postgresで次を決定的に再現する。

1. Aが `draft: true` とtoken Aで保存する
2. Bがtoken Bまたは通常保存で新しいdraftを作る
3. Aのtokenで `publishFromAdmin()` を呼ぶ
4. 409 `publish-candidate-replaced` になり、Bを公開せず、公開main rowは元の内容のまま

さらにフェーズ1保存後にserviceを503へstubした場合も、main rowが公開状態・旧内容のまま残ることを検証する。

**token の存在価値を証明する（重要）**: 「A保存 → B保存 → Aが409」だけでは不十分。
token が無くても `assertApprovedVersionIsStillLatest`（`publishApprovedVersion.ts:126,148`）が
同じ409相当を出すため、**このテストは token の価値を一切証明しない**。

固定すべきは「A保存 → B保存 → **Bの内容が公開されない**」で、かつ
**service の token 照合を外すと赤転すること**を実測する。
Task 3 Step 4（Sec-Fetch-Site を外して赤転）や Task 6（importMap key を消して赤転）には
mutation 確認があるのに、中核である token だけ抜けているのは一貫しない。

**成功パスの統合テストも必須**: service が `findVersions` で計算した hash と、
`publishApprovedVersion` が `findVersionByID` で再計算する hash が
**実 Postgres 上で一致すること**を1件確認する。ここがズレると
**全ての公開が409になり、しかも利用者には「別の人が保存しました」と表示される**。

- [ ] **Step 3: テストが未実装で落ちることを確認する**

Run: `npx vitest run tests/content/admin-publish-route.test.ts`

- [ ] **Step 4: serviceを実装する**

処理順を固定する。

1. `findByID({ disableErrors: true, draft: true, depth: 0, overrideAccess: true })` でstableId解決
2. `findVersions({ parent: id, sort: '-createdAt', limit: 1, depth: 0, overrideAccess: true })`
3. 最新versionの `adminPublishIntentToken` とbody tokenを完全一致で検証
4. `computeCanonicalHash(latest.version)`
5. 最新version idを `approvedVersionId` として `publishApprovedVersion()` へ渡す

- [ ] **Step 5: `publish-validation-failed` を構造化する**

**現状は route が正規表現でメッセージを割るしかない。** 実測した throw は9箇所・2書式:

```
lib/payload/access.ts:606     publish-validation-failed: missing ${missing.join(', ')}
collections/*.ts（8 collection） publish-validation-failed: ${slug} missing ${missing.join(', ')}
```

しかも base 検査（`access.ts:606`）と collection 固有検査は**別の throw** なので、
両方欠けている文書では先に落ちた片方しか名指しされない。
文字列 parse のままでは Completion Criteria の「不足項目が名指しで出る」を部分的にしか満たせない。

`lib/payload/access.ts` へ次を足す。

```ts
export class PublishValidationError extends Error {
  constructor(readonly fields: string[], scope?: string) {
    super(`publish-validation-failed: ${scope ? `${scope} ` : ''}missing ${fields.join(', ')}`);
    this.name = 'PublishValidationError';
  }
}
```

**message は現行と1文字も変えない。** 既存テスト（`publish-gates.test.ts` の
`/publish-validation-failed/` 等）はそのまま通る。9箇所の `throw new Error(...)` を
`throw new PublishValidationError(missing, slug)` へ置き換えるだけで、
gate の**判定ロジックは一切変えない**。Global Constraints の「publish gate を変更しない」は
判定を変えないことを指しており、これに反しない。

route は `err instanceof PublishValidationError` で `err.fields` を直接使う。

- [ ] **Step 6: routeを実装する**

request body上限: `Content-Length` があれば読込前に早期拒否し、
無い場合（`Content-Length` は任意 header）は実読込で 8 KiB を超えた時点で打ち切る。
collectionは7値allowlist、tokenはUUID形式、idは非空stringまたはnumberだけを許可する。
レスポンスは次の形に統一する。

```ts
type AdminPublishErrorResponse = {
  ok: false
  error: string
  fields?: string[]
}
```

表示言語はrouteに持ち込まない。

| 条件 | HTTP | 内容 |
|---|---|---|
| `ValidationError` | 422 | `validation-failed` + Payloadのfield path配列 |
| `PublishValidationError` | 422 | `publish-validation-failed` + `err.fields`（Step 5 で構造化済み。文字列 parse をしない） |
| `publish-candidate-replaced` / `publish-stale-approval` / `publish-hash-mismatch` | 409 | 元のerror code |
| `publish-role-required` / `archive-role-required` | 403 | 元のerror code |
| `publish-not-found` / document・version不在 | 404 | `publish-not-found` |
| `publish-lock-unavailable` / `publish-transaction-unavailable` | 503 | `publish-temporarily-unavailable` |
| `publish-approval-required` / 未知例外 | 500 | `publish-internal-error`。詳細はlogだけ |

- [ ] **Step 7: route/serviceテストと境界checkを緑にする**

Run: `npx vitest run tests/content/admin-publish-route.test.ts && npm run check:publish-authorization-boundaries`

Expected: PASS。route/serviceは承認contextを直接importしない。revalidationは既存serviceに任せる。

---

### Task 5: PublishButtonの状態機械とi18nを実装する

**Files:** `components/admin/PublishFromApproval.tsx`,
`tests/components/publish-from-approval.test.tsx`, `payload.config.ts`

**Interfaces:**
- Consumes: Task 1のfield名、Task 4の `POST /api/admin/publish`
- Produces: `PublishFromApproval(): ReactNode`

- [ ] **Step 1: hookをmockした失敗テストを書く**

**ファイル先頭に `// @vitest-environment jsdom` を書く。** `vitest.config.ts` は
`environment: 'node'` 固定で、DOM が要るテストは docblock で opt-in する規約
（既存 `tests/components/*.test.tsx` 5本がすべてそう）。無いと最初から動かない。

`@payloadcms/ui` hooks、`fetch`、`crypto.randomUUID` をmockし、次を固定する。

- create operation / id無し / draft-writer / readerではbuttonが無い
- unchanged published document、upload中、form processing中はdisabled
- 二重clickでもsubmit/fetchは各1回
- submitへ `draft=true` action、PATCH、`skipValidation: true`、`disableSuccessStatus: true`、tokenを渡す
- `submit()` がundefined、`res.ok=false`、throwの各場合にfetchを呼ばない
- save成功時だけ同じtokenをbodyへ入れてfetchする
- 409、422、503、network errorを別の翻訳keyへ写像する
- publish成功後にstate setters、`incrementVersionCount()`、`router.refresh()`を呼ぶ

- [ ] **Step 2: テストが未実装で落ちることを確認する**

Run: `npx vitest run tests/components/publish-from-approval.test.tsx`

- [ ] **Step 3: Payload標準と同じ表示・無効条件を実装する**

`useOperation()` はupdateのみ、`useFormModified()`、`unpublishedVersionCount`、`hasPublishedDoc`、
`uploadStatus`、`useFormProcessing()` を使う。roleは `useAuth().user.role` でpublisher以上を要求する。
buttonは標準と同じ `FormSubmit`、`buttonId="action-publish"`、`type="button"` を使う。

- [ ] **Step 4: `draft=true` 保存と成功判定を実装する**

`formatAdminURL` と `qs.stringify` を使い、D-1のactionを標準実装と同じ方法で組み立てる。

```ts
const saved = await submit({
  action,
  method: 'PATCH',
  overrides,
  skipValidation: true,
  disableSuccessStatus: true,
})
if (!saved?.res.ok) return
```

この条件を通過した場合だけrouteを呼ぶ。route成功前に公開成功toastやstate同期を行わない。

- [ ] **Step 5: 成功時の状態同期を実装する**

フェーズ1のversion countはPayloadの `onSave` が増やす。フェーズ2でも公開versionが1件増えるため、
route成功後に `incrementVersionCount()` を1回呼ぶ。併せて `setHasPublishedDoc(true)`、
`setUnpublishedVersionCount(0)`、`setMostRecentVersionIsAutosaved(false)`、`router.refresh()` を行う。

- [ ] **Step 6: client側i18nを実装する**

`payload.config.ts` の `i18n.translations` に `{ ja: { custom: {...} }, en: {...} }`。
routeの `error` と `fields` をclientで翻訳する。7 collectionの公開validatorが返し得るfield keyを
ja/en両方へ定義し、未知fieldは生のkeyではなく共通の「入力内容を確認」へfallbackする。
`lib/uiText.ts` には入れない。

- [ ] **Step 7: componentテストを緑にする**

Run: `npx vitest run tests/components/publish-from-approval.test.tsx`

Expected: PASS。

---

### Task 6: 7 collectionへUIを配線しimportMapを機械検査する

**Files:** 7つの `collections/*.ts`, `src/app/(payload)/admin/importMap.js`,
`scripts/check-admin-import-map.mjs`, `scripts/check-admin-import-map.d.mts`,
`tests/content/admin-import-map.test.ts`, `package.json`, `package-lock.json`, `knip.json`

**Interfaces:**
- Consumes: Task 5の `PublishFromApproval`
- Produces: 7 collection全てのcustom PublishButton importMap entry

- [ ] **Step 1: importMap欠落で落ちるテストを書く**

checkerは対象7ファイルを固定allowlistとして読み、各configの
`admin.components.edit.PublishButton` 指定子が正確に1件あり、全て
`@/components/admin/PublishFromApproval#PublishFromApproval` であり、importMapに同じkeyがあることを検査する。
コメント中の文字列だけでは通らないよう、config blockとimportMap objectの実コードを対象にする。

- [ ] **Step 2: 7 collectionへ指定子を追加する**

`admin.components.edit.PublishButton` に
`@/components/admin/PublishFromApproval#PublishFromApproval` を指定する。既存のadmin設定を上書きしない。

- [ ] **Step 3: importMapを再生成する**

Run: `npx payload generate:importmap`

既知のworker-thread loader競合で動かない場合だけ手書き追記し、生成utilityがエイリアス指定子を
そのままkeyへ使う形式に合わせる。既存2entryを削除しない。

- [ ] **Step 4: checkerと型宣言を実装する**

キーが無い場合のsilent fallbackを防ぐ。構成は
`scripts/check-publish-authorization-boundaries.mjs` に倣い、純粋関数export、`.d.mts`、単体testを揃える。

- [ ] **Step 5: knipとcheckへ配線する**

**`entry` に足すだけでは効かない可能性がある。** `knip.json` の `project` は
`["components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}", "src/**/*.{ts,tsx}", "scripts/**/*.mjs"]` で
**`.js` を含まない**（実測確認済み）。`importMap.js` を `entry` へ入れても project 外なら
参照辺が辿られず「足したのに `PublishFromApproval.tsx` が unused のまま」になり得る。

`entry` と `project` の両方へ足し、**実際に `npm run check:dead-code` を走らせて
component が unused に出ないことを確認する**。既存の
`ignore: ["src/app/(payload)/admin/importMap.d.ts"]` との整合も見ること。

`package.json` の `check:admin-import-map` を `check` のboundary群へ追加する。
`knip.json` のentryへ `src/app/(payload)/admin/importMap.js` を追加し、componentをignoreしない。

- [ ] **Step 6: dependency lockfileを更新する**

Run: `npm install @payloadcms/ui@^3.87.1`

Expected: `package.json` と `package-lock.json` が同時に更新され、他の `@payloadcms/*` とversionが揃う。

- [ ] **Step 7: checkerの赤転と緑を確認する**

Run: `npm run check:admin-import-map`

Expected: PASS。その後importMap keyを一時的に削除してFAILを確認し、元へ戻して再度PASS。

---

### Task 7: Admin公開E2Eをrequired CIへ追加する

**Files:** `tests/e2e/payload-admin-publish.spec.ts`, `tests/e2e/seedAdminPublishE2E.mts`,
`.github/workflows/content-e2e.yml`

**Interfaces:**
- Consumes: Task 1〜6の完成したAdmin公開経路
- Produces: throwaway DB上の実browser release gate

- [ ] **Step 1: fixture投入scriptを書く**

固定のCI専用email/passwordで `content-publisher` と `content-draft-writer` を冪等作成する。
`DATABASE_URL` に `test` を含むthrowaway判定を必須にし、本番/Preview DBでは即時拒否する。
認証情報は外部secretにせずworkflow内のダミー値をenvで渡す。

**既存 seed との順序と責務**（実測して確定）: `scripts/seed-ci-site-settings.mts:45` は
`if (existingAdmins.length === 0)` のときだけ platform-admin を作り、パスワードは
`ci-${crypto.randomUUID()}-Disposable!`（`:46`）なので **admin UI からログインできない**。

したがって本 script は **既存 seed の後**に実行する。先に走らせると既存 seed の
admin 作成分岐がスキップされる。robot fixture 自体は既存 seed の `restoreContentSnapshot` が
入れるので、**本 script の責務は admins 2件だけ**（既知パスワード）。

- [ ] **Step 2: 専用specを書く**

`tests/e2e/payload-admin-publish.spec.ts` を新規作成し、`test.describe.configure({ mode: 'serial' })` を指定する。
既存 `payload-admin.spec.ts` へ混在させない。

**専用の fixture 文書を使い、`unitree-g1` を触らない。** `content-e2e.yml` のコメントが
明記しているとおり、既存2 spec（`cache-revalidation` / `draft-mode-wiring`）は同じ robot を
書き換えるため `--workers=1` にしてある。同じ文書を publish すると `--workers=1` でも
ファイルの実行順で既存2 spec の期待状態を壊す。最低限、次を実browserで検証する。

1. publisherでlogin → fixture robot編集 → Publish → 成功表示 → 公開ページのH1へ反映
2. create画面にはPublishが無く、Save Draft後のedit画面には表示される
3. draft-writerにはPublishが表示されない
4. 必須fieldを空にすると422のfield案内が表示され、公開ページは旧内容のまま

- [ ] **Step 3: 既存content-e2e workflowへ直列追加する**

fixture投入をbuild前に実行する。既存Playwright stepへ新specを追加し、共有fixture DB上の競合を避けるため
引き続き `--workers=1` とする。step名・失敗artifact・最終failure gateにもAdmin publishを含むことを明記する。

```bash
npx playwright test \
  tests/e2e/cache-revalidation.spec.ts \
  tests/e2e/draft-mode-wiring.spec.ts \
  tests/e2e/payload-admin-publish.spec.ts \
  --workers=1
```

- [ ] **Step 4: ローカルthrowaway DBでE2Eを実行する**

Run: `npx playwright test tests/e2e/payload-admin-publish.spec.ts --workers=1`

Expected: 全case PASS、skip 0、flaky 0。

---

### Task 8: 全ゲート・文書・実機確認を完了する

**Files:** `docs/README.md`, `docs/plans/admin-publish-ui-plan-v1.md`

- [ ] **Step 2: focused testsを実行する**

Run:

```bash
npx vitest run \
  tests/content/admin-publish-intent.test.ts \
  tests/content/publish-request-auth.test.ts \
  tests/content/admin-publish-route.test.ts \
  tests/content/admin-import-map.test.ts \
  tests/components/publish-from-approval.test.tsx
```

Expected: PASS。

- [ ] **Step 3: repository gateを実行する**

Run: `npm run check`

Expected: exit 0。`check:admin-import-map` と上記Vitest群が実際に含まれることをlogで確認する。

- [ ] **Step 4: 手動確認する**

- publisher: 編集 → Publish → **編集内容が公開される**
- Aのdraft保存直後に別タブBで先に保存 → Aは409案内、Bの内容も公開されない
- 必須項目を空にして Publish → **不足項目が名指しで出る**
- draft-writer: ボタンが出ない
- create画面: Publishが出ず、Save Draft後のedit画面で出る
- upload/form processing中と未変更の公開済みdocument: disabled
- 公開後 "Changed" 表示が消える
- モバイル幅で崩れない / キーボードで操作できる

- [ ] **Step 5: diffと文書の自己監査を行う**

Run: `git diff --check && npm run check:docs && git status --short`

Expected: whitespace/link errorなし。新規・変更ファイルがFile Structureと一致する。

---

## スコープの線引き（正直に）

**この作業で「実運用の唯一のブロッカーが消える」とは言えない。**

| 対象 | 状態 |
|---|---|
| 7つの content collection | ✅ 今回の対象 |
| `site-settings` | ✅ **既に公開できる**。`createGlobalPublishGateHook`（`access.ts:570-571`）は `canPublish` なら即 `return data` で承認contextを要求しない |
| `media` | — `versions` 未設定なので publish の概念が無い |
| **`article-placements`** | ❌ **publish 経路自体が無い**。`ApprovableCollectionSlug` 外で、`content:import` の `privilegedPublishContext` のみ。**記事を公開してもホーム/一覧に載せられない**。別タスク |
| 一覧の一括 Publish | ❌ `PublishMany` は `DocumentControls` と独立。**500 のまま残る**（隠す公式スロットが無い） |

---

## Rollback

**本計画は DB schema を変更する**（Task 2 の `adminPublishIntentToken` 列）。
「コードを戻せば元に戻る」は成立しないので、戻す範囲によって手順が変わる。

| 戻す範囲 | 手順 | 備考 |
|---|---|---|
| UIだけ（最小・最速） | 7 collection から `admin.components.edit.PublishButton` を削除 | 標準ボタン＝現状の壊れた状態へ戻る。DB・routeはそのまま残る |
| UI + route | 上記 + route/service を revert | 列は残るが誰も書き込まないので無害 |
| 全部（列も） | 上記 + `npm run payload:migrate:down` | **最後に行う**。列を落とす前にUI/routeが確実に止まっていること |

**列を残す判断が既定**。`adminPublishIntentToken` は常に `null` になるだけで、
mapper が明示的に列挙する方式（下記）のため公開サイト・snapshot・parity には一切現れない。
急いで `migrate:down` する理由は無く、本番でのDDLは避けるほうが安全。

`migrate:down` を実行する場合は、`docs/reference/database-migration-runbook-v1.md` に従い、
Preview で往復を確認してから本番へ適用する。

---

## リスク

| リスク | 軽減策 |
|---|---|
| **tokenがsnapshot/parity/公開サイトへ漏れる** | mapper（`mapPayloadRobotToDomain` 等）は**field を明示列挙**する方式なので、Payload に列を足しても domain へ自動的に入らない。加えて snapshot schema が未知fieldを `unknown field is not allowed` で拒否する（`scripts/snapshotSchema.mts:153`、必須修正6-5）。**mapper と `domainTypes.ts` を触らないこと**が条件。Task 1 Step 5 で明示的に検証する |
| **`SYSTEM_FIELDS` 変更の波及** | `computeCanonicalHash` の利用者は `publishApprovedVersion.ts` 内の2箇所（`:137`, `:195`）とテストのみで、外部消費者は無いことを確認済み。export/restore 系は別系統の hash を使う |
| **DB schema 変更を伴う**（8 collection + version tables = 16列） | migration をコミットし CI の schema drift check（`ci.yml`）で検証。Rollback節のとおり列は残す判断を既定にする |
| tokenのhookが正常なSave Draftを壊す | Task 1 でhookの単体テスト。「tokenを持たない保存は `null` になる」「別tokenで上書きされる」を固定 |
| **MCP に token field が露出する** | `lib/payload/mcp.ts:27-35` の `MCP_EDITABLE_COLLECTIONS` はまさにこの7 collection で、tool schema は collection の fields から生成される（`:113`）。`admin.hidden` は MCP/REST を隠さない。**権限昇格にはならない**（route が publisher を要求し、MCP から publish はできない）が、Codex が意味の分からない field を見ることになる。description で運用メタデータと明記する |
| **version が公開1回につき2件増える** | `createVersionRetentionGuardBeforeChangeHook`（`access.ts:636-658`）は現状 pruning 無効で素通りだが、**有効化した瞬間に `maxPerDoc` 到達が倍速になり**、`audit-archive-not-configured` で書き込みごと block される。version archive を構築する際はこの計画を前提に上限を再計算する |
| `/admin` の client budget | `scripts/check-client-budgets.mjs` の `/admin/[[...segments]]` は 1,990,000（実測 1,729,098 の +15%）。余裕はあるが、Task 8 で `npm run check` が落ちたとき原因を切り分けられるよう Task 6 完了時に一度 `npm run check:client-budgets` を単独実行する |
| importMap キー欠落が silent fallback | **Task 6** の機械検出（`check:admin-import-map`）。赤転を確認する |
| `generate:importmap` が既知バグで動かない | 手書きで代替。形式が既存2件（npm指定子）と異なる点に注意 |
| 未保存編集の消失 | `draft=true` + PATCH + `skipValidation` の2段構え（D-1）。手動確認で明示的に見る |
| 別利用者の版を誤公開 | token照合 + `assertApprovedVersionIsStillLatest` の2層（D-1）。Task 4 Step 2 の競合統合テストで固定 |
| CSRF | POST限定 + `Sec-Fetch-Site` + Origin/Host 一致。単体テストで固定 |
| 既存 publish gate の破壊 | gate は触らない。`tests/content/publish-gates.test.ts`（782行）が回帰検出 |
| 本番HTTPSで cookie に `Secure` が付かない | 本計画の範囲外。別タスクとして起票（D-3） |

---

## Completion Criteria

- [ ] `content-publisher` が admin の Publish ボタンから公開でき、**編集内容が反映される**
- [ ] **A の保存後・route が版を選ぶ前に B が保存した場合、A の公開は409で止まり、
      B の内容も公開されない**（統合テストで固定）
- [ ] **フェーズ①が失敗した場合、公開routeが一度も呼ばれない**（componentテストで固定）
- [ ] **フェーズ③以降が失敗しても、公開済み main row が変化しない**（統合テストで固定）
- [ ] 公開失敗時、原因が利用者に分かる形で表示される（特に必須項目の不足＝`ValidationError`）
- [ ] `content-draft-writer` にはボタンが出ない。create画面にも出ない
- [ ] 承認contextの発行元が `publishApprovedVersion.ts` のままである
  （`check:publish-authorization-boundaries` が緑）
- [ ] importMap の欠落が機械検出される（`check:admin-import-map` が緑、かつ赤転を確認済み）
- [ ] **`adminPublishIntentToken` が snapshot・parity・公開ページに現れない**
      （mapper 未変更の確認 + `content:export` の往復）
- [ ] `npm run check` が exit 0
- [ ] 公開後に revalidation が動作し、公開ページへ反映される

## 実装しないこと

承認フローの新設（二者承認）/ `article-placements` の publish 経路 / 一括公開UI /
公開予約 / `csrf` の全体適用 / `Admins` の cookie `secure` 修正
