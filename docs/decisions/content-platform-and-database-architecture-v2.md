---
status: current
updated: 2026-08-09
---

# コンテンツ基盤・DBアーキテクチャ v2

## 0. 決定

Deploid のコンテンツ基盤は、現在の `data/*.ts` を正本とする Git ベース運用から、次の構成へ段階移行する。

- **CMS**: Payload CMS
- **データベース**: マネージド Postgres
- **初期DB候補**: Supabase Postgres
- **画像・バイナリ**: Vercel Blob または S3 互換オブジェクトストレージ。公開Mediaと
  非公開の監査・バックアップはstoreを分離し、PreviewとProductionでも資格情報を共有しない
- **公開アプリ**: 現行 Next.js App Router
- **開発・変更管理**: GitHub
- **AI操作**: Payload MCP / Payload API を経由した Codex

移行後は、コンテンツレコードの唯一の正本を Postgres とする。GitHub はコード、CMSスキーマ、DBマイグレーション、検証、移行スクリプトの正本として残す。

この決定は以下の旧判断を置き換える。

- `data-architecture-redesign-v1.md` の Git型CMS（Keystatic/TinaCMS）を保存先とする判断
- `humanoid_platform_tech_stack_v1.md` の Sanity / microCMS を第一候補とする判断
- `architecture_future_considerations_v1.md` の「CMS/DB移行は将来条件を満たしてから検討する」という判断

旧文書の id/slug 分離、参照ID、出典、権利、公開状態、検証に関するデータモデル判断は引き続き有効である。
ただし移行時のURL契約は本書 §10 を優先する。①の保存先変更は `slug` / `previousSlugs` / 公開URLを
維持し、waiverは②で明示したSeries cutover等の承認済み変換だけに限定する。

---

## 1. なぜ現在のGit運用を変えるか

現在は GitHub 上の TypeScript 配列が簡易DBとして機能している。

```text
data/*.ts
  ↓ import
lib/data.ts
  ↓
Next.js build / render
```

この方式には、次の利点がある。

- Codexが通常のファイル編集として扱える
- 変更差分と履歴がGitに残る
- 型検査と独自validateを実行できる
- 外部サービスなしで公開できる

一方で、現在の規模では次の欠点が顕在化している。

- `data/robots.ts` などの巨大配列を人間が安全に編集しづらい
- 非エンジニア向けの入力画面、下書き、承認、権限管理がない
- 1件の更新でもコード変更、build、deployが必要
- 参照先の選択、公開状態、画像権利などをフォームで制約できない
- 全件をアプリへimportする構造が、サーバー・クライアント境界を曖昧にする
- 将来のユーザー状態、問い合わせ、組織データと接続しづらい

したがって、Gitを捨てるのではなく、Gitの役割を「データ本体」から「データ構造と変更手順」へ戻す。

---

## 2. 最終構成

```text
GitHub
├─ Next.jsコード
├─ payload.config.ts / collection definitions
├─ DBマイグレーション
├─ domain validation
├─ import / export / parity scripts
└─ AI作業ルール
          │ deploy
          ▼
Next.js + Payload CMS
├─ 公開サイト
├─ /admin             非エンジニア向け編集
├─ Payload Local API  公開サイトのサーバー読み取り
├─ REST / GraphQL     外部連携
└─ MCP                Codex向け読み書き
          │
          ▼
Managed Postgres
├─ manufacturers
├─ distributors
├─ robot_series
├─ robots
├─ use_cases
├─ deployments
├─ articles
├─ article_placements
├─ site_settings
├─ users / editors / versions
└─ 将来の app_* テーブル

Object Storage
├─ Production public media store
├─ Production private audit / backup store
├─ Preview public media store
├─ Preview private audit / backup store
└─ CI / test fake or local store
```

### 2.1. 単一の正本

