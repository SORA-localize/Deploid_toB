# Deploid

日本のtoB事業者向け「ヒューマノイド導入判断ポータル」。ロボット・メーカー・用途・導入ガイド・記事を、スペック表ではなく「買い手が導入を判断するための変数」で整理する。

- **スタック**: Next.js 16 (App Router) / React 19 / TypeScript / Tailwind CSS v4
- **デプロイ**: Vercel
- **データ**: ローカル TS データ（`data/*.ts`）。将来 CMS 接続前提
- **設計ドキュメント**: `docs/planning/`（まず `docs/planning/README.md`）
- **データ追加ガイド**: `docs/data/README.md`

## コマンド

| Command | Action |
|---|---|
| `npm install` | 依存導入 |
| `npm run dev` | `localhost:3000` で開発サーバ |
| `npm run build` | 本番ビルド（SSG） |
| `npm run start` | ビルド結果をローカル起動 |
| `npm run validate:data` | データ整合チェックのみ実行 |

## 環境変数

ローカルでは `.env.example` を参考に `.env.local` を作る。実際の値はコミットしない。

| Variable | Required | 用途 |
|---|---:|---|
| `NEXT_PUBLIC_SITE_URL` | No | sitemap / metadata 用の公開URL。未設定時は `http://localhost:3000` |
| `NEXT_PUBLIC_FORMSPREE_FORM_ID` | Yes | Contactフォーム送信用のFormspree form ID。未設定時はフォームを送信不可にする |
| `NEXT_PUBLIC_MEDIA_USAGE_POLICY` | No | 画像・ロゴの表示ポリシー。未設定時は `reference-attributed`。厳格運用時は `commercial-strict` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | GA4 Measurement ID。未設定時は `G-PLLDR4X5TV` |

Vercelでは Project Settings の Environment Variables に設定する。

## 構成

```text
src/app/        # App Router ページ（/, /robots, /manufacturers, /compare,
                #   /guides, /use-cases, /reports, /about, /contact ＋各 [slug]）
components/     # UI コンポーネント（Figma Make UI を逐語移植）
data/           # 配列データ + types.ts（型の真実源）
lib/            # data.ts（取得/filter/slug lookup）, labels.ts（enum→日本語）
docs/planning/  # 設計・意思決定ドキュメント
docs/data/      # データ追加・タグ運用メモ
```

ページからは `data/*.ts` を直接検索せず、必ず `lib/data.ts` 経由で取得する（CMS 移行時に呼び出し形を変えないため）。

## 規約

- 公開 URL 識別子は `slug`。`/reports`（≠`/posts`）、`/use-cases`（≠`/industries`）。
- ロボットスペック・価格・代理店情報は一次出典で裏取りし `sources`（`Source[]`）に残す。不明値は `要確認`。
- 画像・ロゴは `ImageAsset.rights` を必ず持たせる。初期運用では `reference-attributed` を許容し、商用許諾が取れたら `commercial-permitted` に更新する。
