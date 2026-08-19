---
status: reference
updated: 2026-08-18
---

# Content preview / Draft Mode runbook v1

Task 7（`.superpowers/sdd/content-platform-migration-plan-v1/task-7-brief.md`）が実装した
Draft Mode preview（`/api/draft-mode/enable` / `/api/draft-mode/disable`）と、publish後の
cache revalidation（`/api/revalidate-content`）の運用手順。実装の正本は
`lib/content/previewTokens.ts` / `lib/content/cacheTags.ts` / `lib/payload/revalidationHook.ts`。

**この文書、監査artifact、Git、チャットのいずれにも実際のtoken文字列・cookie値・secret値を
書かない。** 手順の説明にはプレースホルダ（`<token>` 等）だけを使う。

---

## 1. Draft Mode preview の2経路

| 経路 | 対象 | 有効期限 | 実装 |
|---|---|---|---|
| 1. Payloadログイン | `content-draft-writer` / `content-publisher` / `platform-admin` | Payload sessionに準ずる | `authenticateDraftWriter()` |
| 2. 署名付きtoken | 社外を含む任意の閲覧者 | **発行から最大5分** | `mintPreviewToken()` / `consumePreviewToken()` |

どちらの経路で有効化しても、Draft Mode cookie（Next.js標準）に加えて、このrepo独自の
`deploid-preview-session` cookie（署名付き、既定1時間）を発行する。以降のdraft取得は
**毎request** `getActivePreviewSession()` で再検証する——cookieが存在するだけでは
draftを返さない。`kind: 'user'` のsessionは毎回 `admins` collectionから現在roleを読み直すため、
token発行後にroleが失効すれば次のrequestから即座に拒否される（`role-revoked-or-insufficient`）。

## 2. token発行（経路2）

**token発行担当は `content-publisher` 以上。** `content-draft-writer` は自分自身のPayload
ログインでdraftを見られるため、社外向けの一時共有tokenを発行する権限までは必要ない
（`mintPreviewToken()` 自体はrole検査を持たないため、呼び出し側 — 将来のTask 8 admin UI /
CLI — がこの運用ルールを守る）。

### 入力

| 項目 | 意味 |
|---|---|
| 対象path | 共有したい相対path。`/`, `/robots`, `/manufacturers`, `/use-cases`, `/reports` 配下のみ（`isAllowedPreviewRedirect()`）。それ以外は `mintPreviewToken()` 自体が例外を投げて拒否する。 |
| 閲覧者 | tokenの `sub`。監査ログ用の自由文字列（例: 取材先の会社名・担当者email）。 |
| 期限 | 常に発行から5分固定（`ttlMs` を長く指定しても丸められる）。 |

### 出力

HMAC署名付きtoken文字列（`base64url(JSON payload) + '.' + hex(HMAC-SHA256)`）。payloadは
`sub` / `exp` / `iat` / 128-bit `nonce` / `redirect`。**このtoken文字列自体を長期保存しない**
——5分で失効し、かつ一度 `/api/draft-mode/enable` で消費すると二度と使えない。

### 共有方法

閲覧者へ次のURLを渡す（`?token=` はGETクエリでも受け付ける——クリックできるリンクにするため）。

```
https://<deployment>/api/draft-mode/enable?token=<token>
```

## 3. nonce失効の仕組み

tokenのnonce（128-bit）は `preview_nonces` table（migration
`20260818_090053_add_preview_nonces`）に未使用として記録され、`/api/draft-mode/enable` が
`UPDATE preview_nonces SET used = true WHERE nonce = $1 AND used = false AND expires_at > now()`
という単一SQL文で原子的に消費する。2回目以降の同じtokenは必ず `nonce-reused-or-unknown` で
拒否される（TOCTOUを起こさない設計は `migrations/20260818_090053_add_preview_nonces.ts` の
docblock参照）。

`preview_nonces` は5分で無意味になる使い捨ての行が溜まり続けるtableで、TTL cleanup batchは
**未実装**（`preview_nonces_expires_at_idx` はそのためのindexとしてだけ先に用意してある）。
運用上の実害が出るまで（行数がテーブル走査コストに影響し始めたら）、手動で
`DELETE FROM preview_nonces WHERE expires_at < now() - interval '1 day';` を実行するか、
定期batchを別途実装する。

## 4. secret漏えい時のrotation

対象secret: `REVALIDATION_SECRET`（`/api/revalidate-content` の署名）、
`PREVIEW_TOKEN_SECRET`（preview token・preview session cookieの両方の署名）。

1. Vercelの対象環境（Production / Preview）で該当secretを新しい値へ再生成する。
2. deployし直す（secret差し替えは再デプロイしないと反映されない）。
3. **`PREVIEW_TOKEN_SECRET` をrotationすると、発行済みの未消費tokenと、有効化済みの
   `deploid-preview-session` cookieが全て即座に無効化される**（署名検証に失敗し
   `malformed` 扱いになる）。緊急rotation時はこれが意図した挙動——漏えいしたsecretで
   偽造されたtoken/sessionも同時に無効化される。