| 対象 | 正本 | 補足 |
|---|---|---|
| コンテンツレコード | Postgres（Payload経由） | Gitへ同じレコードを二重保存しない |
| 公開URLのslug | Postgres | `id` は不変、slugは変更可能 |
| CMSスキーマ | GitHub | Payload collection config |
| DBマイグレーション | GitHub | review後に適用 |
| タグ・状態の意味 | 原則GitHub | プログラム分岐に使うenumはコード管理 |
| 編集者が追加する分類 | Postgres | UIから増やす必要がある分類のみcollection化 |
| 画像メタデータ・権利 | Postgres | バイナリ本体はobject storage |
| cutover snapshot・DB変更before-image | private object storage | Gitには署名・hash・object key・件数の要約だけを置く |
| import用raw/正規化成果物 | private archiveまたはアクセス制限されたGit archive | Postgres移行後の運用SoTにはせず、provenance・入力hash・保持期限を付ける |
| UI token・コンポーネント文言 | GitHub | 編集コンテンツとは分離 |
| 調査raw成果物 | GitHub | `docs/decisions/data/research/` を継続 |
| 将来のユーザー状態 | Postgres | CMSコンテンツとはテーブル責務を分ける |

---

## 3. Payloadを採用する理由

### 3.1. 現行技術との一致

Payload は Next.js App Router と TypeScript を前提に組み込める。現行アプリと管理画面・APIを同じリポジトリで管理でき、既存の型、検証、Vercel運用を活用しやすい。

### 3.2. Postgresを正本にできる

robots、manufacturers、useCases、deployments、articles は相互参照が多い。Postgresを使うことで、参照整合性、マイグレーション、将来の集計・検索・ユーザー状態との接続を一つの基盤で扱える。

### 3.3. 非エンジニアとCodexが同じデータを扱える

- 非エンジニアは Payload Admin を使う
- Codex は Payload MCP またはAPIを使う
- 公開サイトは Payload Local APIを使う

入口は異なるが、更新対象は同じPostgresである。

### 3.4. 権限を細かく制御できる

Codex用の通常権限では、検索・作成・下書き更新だけを許可する。削除、公開、スキーマ変更、ユーザー管理は別権限に分ける。

---

## 4. 採用しない構成

### 4.1. Git型CMSを最終形にしない

TinaCMS / Keystatic は現在のCodex運用との相性がよい。しかし、更新のたびにGit commitとdeployが必要で、Postgresへの将来移行をもう一度行うことになるため、最終形にはしない。

### 4.2. Sanityを主CMSにしない

Sanityは管理画面・MCP・構造化コンテンツに優れるが、将来のアプリ状態をPostgresへ置くと、SanityとPostgresの二つが恒久的な運用対象になる。Deploidでは、ある程度の初期移行コストを許容し、Payload + Postgresへ統一する。

### 4.3. Supabase Table EditorをCMSにしない

SupabaseはDB基盤として使うが、Table Editorをコンテンツ編集UIとして使わない。入力支援、下書き、権利表示、関連選択、公開承認はPayloadが担う。

### 4.4. Codexに本番SQLを直接実行させない

コンテンツ更新はPayloadのAccess Control、Hooks、Validationを通す。CodexがPostgresへ直接 `INSERT` / `UPDATE` すると、これらを迂回するため禁止する。

---

## 5. コレクション境界

### 5.1. CMS管理対象

| Collection / Global | 主な内容 |
|---|---|
| `manufacturers` | メーカー、供給体制、国内窓口、ロゴ |
| `distributors` | 国内提供事業者。メーカー・取扱機種との多対多関係 |
| `robot-series` | 製品ファミリ。スペック・価格を持たず、買える構成は`robots`が保持 |
| `robots` | 機体、スペック、価格、荷重、画像、比較材料 |
| `use-cases` | 用途、必要能力、候補機体、evidence |
| `deployments` | 実在導入事例、顧客、場所、関連用途 |
| `articles` | ニュース・解説・メーカーガイド |
| `article-placements` | reports/homeの掲載枠 |
| `media` | 画像、ロゴ、権利情報、出典 |
| `site-settings` | `dataAsOf` など、コレクションに属さない編集対象の運用設定 |
| `admins` | 管理画面ユーザー、§7.3の正式role enum |

