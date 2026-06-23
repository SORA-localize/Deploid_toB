# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

日本のtoB事業者向け「ヒューマノイド導入判断ポータル」（**Next.js**）。サイト名は **Deploid**。
ロボット(robots)・メーカー(manufacturers)・用途(use-cases)・導入ガイド(guides)・記事(reports)を、スペック表ではなく「買い手が導入を判断するための変数」で整理する。

**GitHub**: `SORA-localize/Deploid_toB`
**デプロイ先**: Vercel（Next.js との相性が第一候補）

> 旧経緯：このリポジトリは元々 Astro 静的サイトとして始まったが、Figma Make で生成した React UI をベースに **Next.js へ移行済み**。旧Astro残骸（`src/pages/*.astro` `astro.config.mjs` `src/content.config.ts` 等）は撤去済み。現行実装は Next.js（App Router）のみ。

## Source of truth: the design docs

共通のAI作業ルールは `AGENTS.md` と `ai/rules/` に集約している。設計と意思決定は `docs/planning/` のドキュメント群に集約されている。コードを書く前に必ず参照する：

- `AGENTS.md` — 汎用AIエージェント入口
- `ai/rules/00-index.md` — 作業種別ごとの参照ルール
- `ai/rules/10-workflow.md` — AI実装・調査・レビューの共通ワークフロー（§8: データ実装の事前確認チェックリスト）
- `docs/planning/README.md` — ドキュメント地図（迷ったらまずこれ。矛盾時の優先順位もここ）
- `docs/data/README.md` — AIでデータ追加・更新を行うときの入口
- `docs/planning/data-maintenance-checklist-v1.md` — データ追加、slug変更、公開前確認、鮮度レビュー
- `docs/planning/data-architecture-redesign-v1.md` — id/slug分離、参照設計、正本管理
- `docs/planning/copyright_and_media_rights_policy_v1.md` — 画像、ロゴ、引用、出典、権利管理
- `docs/planning/design_system_v1.md` — semantic token、カード/レイアウト方針
- `docs/planning/humanoid_media_IA_v1.md` — 情報設計（ナビ・各ページの役割・書くべき内容）
- `docs/planning/editorial_style_guide_v1.md` — 記事本文の執筆方針（文体・NG表現・セクション別テンプレート・執筆ワークフロー）
- `docs/planning/humanoid_data_management_guide_v1.md` —（背景・非正本）データ運用の経緯。運用の正本は `docs/data/README.md` と `docs/planning/data-maintenance-checklist-v1.md`

ページ構成・スキーマ・コピー方針で迷ったら**まず上記を読む**。コードからは推論できない判断基準（なぜこのページ構成か／何を作らないか／なぜNext.js+Vercelか）がここにある。

## 現在の作業方針

Next.js移行と主要UIリファクタは完了済み。今後の中心は、公開情報に基づくデータ/記事拡充、出典と権利の保守、SEO/計測/収益導線の小さな改善。

- 大きなUI作り直しではなく、既存の `data/` / `lib/` / component 責務に沿って最小変更する
- guides / use-cases は一次情報が薄い間は慎重に扱い、薄いページを量産しない
- データ追加は `docs/data/README.md` と `docs/planning/data-maintenance-checklist-v1.md` に従う
- UI変更は `src/app/globals.css` のsemantic token、`lib/visualSemantics.ts`、既存componentを優先する
- スコープや方針を変える前に必ずユーザーに確認する

## Commands

| Command | Action |
|---|---|
| `npm install` | 依存導入 |
| `npm run dev` | `localhost:3000` で開発サーバ（Next.js） |
| `npm run build` | **前段でデータ検証**（error があると失敗）→ 本番ビルド（`.next/`、SSG） |
| `npm run start` | ビルド結果をローカルで起動 |
| `npm run validate:data` | データ検証のみ実行（error=buildを止める / warning=ログのみ） |

テストランナー・lint・型チェックの設定はまだ無い（追加時はユーザーに確認）。

## Architecture notes

