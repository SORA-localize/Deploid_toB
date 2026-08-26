# Deploid

日本のtoB事業者向け「ヒューマノイド導入判断ポータル」。ロボット・メーカー・用途・導入事例・記事を、スペック表ではなく「買い手が導入を判断するための変数」で整理する。

- **スタック**: Next.js 16 (App Router) / React 19 / TypeScript / Tailwind CSS v4
- **デプロイ**: Vercel
- **データ（現在）**: Payload CMS / managed PostgreSQL（Task 9 cutover完了）
- **構成**: Payload管理画面 / PostgreSQL / オブジェクトストレージ / 制限付きCodex MCP
- **AI作業ルール**: `AGENTS.md` → `ai/rules/00-index.md`
- **設計ドキュメント**: `docs/`（まず `docs/README.md`）
- **CMS / DB判断**: `docs/decisions/content-platform-and-database-architecture-v2.md`
- **全体リファクタリング**: `docs/plans/project-wide-refactor-roadmap-v2.md`
- **データ追加ガイド**: `docs/decisions/data/README.md`
- **AI実装ワークフロー**: `ai/rules/10-workflow.md`（計画・実装・レビューの共通プロンプト集）
- **データ保守ワークフロー**: `ai/rules/20-data.md` → `ai/rules/21-data-maintenance-workflow.md`

## コマンド

| Command | Action |
|---|---|
| `npm install` | 依存導入 |
| `npm run dev` | `localhost:3000` で開発サーバ |
| `npm run build` | 本番ビルド（SSG） |
| `npm run start` | ビルド結果をローカル起動 |
| `npm run check` | 全ゲートを通す（CIと同じ） |
| `npm run check:dead-code` | 未使用ファイル・依存の検査（knip） |
| `npm run check:docs` | Markdown のローカルリンク切れ検査 |

### `check:dead-code` の範囲と ignore

検査するのは **未使用ファイル・未使用依存・未宣言依存の3つ**（`knip.json` の `include`）。
未使用 export は対象外にしている。実測で86件出るが、その多くは `lib/labels.ts` や
`lib/display.ts` のように「enum に対する表 = 正本」として意図的に全件揃えているもので、
未参照であること自体は欠陥ではない。混ぜると gate が常に赤になり、無視されるようになる。
整理するなら export 単位ではなく「その enum 値ごと使わないと決める」判断が要るため、
別途扱う。

`ignoreDependencies` は、**knip が CSS を辿らないために誤検知するもの**だけを挙げている。
「使っていないが消せない」ものは1つも入っていない。

| 依存 | 実際の使用箇所 |
|---|---|
| `@radix-ui/colors` | `src/app/globals.css` が `@import "@radix-ui/colors/slate.css"` で読む。消すとテーマトークンが解決できず配色が壊れる |
| `tailwindcss` / `tw-animate-css` | `globals.css` から解決 |
| `postcss` / `postcss-load-config` | `postcss.config.mjs` の設定形式と型注釈 |

**無言で ignore を増やさないこと。** 追加するときは、ここに実際の使用箇所を書く。理由の無い
ignore が溜まると、この gate は「何も見つけない gate」になる。

### `check:docs` の範囲

`README.md` / `AGENTS.md` / `CLAUDE.md` / `docs/` / `ai/` の Markdown を対象に、
**ローカルリンクの実在**だけを検査する。

- **外部URLは見ない。** 到達性は相手側の都合で変わり、PR gate に混ぜると自分の変更と
  無関係に赤くなる。外部 source link は `check:source-links` として scheduled workflow に分けてある。
- **コードフェンス内は見ない。** 例示として存在しないパスを書くことがある。
- **`docs/archive/` は警告のみで落とさない。** archive は内容凍結の棚（`ai/rules/80-doc-governance.md`）で、
  リンク切れを直すには凍結を破るしかない。直せない gate は無視されるようになる。

## ブランチ運用