`robots`と`robot-series`が共有する`/robots/:slug`は、Git管理migrationで作る
`content_route_registry(namespace, slug, owner_collection, owner_stable_id)`を正本にし、
`UNIQUE(namespace, slug)`で一意性を保証する。両collectionのcreate / slug変更 / delete hookは
同じDB transaction内でclaim / move / releaseし、collection横断の事前検索だけに依存しない。

Payload Draftsの`_status`は`draft|published`だけなので、domainの`draft|published|archived`は
`_status`と`lifecycleStatus: active|archived`の組で表す。archivedは`published + archived`として
旧URLの詳細表示を許し、一覧・検索からrepositoryが除外する。custom `publishStatus` fieldは作らない。

### 5.2. Git管理を継続するもの

- `PublishStatus` などアプリ制御に使うenum
- `specSchema`
- semantic token
- UI component copy
- ルーティング
- domain validation
- AI作業ルール

編集者が新しいスペックキーや公開状態を自由追加できる構成にはしない。アプリ挙動を変える変更はGitレビューを必須とする。

### 5.3. 将来のアプリデータ

次のデータは同じマネージドPostgresに追加できるが、CMS collectionと責務を分ける。

- `app_users`
- `app_favorites`
- `app_inquiries`
- `app_organizations`
- `app_saved_comparisons`

Payload Adminの編集者アカウントと、公開サービスのエンドユーザーアカウントを同じロール体系に混ぜない。

---

## 6. 読み取りアーキテクチャ

ページはPayloadやPostgresを直接参照せず、データアクセス境界を経由する。

```text
src/app/**
  ↓
lib/content/getContentRepository()
  ↓
ContentRepository
  ├─ local source   移行期間のみ
  └─ payload source 移行後の正本
```

`lib/data.ts` が持つ公開状態フィルタ、slug解決、関連解決、表示順の責務は、移行時に `lib/content/` 配下へ分割する。

- 物理読み取り: content source
- 公開状態・関連解決: repository
- 表示用変換: view-model helper
- domain validation: validation modules

公開runtimeでは、一覧・詳細・関連取得ごとのqueryをPayload/Postgresへ送り、毎requestで全collectionをsnapshot読込しない。全件snapshotはimport、parity、export、横断validationの管理処理だけで使用する。

Client Componentへは、レコード全体ではなく画面に必要なview modelだけを渡す。

---

## 7. 書き込み・公開ワークフロー

### 7.1. 非エンジニア

1. `/admin`へログイン
2. 既存レコードを編集またはdraftを作成
3. フィールド検証と関連参照を確認
4. previewで公開表示を確認
5. `content-draft-writer` がレビュー依頼
6. `content-publisher` または `platform-admin` が公開

### 7.2. Codex

1. MCPでschemaを読む
2. 更新対象と参照先を検索する
3. draftを作成・更新する
4. domain validationを実行する
5. 変更要約と検証結果を提示する
6. 人間がAdminで確認して公開する

### 7.3. 権限

正式なrole enumは次の4値だけとする。

```ts
type ContentRole =
  | 'content-reader'
  | 'content-draft-writer'
  | 'content-publisher'
  | 'platform-admin';
```

旧文書・UI文言の `editor` / `publisher` / `admin` はそれぞれ
`content-draft-writer` / `content-publisher` / `platform-admin` の表示上の旧称であり、DB値・API入力・
MCP API keyには保存しない。

| Profile | 許可 | 禁止 |
|---|---|---|
| `content-reader` | find/read | create/update/delete/publish |
| `content-draft-writer` | find/create/update draft | delete/publish/schema/admin |
| `content-publisher` | find/create/update draft、publish、unpublish | delete/schema/admin |
| `platform-admin` | 全CMS操作 | 本番SQL直接操作は通常運用で使わない |

通常のCodexセッションは `content-draft-writer` を使用する。
Admin UI、Local API、REST、MCPのどの入口でも同じcollection accessと`beforeChange`を通す。
特に `content-draft-writer` が `_status: 'published'` を送る操作は、update権限があってもhookで拒否する。
Local APIは原則 `overrideAccess: false` と認証済み`user`を指定する。

