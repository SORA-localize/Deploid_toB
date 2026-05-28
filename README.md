# Deploid

日本のtoB事業者向け「ヒューマノイド導入判断ポータル」。機種・メーカー・用途・導入ガイド・記事を、スペック表ではなく「買い手が導入を判断するための変数」で整理する。

- **スタック**: Next.js 16 (App Router) / React 19 / TypeScript / Tailwind CSS v4
- **デプロイ**: Vercel
- **データ**: ローカル TS データ（`data/*.ts`）。将来 CMS 接続前提
- **設計ドキュメント**: `docs/planning/`（まず `docs/planning/README.md`）

## コマンド

| Command | Action |
|---|---|
| `npm install` | 依存導入 |
| `npm run dev` | `localhost:3000` で開発サーバ |
| `npm run build` | 本番ビルド（SSG） |
| `npm run start` | ビルド結果をローカル起動 |

## 構成

```text
src/app/        # App Router ページ（/, /robots, /manufacturers, /compare,
                #   /guides, /use-cases, /reports, /about, /contact ＋各 [slug]）
components/     # UI コンポーネント（Figma Make UI を逐語移植）
data/           # 配列データ + types.ts（型の真実源）
lib/            # data.ts（取得/filter/slug lookup）, labels.ts（enum→日本語）
docs/planning/  # 設計・意思決定ドキュメント
```

ページからは `data/*.ts` を直接検索せず、必ず `lib/data.ts` 経由で取得する（CMS 移行時に呼び出し形を変えないため）。

## 規約

- 公開 URL 識別子は `slug`。`/reports`（≠`/posts`）、`/use-cases`（≠`/industries`）。
- 機種スペック・価格・代理店情報は一次出典で裏取りし `sources`（`Source[]`）に残す。不明値は `要確認`。
