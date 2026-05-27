# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

日本のtoB事業者向け「ヒューマノイド導入判断ポータル」（**Next.js**）。サイト名は **Deploid**。
機種(robots)・メーカー(manufacturers)・用途(use-cases)・導入ガイド(guides)・記事(reports)を、スペック表ではなく「買い手が導入を判断するための変数」で整理する。

**GitHub**: `SORA-localize/Deploid_toB`
**デプロイ先**: Vercel（Next.js との相性が第一候補）

> 旧経緯：このリポジトリは元々 Astro 静的サイトとして始まったが、Figma Make で生成した React UI をベースに **Next.js へ移行済み**。`astro.config.mjs` や `src/styles/global.css` など旧Astro残骸が一部残るが、現行実装は Next.js（App Router）。

## Source of truth: the design docs

設計と意思決定は `docs/planning/` のドキュメント群に集約されている。コードを書く前に必ず参照する：

- `docs/planning/README.md` — ドキュメント地図（迷ったらまずこれ。矛盾時の優先順位もここ）
- `docs/planning/figma_ui_restoration_plan_v1.md` — **現在進行中の作業計画**（Figma UIをNext.jsへ復元するフェーズ手順）
- `docs/planning/nextjs_pre_migration_decisions_v1.md` — 技術決定（スタック・URL命名・UIトークン）
- `docs/planning/humanoid_media_IA_v1.md` — 情報設計（ナビ・各ページの役割・書くべき内容）
- `docs/planning/humanoid_data_management_guide_v1.md` — データ運用（コレクションの役割・命名・出典）
- `docs/planning/nextjs_data_types_v1.ts` — **データ型の真実源**（`data/types.ts` はこれと一致させる）

ページ構成・スキーマ・コピー方針で迷ったら**まず上記を読む**。コードからは推論できない判断基準（なぜこのページ構成か／何を作らないか／なぜNext.js+Vercelか）がここにある。

## 現在の作業（厳守）

`docs/planning/figma_ui_restoration_plan_v1.md`（v2 / Option C）に従う。**堅牢なデータ層の上に、Figma UIを逐語コピーで載せ直す。**

- **核心ルール：Figmaのマークアップは逐語コピー。再解釈・restyle・独自UIは禁止。差分はバグ。**（UI実装が2回ゴミ化した原因がこれ）
  - そのままコピー：構造・`className`(Tailwind)・**列構造**・カード解剖・インタラクション
  - 機械的置換のみ：`react-router`→`next/link`/`usePathname`/`params`、`id`→`slug`、`mockData`→`@/lib/data`、`/posts`→`/reports`、`/industries`→`/use-cases`
  - 内容差し替え：brand=`Deploid`、Figmaの仮スペック→自データ＋無ければ `要確認`
- **データ層（`data/` `lib/`）は完成度が高い。作り直すのはUI層のみ。**
- まず **Phase 1 でこれまでの再現UIをクリーンに削ぎ落とす**（globals.cssをTailwind+Figmaトークンのみに、レガシー独自クラス/トークンと簡易カードを撤去）。その後にFigma逐語コピー。
- 優先順位：**Home → ロボット → メーカー → 比較**（公開情報で作り切れる4領域を先に）
- 1フェーズごとに `npm run build` を通し、Figma原本と構造差分が無いか並べて確認、`git diff --stat` を見てから次へ。

スコープや方針を変える前に必ずユーザーに確認すること。

## Commands

| Command | Action |
|---|---|
| `npm install` | 依存導入 |
| `npm run dev` | `localhost:3000` で開発サーバ（Next.js） |
| `npm run build` | 本番ビルド（`.next/`、SSG） |
| `npm run start` | ビルド結果をローカルで起動 |

`astro:dev` / `astro:build` スクリプトは旧残骸（使わない）。テストランナー・lint・型チェックの設定はまだ無い（追加時はユーザーに確認）。

## Architecture notes

- **Next.js 16 + React 19 + TypeScript**（App Router）。Node `>=22.12.0`。
- ルートは `src/app/`：`/` `/robots` `/robots/[slug]` `/manufacturers` `/manufacturers/[slug]` `/compare` `/guides` `/guides/[slug]` `/use-cases` `/use-cases/[slug]` `/reports` `/reports/[slug]` `/about` `/contact`。
- 詳細ページは `generateStaticParams` でSSG。
- **データ層**：
  - `data/*.ts` … 配列データのみ（`robots` `manufacturers` `guides` `useCases` `reports`）。`data/types.ts` が型定義。
  - `lib/data.ts` … 取得・filter・slug lookup・関連取得。**ページからは `data/*.ts` を直接検索せず `lib/data.ts` 経由で呼ぶ**（CMS移行時に呼び出し形を変えないため）。
  - `lib/labels.ts` … enumトークン→日本語ラベル変換。
- **共通レイアウト**：`src/app/layout.tsx`（Header / main / Footer）。実際に使われるCSSは `src/app/globals.css`。
- 注意：`src/styles/global.css` は**どこからもimportされていない旧Astro孤児ファイル**。Next.js実装では `src/app/globals.css` を使う。

## URL・命名規約

- 公開URLの識別子は **`slug`**（旧Figmaの `id` は使わない）。
- **`/reports`**（`/posts` ではない）、**`/use-cases`**（`/industries` ではない）。
- collection名は複数形・英語（`robots` `manufacturers` `guides` `useCases` `reports`）。

## デザイン方針（"AI感"回避）

build_notes §5 が**強制ルール**。違反するとサイトの存在意義（"質と本気度の証明"）が崩れる：

- **禁止**：紫〜青のグラデ・ヒーロー、中央寄せ巨大見出し＋角丸ボタン2個、アイコン付き角丸カード3枚の特徴セクション、過剰な角丸/シャドウ/グラスモーフィズム、中身のないAIイラスト/3D
- **やる**：ほぼモノクロ＋アクセント1色（**グラデ禁止**）、強いタイポ階層、モノスペースのセクションラベル、左揃え・グリッド規律、本物のデータと出典明記
- Figma Make版のneutral/矩形UIはこの方針と整合する。復元時はFigma構造を基準にしつつ、グラデ・過剰な角丸は持ち込まない。

## 機種データの扱い

スペック数値・価格・代理店情報は**必ず一次出典で裏取り**し、`sources: [...]`（`Source[]`：url / checkedAt / reliability 等）に残す（AI生成値の混入を防ぐ）。不明な値はハードコードせず **`要確認`** と表示する。Figmaの産業ロボット寄りの仮スペックはそのまま移植しない。
