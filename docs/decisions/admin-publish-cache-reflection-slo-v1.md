---
status: current
updated: 2026-09-05
---

# Admin公開 → 公開ページ反映のSLO v1

> `docs/plans/admin-ux-and-revalidation-fix-plan-v1.md` Task 3。「公開してからいつ反映されるか」に、
> Next.jsが保証すること・このプロジェクトが目標とすること・超過時の手順を分けて答える。

---

## 1. Next.jsが保証すること（契約）

対象ページ（`manufacturers`・`robots`・`use-cases`等の動的コンテンツpage.tsx）は
`'use cache'` + `cacheLife('hours')` を使っている。`hours`プロファイルのNext.js定義値
（`next/dist/server/config-shared.js`）:

| 項目 | 値 | 意味 |
|---|---|---|
| `stale` | 300秒 | この間はクライアントに古い内容を返してよい |
| `revalidate` | 3600秒 | この間隔でサーバーが作り直す |
| `expire` | 86400秒 | これを超えたら必ず作り直す |

公開処理は `revalidateTag(tag, 'max')`（`src/app/api/revalidate-content/route.ts`）でタグを
無効化するが、これは**即時反映を意味しない**。Next.jsのキャッシュはstale-while-revalidateで、
タグ無効化は「次にこのタグのページへアクセスが来たら再生成する」という印にすぎない。

**したがって以下は保証されない**:
- タグ無効化直後の**1回目のアクセス**で必ず新しい内容が返ること
  （実装によってはstaleな値が先に返り、裏で再生成が始まる場合がある）
- アクセスが無いページが、タグ無効化だけで能動的に更新されること
  （`docs/plans/admin-ux-and-revalidation-investigation-v1.md`「D節」参照）

**保証されるのは**: タグ無効化が成功していれば、**その後複数回アクセスすれば**新しい内容に
収束すること。これは`tests/e2e/cache-revalidation.spec.ts`が採用している検証方法
（1回の取得ではなくポーリングで収束を待つ）と同じ前提。

## 2. このプロジェクトが目標とすること（SLO）

> **公開ボタンを押してから、公開ページへ継続的にアクセスした場合、30秒以内に新しい内容へ
> 収束する。**

内訳:

| 区間 | 目標 |
|---|---|
| 公開クリック → `/api/admin/publish` が200を返す | 数秒（既存の公開処理そのもの） |
| 200 → `/api/revalidate-content` への通知が届く | 即時〜数秒（`notifyRevalidationAfterCommit`、5秒timeout） |
| 通知が届く → 公開ページへのアクセスが新しい内容を返す | ポーリングで30秒以内 |

この目標は「初回アクセスで必ず新しい内容が返る」を約束するものではない。契約上の理由
（§1）で約束できないため、**ポーリングでの収束**を目標値の単位にしている。

**通知そのものが失敗した場合**（Task 2で導入した`RevalidationNotifyResult`が`ok`以外）、
このSLOは成立しない。編集者にはtoastで「反映されたか分からない」旨を伝える
（`publish-succeeded-reflection-failed` / `publish-succeeded-reflection-not-configured`、
`lib/payload/adminPublishMessages.ts`）。

## 3. 超過したとき・通知が失敗したときの手順

1. **admin画面のtoastを確認する。** 「反映まで時間がかかる場合があります」系の文言が
   出ていれば、通知自体が届いていない（§2の2区間目で失敗）。この場合はSLOの対象外——
   下記4を見る
2. **公開ページを手動で再読み込みする。** stale-while-revalidateの性質上、1回の
   再読み込みで反映されないことがある。**数回**再読み込みして収束を確認する
3. 30秒（複数回の再読み込み）を超えても反映されない場合、以下を疑う:
   - `REVALIDATION_SECRET` / `PAYLOAD_PUBLIC_SERVER_URL`（または`VERCEL_BRANCH_URL`）が
     対象環境で設定されているか（`lib/payload/resolvePublicServerUrl.ts`）
   - Vercel Deployment Protectionが`/api/revalidate-content`への自己POSTを弾いていないか
     （Preview環境で過去に発生。`docs/plans/admin-ux-and-revalidation-investigation-v1.md`
     「B・C節」参照。`VERCEL_AUTOMATION_BYPASS_SECRET`が注入されているかを確認する）
   - Postgres接続が枯渇していないか（`EMAXCONNSESSION`。公開処理自体が失敗するため、
     通常はtoastで気づく。`docs/reference/task9-preview-rehearsal-preflight-v1.md`参照）
4. **`missing-secret`/`missing-base-url`は設定不備であり、待っても解決しない。**
   ローカル開発環境ではこれが正常（webhookを配線していないため）。Preview/本番で
   出た場合は環境変数の設定を確認する

## 4. 実装しないこと

- `cacheLife`の短縮（D-2で非推奨。DBアクセスが増え、Task 1で対応した接続枯渇と競合する）
- 初回アクセスでの反映を保証する別方式（Next.jsの標準機構の外に出る変更で、
  本計画のスコープを超える）
