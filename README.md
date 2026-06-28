# Deploid

日本のtoB事業者向け「ヒューマノイド導入判断ポータル」。ロボット・メーカー・用途・導入ガイド・記事を、スペック表ではなく「買い手が導入を判断するための変数」で整理する。

- **スタック**: Next.js 16 (App Router) / React 19 / TypeScript / Tailwind CSS v4
- **デプロイ**: Vercel
- **データ**: ローカル TS データ（`data/*.ts`）。将来 CMS 接続前提
- **AI作業ルール**: `AGENTS.md` → `ai/rules/00-index.md`
- **設計ドキュメント**: `docs/planning/`（まず `docs/planning/README.md`）
- **データ追加ガイド**: `docs/data/README.md`
- **AI実装ワークフロー**: `ai/rules/10-workflow.md`（計画・実装・レビューの共通プロンプト集）
- **データ保守ワークフロー**: `ai/rules/20-data.md` → `ai/rules/21-data-maintenance-workflow.md`

## コマンド

| Command | Action |
|---|---|
| `npm install` | 依存導入 |
| `npm run dev` | `localhost:3000` で開発サーバ |
| `npm run build` | 本番ビルド（SSG） |
| `npm run start` | ビルド結果をローカル起動 |
| `npm run validate:data` | データ整合チェックのみ実行 |

## ブランチ運用

- `main`: 公開可能な安定版。Vercel本番に載せてよい状態だけを置く
- `content/data-maintenance`: AIで記事追加、データ更新、出典補強を行う継続作業ブランチ
- `fix/<issue>`: 表示崩れ、検証エラー、SEO設定などの小さな修正用
- `experiment/<name>`: UI、導線、広告枠などの検証用。採用しない前提でいつでも捨てられるようにする

通常のデータ・記事更新は `content/data-maintenance` で行い、`npm run validate:data` と必要に応じて `npm run build` を通してから `main` に戻す。
大きめの変更は `content/<topic>` や `fix/<issue>` を `main` から切り、完了後に `main` へmergeする。

## 環境変数

ローカルでは `.env.example` を参考に `.env.local` を作る。実際の値はコミットしない。

| Variable | Required | 用途 |
|---|---:|---|
| `NEXT_PUBLIC_SITE_URL` | No | sitemap / metadata 用の公開URL。未設定時は `http://localhost:3000` |
| `NEXT_PUBLIC_FORMSPREE_FORM_ID` | Yes | Contactフォーム送信用のFormspree form ID。未設定時はフォームを送信不可にする |
| `NEXT_PUBLIC_MEDIA_USAGE_POLICY` | No | 画像・ロゴの表示ポリシー。未設定時は `reference-attributed`。厳格運用時は `commercial-strict` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | GA4 Measurement ID。未設定時は `G-PLLDR4X5TV` |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | No | Microsoft Clarity Project ID。未設定時は `x4ow976y5y` |

Vercelでは Project Settings の Environment Variables に設定する。

## 構成

```text
src/app/        # App Router ページ（/, /robots, /manufacturers, /compare,
                #   /use-cases, /reports, /about, /contact ＋各 [slug]）
ai/rules/       # AIエージェント向けの入口・作業別ルール
components/     # UI コンポーネント、カード、フィルター、共通レイアウト
data/           # 配列データ + types.ts（型の真実源）
lib/            # data.ts（取得/filter/slug lookup）, labels.ts（enum→日本語）
docs/planning/  # 設計・意思決定ドキュメント
docs/data/      # データ追加・タグ運用メモ
```

## 作業規約

実装・データ保守・UI・権利まわりの詳細ルールは `AGENTS.md` と `ai/rules/00-index.md` を入口に参照する。

データ追加・更新時は `ai/rules/20-data.md` と `ai/rules/21-data-maintenance-workflow.md` を読む。UI変更時は `ai/rules/30-ui-design.md`、画像・引用・記事本文を扱う時は `ai/rules/40-content-rights.md` を読む。
