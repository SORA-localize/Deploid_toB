---
status: current
updated: 2026-07-26
---

# アーキテクチャ将来対応リスト

このサイトの現在の設計判断と、将来対応が必要になる可能性のある事象を記録する。
判断を変える前にここを参照し、変えた場合は内容を更新する。

---

## 現在の設計判断

### コンテンツ基盤：Payload CMS + managed PostgreSQL へ段階移行

現行の `data/*.ts` は移行完了まで有効な正本とする。移行後は Payload CMS をコンテンツの書込み窓口、managed PostgreSQL を永続化先、GitHub をコード・schema・migrationの正本とする。

- 判断: [`content-platform-and-database-architecture-v2.md`](content-platform-and-database-architecture-v2.md)
- 実装計画: [`../plans/content-platform-migration-plan-v1.md`](../plans/content-platform-migration-plan-v1.md)
- ページからの取得はサーバー専用repository境界に集約し、直接SQLやCMS SDK呼出しを分散させない
- Codexは制限付きMCPから原則draftを作成し、人間がレビュー・公開する

### ページヘッダーの実装方式：B（共通コンポーネント）を採用

ページ固有の sticky ヘッダー（breadcrumbs + タブ相当の要素）は、
`layout.tsx` の追加ではなく、`XXXHeader` コンポーネントとして抽出する方式をとる。

**理由:**
- 全ページが公開・静的・認証なし
- sticky ヘッダーは URL パラメータを読む必要があり `'use client'` が必要 → `layout.tsx` に直接書けない
- 変更範囲が小さく、既存の Browser コンポーネントとの相性がよい

---

## 将来対応リスト

以下の事象が起きたとき、対応方式の見直しを検討する。

### 1. セクション別 `layout.tsx` 追加を検討するタイミング

| 事象 | 対応候補 |
|---|---|
| 特定セクション（例: `/reports/*`）に認証・権限チェックが必要になった | `app/reports/layout.tsx` でアクセスガードを実装 |
| セクション共通データをサーバーで prefetch したくなった | `layout.tsx` を `async` にして `fetch` を置く |
| セクション間のページ遷移でヘッダーがチラつく問題が出た | `layout.tsx` にするとネスト内遷移で再マウントされない |
| セクション固有の OGP / メタデータを一元管理したくなった | `layout.tsx` に `generateMetadata` をまとめる |

**移行コスト:** 低い。`XXXHeader` を `layout.tsx` + 子コンポーネントに分解するだけで、Browser コンポーネント本体はほぼ触らずに済む。

---

### 2. 状態管理の見直しを検討するタイミング

現在、フィルタ・タブ・検索クエリはすべて URL パラメータ（`useUrlParamUpdater`）で管理している。

| 事象 | 対応候補 |
|---|---|
| URL に乗せたくない一時状態（モーダル開閉など）が増えた | Zustand / Jotai などの軽量ストア |
| 複数コンポーネントで同じ状態を共有する必要が出た | React Context または外部ストア |
| SSR 時に初期フィルタ状態をサーバーで解決したくなった | `searchParams` をサーバーコンポーネントで受け取る構成に変更 |

---

### 3. データ層の見直しを検討するタイミング

現在、データは `data/*.ts` の静的配列 + `lib/data.ts` 経由で参照している。件数だけでなく、非エンジニア編集、公開ワークフロー、クライアントバンドル、将来のアプリデータを考慮し、Payload CMS + managed PostgreSQLへの移行を決定済み。

| 事象 | 対応候補 |
|---|---|
| 移行期間中にローカルデータとCMSの差異が出た | parity検証を失敗させ、collection単位でローカル読取へ戻す |
| DBクエリやPayload SDK呼出しがページへ散らばり始めた | `lib/content/repositories/*` に集約し、境界違反をテストで検出 |
| 更新直後に公開表示へ反映されない | Payload hookからtag/path単位でrevalidate |
| 外部 API からリアルタイム取得が必要になった | `fetch` with revalidate / SWR / React Query |
| アプリデータが増えた | CMS collectionとschema / service / 権限を分ける |

**移行コスト:** 中〜高。既存URL・不変id・表示結果を固定し、repository境界と再実行可能importerを先に作ることで切替リスクを抑える。

---

### 4. スタイリングの見直しを検討するタイミング

現在、Tailwind CSS v4 + `globals.css` の CSS 変数トークンを使用している。

| 事象 | 対応候補 |
|---|---|
| トークンの種類が増えて管理が難しくなった | `design_system_v1.md` に定義を追記し AI に参照させる |
| ダークモードで特定コンポーネントの色が意図通りにならない | `visualSemantics.ts` の tone マッピングを見直す |

---

## 変更履歴

| 日付 | 内容 |
|---|---|
| 2026-07-26 | コンテンツ基盤を Payload CMS + managed PostgreSQL へ移行する判断と、移行後の再検討条件を追加 |
| 2026-06-05 | 初版作成。ページヘッダー方式（B採用）の判断根拠と将来指標を記録 |