4. `REVALIDATION_SECRET` のrotationは、rotation前に発行されたPayload afterChangeの
   通知fetchが到達していなければ、その回のrevalidationだけ失敗する（fail-open設計 —
   `lib/payload/revalidationHook.ts`）。次のcontent更新で正常に復帰するため、追加対応は
   不要。心配であれば `npm run payload:migrate` 相当の運用スクリプトから
   `/api/revalidate-content` を全collectionぶん手動で叩き直す。

## 5. 403 / 401時の停止条件（運用者向け）

`getActivePreviewSession()` が `role-revoked-or-insufficient` を返すのは、**cookieを発行した
時点では有効だったuserの現在roleが `content-draft-writer` 未満へ下がった**場合。これは
バグではなく設計どおりの即時失効。エンドユーザーから「さっきまでdraftが見えていたのに
見えなくなった」という報告があれば、まず該当userのrole変更履歴を確認する
（`content-draft-writer` 未満へ変更されていれば正常動作）。

`/api/draft-mode/enable` が401/400を返す組み合わせと意味:

| status | 状況 |
|---|---|
| 401 `unauthenticated` | Payload sessionが無い、かつtokenも無い |
| 401 `malformed` | token/cookieの署名が壊れている・改ざんされている・`PREVIEW_TOKEN_SECRET`未設定 |
| 401 `expired` | tokenの `exp` を過ぎている、または発行から5分を超えている |
| 401 `nonce-reused-or-unknown` | 同じtokenを2回目以降に使おうとした、または存在しないnonce |
| 400 `redirect-not-allowed` | `redirect` が `isAllowedPreviewRedirect()` のallowlist外 |
| 400 `invalid-request` | requestのJSON自体が壊れている |

これらはすべて**Draft Mode cookieを一切発行しない**（`lib/content/previewTokens.ts` /
`src/app/api/draft-mode/enable/route.ts`）。fail-closedであり、「とりあえず有効化してから
弾く」実装にはなっていない。

## 6. `/api/revalidate-content` の署名

`REVALIDATION_SECRET` によるHMAC-SHA256署名（`X-Revalidate-Signature` header、raw body全体に
対して計算）。検証は `crypto.timingSafeEqual`（`lib/content/cacheTags.ts`）。secret未設定・
署名欠落・不一致・collection名がallowlist外（`contentTags` の10 key以外）は401/400で拒否する。

各content collection + `site-settings` globalの `afterChange` hookが、publish/draft保存の
たびにこのendpointへ署名付きでfetchする（`lib/payload/revalidationHook.ts`）。**この通知は
fail-open**——Next.jsサーバーが応答しない、`PAYLOAD_PUBLIC_SERVER_URL` 未設定、secret未設定の
いずれでも、content書き込み自体はブロックしない（キャッシュが1回古いまま残るだけ）。

### 6.1 fail-open時の残存ウィンドウ（Important 4）

webhook通知が失敗する（Next.jsサーバー未応答、secret未設定・不一致、ネットワーク不通等）と、
そのpublish/unpublishは**そのまま何もしない**——次に別の書き込みが同じcollectionへ成功で
webhookを飛ばすまで、古い表示が残り続けるリスクがある。この残存ウィンドウの長さは、
cache化された各view（`lib/content/cacheDependencies.ts`）が使う `cacheLife('hours')` の
実測値（`node_modules/next/dist/server/config-shared.js` の組み込みprofile定義）で決まる:

| profile値 | 秒数 | 意味 |
|---|---|---|
| `stale` | 300秒（5分） | クライアント（router cache）がこの間は再検証なしに使い回す |
| `revalidate` | 3600秒（**60分**） | サーバーがこの間隔でbackground再生成を試みる（stale-while-revalidate） |
| `expire` | 86400秒（**24時間**） | 上限。これを過ぎるとstale値を一切返さず、同期的に再生成する |

**したがって、webhookが一度も届かなかった最悪ケースでも:**

- 通常は次のrequestから**最大60分以内**に、Next自身のtime-basedバックグラウンド再生成
  （tagとは無関係に`revalidate`秒数が経過したら発生する）によって新しい値へ切り替わる。
- どれだけ運が悪くても**24時間以内**には必ず新しい値になる（`expire`はstale値を返す
  ことを一切許さない硬い上限のため）。
- webhookが正常に届いた場合は、上記の時間経過を待たず`revalidateTag(tag, 'max')`が
  該当cache entryを直接無効化する（`tests/e2e/cache-revalidation.spec.ts`で実HTTPを
  使い検証済み——次にpollした実requestで新しい値が返ることを確認している）。

unpublish（掲載停止）でも同じ残存ウィンドウが適用される——**fail-open設計を選んだ以上、
「掲載停止したはずの内容が最大24時間、実運用上は概ね60分以内に古いキャッシュとして
公開され続ける可能性がある」ことを運用上受容している。** 緊急に停止したい場合は、
`REVALIDATION_SECRET`を使って手動で`/api/revalidate-content`へ署名付きrequestを送るか、
Vercelのcache purge機能を使う。

---

## 関連

- `.superpowers/sdd/content-platform-migration-plan-v1/task-7-brief.md`
- `docs/reference/database-migration-runbook-v1.md`（`preview_nonces` migration）
- `lib/content/cacheDependencies.ts`（cache tag依存表）