- `main`: 公開可能な安定版。Vercel本番に載せてよい状態だけを置く
- `content/data-maintenance`: AIで記事追加、データ更新、出典補強を行う継続作業ブランチ
- `fix/<issue>`: 表示崩れ、検証エラー、SEO設定などの小さな修正用
- `experiment/<name>`: UI、導線、広告枠などの検証用。採用しない前提でいつでも捨てられるようにする

通常のデータ・記事更新はPayload管理画面または認証済みPayload API/MCP経路で行い、必要に応じてsnapshot integrity checkと`npm run build`を通してから`main`へ反映する。
大きめの変更は `content/<topic>` や `fix/<issue>` を `main` から切り、完了後に `main` へmergeする。

## 環境変数

ローカルでは `.env.example` を参考に `.env.local` を作る。実際の値はコミットしない。

| Variable | Required | 用途 |
|---|---:|---|
| `NEXT_PUBLIC_SITE_URL` | No | sitemap / metadata 用の公開URL。未設定時は `http://localhost:3000` |
| `NEXT_PUBLIC_FORMSPREE_FORM_ID` | Yes | Contactフォーム送信用のFormspree form ID。未設定時はフォームを送信不可にする |
| `NEXT_PUBLIC_MEDIA_USAGE_POLICY` | No | 画像・ロゴの表示ポリシー。未設定時は `reference-attributed`。厳格運用時は `commercial-strict` |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | No | GA / Clarity の明示的な有効化。`true` かつ ID が1つ以上あり、かつ production runtime のときだけ送信する。未設定時は送信しない |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | GA4 Measurement ID（`G-` 始まり）。未設定時は GA を読み込まない |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | No | Microsoft Clarity Project ID（英数字）。未設定時は Clarity を読み込まない |
| `NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED` | No | Vercel Analytics の有効化。`true` かつ production runtime のときだけ計測する。未設定時は計測しない |

Vercelでは Project Settings の Environment Variables に設定する。

analytics についての約束:

- **未設定なら何も送信しない。** ソースにフォールバックの ID を持たない。
- **production runtime だけ。** ここでの production runtime は「`NODE_ENV=production` かつ
  （`VERCEL_ENV=production` または `VERCEL_ENV` 自体が無い）」。Vercel の preview は
  `NODE_ENV=production` でビルドされるため、preview の計測が本番へ混ざらないようにしている。
- **production で不正な形式の ID は起動時に失敗させる。** タイポは「計測できているつもりで
  何も取れていない」状態を作り、気づくまでが長い。検査は production runtime に限り、
  ローカル開発は壊れた値でも止めない。

## 構成

```text
src/app/        # App Router ページ（/, /robots, /manufacturers, /compare,
                #   /use-cases, /reports, /about, /contact ＋各 [slug]）
ai/rules/       # AIエージェント向けの入口・作業別ルール
components/     # UI コンポーネント、カード、フィルター、共通レイアウト
data/           # retired/import fixtures only; Payload is the content source of truth
lib/            # content repository and domain services, labels.ts（enum→日本語）
docs/           # 設計・意思決定ドキュメント（README.md がダッシュボード）
docs/decisions/ # 恒久方針・現行仕様・運用チェックリスト
docs/plans/     # 進行中の作業計画
docs/reference/ # 背景・経緯・調査スナップショット
docs/archive/   # 実装済み・履歴参照用
```

## 作業規約

実装・データ保守・UI・権利まわりの詳細ルールは `AGENTS.md` と `ai/rules/00-index.md` を入口に参照する。

データ追加・更新時は `ai/rules/20-data.md` と `ai/rules/21-data-maintenance-workflow.md` を読む。UI変更時は `ai/rules/30-ui-design.md`、画像・引用・記事本文を扱う時は `ai/rules/40-content-rights.md` を読む。

CMS / DB移行を実装する場合は、`docs/decisions/content-platform-and-database-architecture-v2.md` と `docs/plans/content-platform-migration-plan-v1.md` を先に読む。ページから直接SQL / Payload SDKを呼ばず、サーバー専用repository境界に集約する。
