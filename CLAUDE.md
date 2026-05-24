# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

日本のtoB事業者向け「ヒューマノイド導入の入口」メディア（Astro静的サイト）。
**6/10ロボスタに名刺代わりで間に合わせる**ことが当面のゴール。一人運営・残り約2.5週間（2026-05-24時点）。

**GitHub**: `SORA-localize/Deploid_toB`
**デプロイ先**: Cloudflare Pages（`*.pages.dev` サブドメイン、当面は無料サブドメインで運用）

## Source of truth: the design docs

このリポジトリの**設計と意思決定は親ディレクトリの2本のMarkdownに集約されている**。コードを書く前に必ず参照する：

- `../humanoid_media_IA_v1.md` — 情報設計（ナビ・ページ役割・**Content Collections設計案（§10で型定義済み）**・MVPスコープ§13）
- `../humanoid_media_build_notes_v1.md` — 構築メモ（スタック・公開フロー・AIの使い方・**"AI感"を消すデザインルール§5**・TODO§7）

ページ構成・スキーマ・コピー方針で迷ったら**まず上記を読む**。コードからは推論できない判断基準（なぜこの4ページか／何を作らないか／なぜCloudflare Pagesか）がここにある。

## MVPスコープ（厳守）

**作る4ページのみ**：`/` / `/about` / `/guide/[slug]`（旗艦記事1本） / `/contact`

**意図的に作らない**（IA §13）：services、works/実績、`/robots`一覧＋フィルタ、業種逆引き、ニュース連投。
→ 「空の棚を作らない」が原則。コレクション**スキーマだけ**先に定義し、中身は `guides` × 1〜2 と任意で `robots` × 1 のみ。

スコープ外の機能を追加する前に必ずユーザーに確認すること。

## Commands

| Command | Action |
|---|---|
| `npm install` | 依存導入 |
| `npm run dev` | `localhost:4321` で開発サーバ |
| `npm run build` | `./dist/` に本番ビルド |
| `npm run preview` | ビルド結果のローカルプレビュー |
| `npx astro sync` | Content Collectionsの型生成（`src/content.config.ts` 変更後に必須） |
| `npm run astro -- --help` | Astro CLIヘルプ |

テストランナー・lint・型チェックの設定はまだ無い（追加時はユーザーに確認）。

## Architecture notes

- **Astro v6.3.7**（`package.json` で `astro: ^6.3.7`、Node `>=22.12.0`）。Content Collections は **v5/6現行API**（`src/content.config.ts` ＋ `glob()` ローダー）を使う。旧式の `src/content/config.ts` ＋ `type: 'content'` は使わない（IA §9）。
- 現状は **Astro公式 "basics" テンプレのまま**。`src/pages/index.astro` / `src/components/Welcome.astro` / `src/layouts/Layout.astro` は雛形なので、本実装で置き換える前提。
- 旗艦記事「意思決定変数の地図」は `src/content/guides/decision-variables.md` に置く（IA §11にfrontmatterサンプル）。
- 本文描画は **`import { render } from 'astro:content'` → `const { Content } = await render(entry)`**（v5+のAPI。`entry.render()` は旧式で使わない）。

## デザイン方針（"AI感"回避）

build_notes §5 が**強制ルール**。違反するとサイトの存在意義（"質と本気度の証明"）が崩れる：

- **禁止**：紫〜青のグラデ・ヒーロー、中央寄せ巨大見出し＋角丸ボタン2個、アイコン付き角丸カード3枚の特徴セクション、過剰な角丸/シャドウ/グラスモーフィズム、中身のないAIイラスト/3D
- **やる**：ほぼモノクロ＋アクセント1色（**グラデ禁止**）、強いタイポ階層、モノスペースのセクションラベル（例 `// 01 CATALOG`）、左揃え・グリッド規律、意図的な非対称、本物のデータと出典明記
- **錨**：参考サイト = `whichhumanoid.ai`（UI）／`humanoidintel.ai`（メニュー）／`humanoidapplications.com`（用途導線）。実装時は必ず参考と並べて見比べる。「いい感じに作って」は禁句。

## デプロイ

Cloudflare Pages でGitHub連携 → pushで自動デプロイ（build_notes §6-3）。フレームワーク `Astro`、ビルド `npm run build`、出力 `dist`、必要なら `NODE_VERSION=22` を環境変数に。

## 機種データの扱い

スペック数値・価格・代理店情報は**必ず一次出典で裏取り**し、`sources: [...]` に URL を残す（AI生成値の混入を防ぐ）。`updated:` は実確認日。