Draft Modeは、Payloadへログイン済みの上記role、または短寿命・単回使用・署名付きtokenでのみ有効化する。
tokenは期限、nonce、改ざんを検証し、redirectは同一originのallowlistに制限する。draftの取得側でも
閲覧権限を再検査し、Draft Mode cookieだけを認可根拠にしない。

---

## 8. 検証の多層化

現行の独自validateで守っているドメインルールは捨てない。

| 層 | 責務 |
|---|---|
| TypeScript / Payload field config | 型、必須、基本フォーマット |
| Payload collection hooks | 単一レコード内の制約 |
| Domain validators | collection横断の参照、evidence、公開ゲート |
| DB制約 | 一意性、外部キー、null、index |
| CI | migration、import parity、build、主要E2E |

`lib/validate.ts` は、collection別validationとcross-collection validationへ分割する。管理画面、Codex、CIが同じdomain validatorを呼べる形にする。

---

## 9. キャッシュと再検証

- 公開ページはServer Componentで読み取る
- 公開データをtag付きでcacheする
- Payloadの公開操作後に該当tagをrevalidateする
- draft previewはcacheしない
- フィルタが全件クライアント処理で十分な間は、公開済みview modelを小さく渡す
- 件数増加後はPayload/Postgres側で検索・ページングする

検索文字列ごとの無制限cache entryは作らない。
各view modelが読むcollection集合をGit上のdependency tableで管理し、publish hookの無効化先と
同じ表から導出する。主collectionだけでなく、Robot詳細が読むUseCase、Manufacturer詳細が読む
Article / UseCaseなどの逆方向依存も含め、統合テストで表と実装の差分を検出する。

---

## 10. 移行原則

1. `id`は変更しない。RobotをRobotSeriesへ型移行する場合も同じstableIdを移管先が継承し、
   新IDへの対応付けで代替しない
2. ①の保存先移行では `slug` / `previousSlugs` / 公開URLを変更せずparity対象にする。②のSeries
   cutover等、計画内で旧URL・新URL・301または同一URL継承を列挙し、人間が承認した変換だけを
   URL waiverとして許す。包括的な「URL維持不要」というwaiverは認めない
3. 旧TSとDBを恒久的に二重更新しない
4. 移行期間はlocal/payloadを切り替えられるが、書き込み元は常に一方だけにする
5. importerは再実行可能にする
6. 件数、ID、参照、公開状態、主要フィールドを自動比較する
7. parityが取れてからPostgresを正本へ切り替える
8. 切替後は `data/*.ts` を削除し、rollback用exportは一時artifactとして保管する
9. schema変更はmigrationをGitレビューしてから適用する
10. 本番データ変更は監査履歴を残す
11. `_environment_marker` を含む全DB schemaはGit管理migrationで作り、手動DDLを正本にしない
12. public mediaとprivate audit/backupはstoreを分け、Preview資格情報からProduction storeへ
    read/write/delete/restoreできないことを機械検証する
13. transactional outboxのbefore-imageは署名鍵と別のKMS keyでenvelope encryptionし、暗号文・nonce・
    auth tag・encrypted data key・key versionだけをDBへ置く。rotation後も保持期間内の旧artifactを復号する

実装手順は `../plans/content-platform-migration-plan-v1.md` を正本とする。

---

## 11. 未確定事項

次の項目は実装開始時に、無料枠・既存Vercel契約・必要な権限を確認して確定する。アーキテクチャ判断そのものは変えない。

- Postgres提供者の最終選択（初期値はSupabase）
- object storage提供者（初期値はVercel Blob）
- Production / Previewごとのpublic media store・private audit/backup storeの契約、費用、責任者
- Payload Cloudを利用するか、現行Vercelへ同居させるか
- preview URLと承認ロールの詳細
- 将来の公開ユーザー認証方式

---

## 12. 参照

- [Payload: existing Next.js appへの導入](https://payloadcms.com/docs/getting-started/installation)
- [Payload: Postgres adapter](https://payloadcms.com/docs/database/postgres)
- [Payload: MCP plugin](https://payloadcms.com/docs/plugins/mcp)
- [Supabase: Postgres database](https://supabase.com/docs/guides/database/overview)
- [Codex: MCP](https://learn.chatgpt.com/docs/extend/mcp)