- **Next.js 16 + React 19 + TypeScript**（App Router）。Node `>=22.12.0`。
- ルートは `src/app/`：`/` `/robots` `/robots/[slug]` `/manufacturers` `/manufacturers/[slug]` `/compare` `/guides` `/guides/[slug]` `/use-cases` `/use-cases/[slug]` `/reports` `/reports/[slug]` `/about` `/contact`。
- 詳細ページは `generateStaticParams` でSSG。
- **データ層**（識別子モデル＝`data-architecture-redesign-v1.md`。**参照は不変 `id`、URLは可変 `slug`**）：
  - `data/*.ts` … 配列データのみ（`robots` `manufacturers` `guides` `useCases` `deployments` `articles`＝旧reports）。`data/types.ts` が型定義。全レコードに不変 `id`（参照キー）と可変 `slug`（URL）。slug変更時は旧値を `previousSlugs` に追記（詳細ページが301）。
  - `lib/data.ts` … 取得・filter・lookup・関連取得。参照解決は `get*ById` / `*For*` 系（id）、URL解決のみ `get*BySlug` / `resolve*DetailBySlug`（previousSlugs→301）。**ページからは `data/*.ts` を直接検索せず `lib/data.ts` 経由で呼ぶ**（CMS移行時に呼び出し形を変えないため）。
  - `lib/validate.ts` … 整合チェック（id重複・参照切れ・未登録タグ等＝error で **build を失敗させる**。未ローカル画像・鮮度切れ＝warning）。`scripts/validate-data.mjs` が build 前段で実行。
  - `lib/specSchema.ts` … スペック項目の正本（追加はここに1行→型・スペック表・validateが追従）。
  - `lib/tagRegistry.ts` … タグの正本。`lib/labels.ts` … enumトークン→日本語ラベル変換。`lib/display.ts` … enum表示順。
  - `lib/visualSemantics.ts` … enum/状態→semantic tone→class 変換（色の真実源の一つ）。
  - お気に入り（localStorage）・比較URL（`?compare=`）の保存値は **id**（slug変更に耐える）。
  - 運用手順は `docs/planning/data-maintenance-checklist-v1.md`（追加・slug変更・提供終了・公開ゲート・鮮度レビュー）。
- **共通レイアウト**：`src/app/layout.tsx`（Header / main / Footer）。CSSは `src/app/globals.css`（Tailwind v4 + **Radix Colors ベースの semantic token**。slate=中立 / jade=アクセント。ダークモードは `next-themes`）。

## URL・命名規約

- 公開URLの識別子は **`slug`**（旧Figmaの `id` は使わない）。
- **`/reports`**（`/posts` ではない）、**`/use-cases`**（`/industries` ではない）。
- collection名は複数形・英語（`robots` `manufacturers` `guides` `useCases` `articles`）。記事の公開URLだけ `/reports` を維持する。

## デザイン方針（"AI感"回避）

build_notes §5 が**強制ルール**。違反するとサイトの存在意義（"質と本気度の証明"）が崩れる：

- **禁止**：紫〜青のグラデ・ヒーロー、中央寄せ巨大見出し＋角丸ボタン2個、アイコン付き角丸カード3枚の特徴セクション、過剰な角丸/シャドウ/グラスモーフィズム、中身のないAIイラスト/3D
- **やる**：ほぼモノクロ＋アクセント1色（**グラデ禁止**）、強いタイポ階層、モノスペースのセクションラベル、左揃え・グリッド規律、本物のデータと出典明記
- Figma Make版のneutral/矩形UIはこの方針と整合する。復元時はFigma構造を基準にしつつ、グラデ・過剰な角丸は持ち込まない。
- 色は直書きせず `src/app/globals.css` の token と `lib/visualSemantics.ts` の tone を使う（詳細は `docs/planning/design_system_v1.md`）。
- **例外カテゴリ（意図的・グラデ禁止は維持）**：トップのヒーロー帯とメーカー世界地図のみ、黒背景・白文字の直書きを許容する。演出上の例外で、一覧・比較・詳細などの業務UIには持ち込まない。

## ロボットデータの扱い

スペック数値・価格・代理店情報は**必ず一次出典で裏取り**し、`sources: [...]`（`Source[]`：url / checkedAt / reliability 等）に残す（AI生成値の混入を防ぐ）。不明な値はハードコードせず **`要確認`** と表示する。Figmaの産業ロボット寄りの仮スペックはそのまま移植しない。
