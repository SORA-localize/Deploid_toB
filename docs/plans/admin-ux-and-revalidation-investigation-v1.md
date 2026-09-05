---
status: plan
updated: 2026-09-05
---

# Admin運用で報告された5つの症状の原因調査

実装は行わない。**実コード・実ログ・実DBから確認できた事実だけ**を記録し、
推定は推定と明記する。確認できなかったことは「未確認」として残す。

報告された症状:

1. 保存・公開してもページに反映されない（ただし後で見ると更新されている）
2. 公開を何度か押すとCMSが落ちる（`ERROR 4073397010`）
3. 更新が本当にできているか分からない
4. CMSのUIが項目が多すぎる
5. ページ内容にセクションタイトルが対応しているか分からない／英語が混じる

---

## 結論の要約

**症状1・2・3は複数の原因が重なって起きている。**症状4・5は別系統で、
`label` が一つも定義されていないことに帰着する。

**2026-09-05 3回目改訂。** 3回の外部レビューを経て訂正を重ねた。最新の要約:

| # | 原因 | 確実性 | 影響範囲 |
|---|---|---|---|
| A | Postgres接続の枯渇。**主因候補はpooler modeの退行**（`DATABASE_URL`が2026-08-25 22:43の設定変更以降、session pooler(5432)のままの疑い。G節参照）。`pool.max`未指定は独立した二次要因 | 症状は確実（実測）。ポート自体は未確認（Secret型） | Preview。本番は未発生 |
| B | 再検証webhookがVercelの保護に弾かれる | `7c18f0a` 前は確実。以後は**bypass機構が機能することを実測確認済み**（C参照） | Preview のみ |
| C | ~~bypass修正がPreviewで無効~~ | **撤回**。原因は自分の検証コマンドのバグ（`tr -d`がコメント行とトークンを結合）。正しい値で送ると機能する | — |
| D | キャッシュが stale-while-revalidate で、アクセスが無いと再生成されない | **確実**（Next.jsの契約） | 対象ページ（動的コンテンツ）のみ。about/compare/contact/privacy等は対象外 |
| E | field `label` が一つも定義されていない | **確実**（全ファイル走査） | 全環境 |
| F | draft保存でも再検証通知が飛ぶ（1クリックで2回） | **確実**（コードで確認） | 全環境 |

---

## A. `ERROR 4073397010` の正体（症状2、および1・3の一部）

**2026-09-05 2回目改訂: 原因の重心を訂正した。** 当初「`pool.max` 未指定」を主因としたが、
**より確度の高い説明はpooler modeの退行**であることが、既存文書の参照で判明した。

### 決定的な過去記録

`docs/reference/task9-preview-rehearsal-preflight-v1.md`「pooler mode調査・解決（2026-08-23）」に、
**今回と一字一句同じ症状**が記録されている。

> Preview DATABASE_URL（session pooler、port 5432）に対して`npm run build`を実行すると、
> 複数routeで `(EMAXCONNSESSION) max clients reached in session mode - max clients are
> limited to pool_size: 15` で失敗した

このときの対処は `pool.max` の調整ではなく、**Vercel環境変数 `DATABASE_URL` をsession pooler
（5432）からtransaction pooler（6543）へ切り替えることだった**。切替後、24並列×2セットの
負荷試験・161ページの本番相当buildが**全てクリーンに成功**したと記録されている。

同文書は「Step 3（`pool.max`調整・Vercel同時実行数設計）は不要」と明記している。

### 私が「本番もPreviewも5432」と結論づけたのは、参照するファイルを間違えていた

2026-09-04の調査で `~/secrets/deploid-supabase-connections.txt` の `pooler` 行を読み、
本番とPreviewが両方5432であることを確認し、「ポートは差の説明にならない」と結論した。

**これは誤り。** `docs/reference/database-migration-runbook-v1.md:74` はこのファイルの
`pooler` 行を明示的に**「migration専用」**と述べている。Vercelアプリ実行時の `DATABASE_URL`
は**この参考ファイルには存在しない、別の値**であり、Secret型のため `vercel env pull` でも
`[SENSITIVE]` としてしか取得できない（2026-09-04に自分で確認済み）。

**つまり私は「migration用の値」を比較して「アプリ実行時の値」について結論していた。**
カテゴリーの取り違えであり、5432という一致は最初から何も証明していなかった。

### 現在の症状は診断的にsession modeを指し示す

`EMAXCONNSESSION ... max clients reached in **session mode**` というエラー文言自体が、
現在の接続がsession pooler（5432）であることの直接的な証拠になる。transaction pooler
（6543）ではこの種のエラー文言は出ない（8月23日の記録で6543切替後にこのエラーが消えたことと整合）。

**したがって、2026-08-23に完了したはずのtransaction poolerへの切替が、何らかの理由で
Previewにおいて失効している（session poolerへ戻っている）可能性が高い。** 何が起きたか
（再作成・再設定・別の変更による意図しない上書き等）は特定できていない。

### この節で確定できたこと・できなかったこと

| | 確度 |
|---|---|
| 現在Previewで`EMAXCONNSESSION`が実際に発生している | **確実**（実測） |
| そのエラー文言が"session mode"を指している | **確実**（実測） |
| 2026-08-23に同一症状がtransaction pooler切替で解消した実績がある | **確実**（既存文書） |
| **現在のPreview実行時DATABASE_URLがsession pooler(5432)に戻っている** | **推定・複数の状況証拠と整合するが、値そのものは未確認**（Secret型のため） |
| `pool.max`未指定であることが主因である | **証拠不十分**。pooler modeが原因なら`pool.max`調整は的外れになる |

### 未確認（次に測るべきこと）

- Preview の実行時 `DATABASE_URL` が今どちらのpoolerを指しているか。
  値を直接読む手段が無いため、**`task9-preview-rehearsal-preflight-v1.md`と同じ手法**
  （credential値を一切露出しない一時debug routeで `port`/`host種別`のみ返す）で確認する
- なぜ8月23日の切替が失効したか（原因は問わず、まず現在値を確定させる）

## B・C. 公開してもページが変わらない（症状1）

### B. 再検証の通知がVercelの保護に弾かれている

公開が成功すると、サーバーは自分自身の `/api/revalidate-content` へHTTPで通知する
（`lib/payload/revalidationHook.ts`）。この通知に対してVercelが**自分で401を返している**。

```
$ curl -X POST .../api/revalidate-content
{"error":{"message":"Protected deployment","code":"401"},
 "protection":{"vercel_auth_enabled":true, ...}}
```

我々のrouteなら `{"error":"unauthorized"}` を返す。**別物である。**

このフックは意図的に fail-open（通知が失敗しても公開自体は止めない）なので、
**公開は成功し、キャッシュだけが古いまま残る。**

本番は保護が無く、同じPOSTが我々のrouteに届く（実測: `deploid.net` は `{"error":"unauthorized"}` を返す）。
**したがってこの問題は Preview 固有。**

### C.（再訂正）bypassは実際に機能する。壊れていたのは検証コマンドの側

**2026-09-05、2回目の検証で確定した。** 前回「Cは撤回（推論が無効というだけで、動作は未確認）」
としたが、今回 **正しいトークンで再テストし、実際に機能することを確認した。**

原因は自分のシェルコマンドの誤りだった。トークンファイルは以下の構造を持つ。

```
# コメント行1
# コメント行2
# コメント行3
（空行）
<実トークン、32文字>
```

前回使った `tr -d '[:space:]' < file` は改行を含む全空白を除去するため、
**コメント行の文字とトークンが1本の174文字の壊れた文字列に結合されていた。**
この壊れた値をヘッダに入れていたので、Vercelの保護に弾かれ続けていたのは当然だった。

正しく最終行（コメント・空行を除く）だけを抽出して再テストすると:

```
$ curl -H "x-vercel-protection-bypass: <正しい32文字>" .../admin
HTTP/2 200                                    ← 保護を通過

$ curl -X POST -H "x-vercel-protection-bypass: <正しい32文字>" .../api/revalidate-content
{"error":"unauthorized"}                      ← Vercelではなく、我々のrouteの応答
```

2件目の応答が重要。`{"error":"unauthorized"}` は我々の `revalidate-content/route.ts` 自身が
返す文言であり、Vercelの `{"protection":{...}}` ではない。**bypassヘッダがVercelの保護層を
通過し、リクエストが実際に我々のNext.jsルートまで届いたことの直接証拠。**
（このテストでは署名ヘッダを送っていないため、ルート自身が401で拒否するのは正しい挙動）

さらに、Vercel Project API（読み取り専用、`GET /v9/projects/:id`）で確認したところ:

```json
"protectionBypass": { "<id>": { "scope": "automation-bypass", "isEnvVar": true, ... } }
```

`isEnvVar: true` は、この bypass secret が **`VERCEL_AUTOMATION_BYPASS_SECRET` として
ビルド/実行環境へ実際に注入される**ことを意味する。作成日時（2026-08-25T05:53 UTC）と
手元ファイルの保存日時（同日05:54 UTC、1分差）もほぼ一致しており、**手元のトークンは
最新かつ有効と考えられる。**

**結論: `7c18f0a` のbypassロジックは、正しい値が渡されれば機能する。**
D-1 の Option A（Protection Bypass for Automation を使う）は、
「有効性が未確定」ではなく**「機構としては動作を確認済み」**に格上げする。
残る不確実性は、`revalidationHook.ts` の内部fetchが実行時に
**同じ環境変数を実際に読めているか**（コード上は読む実装だが、実行時の値そのものは未確認）。

---

## D. 「ラグがある」の正体（症状1）

**2026-09-05 3回目改訂で訂正**: 「全ページ」は誤り。`about` / `compare` / `contact` / `privacy` は
`'use cache'` を使っていない（実測: 4ファイルとも0件）。動的コンテンツを持つページ（manufacturers・robots・use-cases等）が対象。以下はそれらのページの話。

対象ページは `'use cache'` + `cacheLife('hours')` を使っている。

```ts
// src/app/(frontend)/manufacturers/[slug]/page.tsx
'use cache';
cacheLife('hours');
cacheTag(contentTags.manufacturers);
```

`hours` プロファイルのNext.js定義値（`next/dist/server/config-shared.js:152-156`）:

| 項目 | 値 | 意味 |
|---|---|---|
| `stale` | 300秒（**5分**） | この間はクライアントに古い内容を返してよい |
| `revalidate` | 3600秒（**1時間**） | この間隔でサーバーが作り直す |
| `expire` | 86400秒（24時間） | これを超えたら必ず作り直す |

**「最大1時間で反映される」と書いたのは誤り（2026-09-05 訂正）。**

Next.jsの契約は stale-while-revalidate であり、`revalidate` は**反映の上限時間ではない**。

| 概念 | 実際の挙動 |
|---|---|
| `revalidate: 3600` | 1時間経過後の**次のアクセス**で、まず古い値を返し、裏で再生成を始める |
| `expire: 86400` | 無アクセス期間が続いた後の次のアクセスで**同期的に**再生成する |
| `revalidateTag(tag,'max')` | 即時反映ではない。次のアクセスから再生成が始まる |

つまり**アクセスが無ければ何時間経っても再生成されない**し、タグを無効化しても
**その直後の1リクエストで新しい内容が返る保証は無い**。

この性質は既存e2eにも現れている。`tests/e2e/cache-revalidation.spec.ts:78` は
1回の再取得ではなく**ポーリング**で収束を待っている。

「文句を言った後に見ると更新されている」は、アクセスによって再生成が進んだ結果と、
再デプロイによる全ページ再生成の両方で説明がつく。

さらに、再デプロイすると全ページがビルド時に作り直されるので、
**デプロイのたびに「まとめて反映された」ように見える。**

---

## 症状1が起きるまでの全体像

```
公開ボタンを押す
  ↓
① draft保存 → 成功（DBにversionが増える。「数字が上がる」のはこれ）
  ↓
② /api/admin/publish → 成功（main rowがpublishedになる。DBで実物を確認済み）
  ↓
③ 再検証の通知 → `7c18f0a` 前は Vercel の保護が401で失敗（B）
  ↓            → デプロイ後は成功しているとのレビュー報告あり（自己検証不能）
  ↓   ※ fail-open なので、失敗しても公開は成功のまま
  ↓
④ タグが無効化されても、それは「次のアクセスで再生成する」印にすぎない（D）
  ↓
⑤ アクセスが無い間は古いまま。再デプロイすれば全ページが作り直される
  ↓
（この間、接続が枯れていればページの再生成自体が失敗する（A））
```

### F. draft保存でも再検証通知が飛ぶ（**新規確認、レビュー指摘**）

公開UIは①draft保存（HTTP PATCH経由）→②公開（Local API経由）の2段構え。
`createRevalidationAfterChangeHook`（`revalidationHook.ts:114`）は
`req.context?.deferRevalidationUntilCommit` が真のときだけ通知を**飛ばす**。

この値は `publishApprovedVersion.ts:176` が **Local API呼び出し時にのみ** 設定する。
①のdraft保存はHTTP経由のPATCHであり、この値を持たない。**したがって①でも通知が飛ぶ。**

公開ボタン1クリックで再検証通知が**2回**（draft保存時・公開時）発生する計算になる。
1回目はまだ非公開のdraftに対する通知で、無駄である以上に、
**該当collectionのタグを公開前に無効化してしまう**（同じタグなので区別できない）。

**公開処理は3回とも成功していた**（`_manufacturers_v` と `manufacturers` の実データで確認）。
壊れているのは公開そのものではなく、その後の反映経路である。

---

## E. UIが分かりにくい（症状4・5）

### field の `label` が一つも定義されていない

全collectionと共有field定義を走査した結果:

| | 件数 |
|---|---|
| `label:` の総数 | 12 |
| そのうち **field** のラベル | **0** |
| 内訳 | すべて select の選択肢ラベル（`Content Reader` / `Active` / `Preview` 等）で、**全て英語** |

Payloadは `label` 未指定のとき、field名を英語として単語分割して表示する
（`payload/dist/utilities/formatLabels.js` の `toWords`）。

| field名 | 編集画面での表示 |
|---|---|
| `japanPresence` | Japan Presence |
| `whyItMatters` | Why It Matters |
| `companyType` | Company Type |
| `nextReviewBy` | Next Review By |

**これが「英語になってたりで分かりにくい」の直接の原因。**
admin本体（ボタン・メニュー）は日本語化されたが、**field名は翻訳の対象外**である。
i18nの翻訳表ではなく、field定義の `label` でしか変えられない。

### 項目が多く、構造が無い

**当初の項目数は誤り（2026-09-05 訂正）。** collection固有のfieldしか数えておらず、
`baseContentFields()` / `baseRecordContentFields()` 由来の共有fieldを落としていた。
外部レビューが実configを再帰走査した値を採る。

| collection | 可視トップレベル | 可視named全体 | 既存 `type: 'group'` |
|---|---|---|---|
| Robots | 32 | 72 | 4 |
| Manufacturers | 29 | 58 | 4 |
| Articles | 29 | 51 | 3 |
| UseCases | 28 | 66 | 5 |
| Distributors | 19 | 41 | 3 |
| Deployments | 19 | 43 | 4 |
| RobotSeries | 17 | 39 | 3 |

編集画面の構造化指定:

| 指定 | 件数 | 備考 |
|---|---|---|
| `admin.group`（左メニューのグループ化） | 0 | |
| `position: 'sidebar'` | 0 | |
| `type: 'tabs'` | 0 | |
| `type: 'collapsible'` | 0 | |
| `type: 'group'`（**データ構造**のグループ） | 対象7 collection+access.ts: **8件/5ファイル**。全collection+access.ts: **10件/7ファイル** | `heroImage` / `seo` / `headquarters` / `comparison` / `atAGlance` 等。**当初「構造化ゼロ」および「10件/6ファイル」は誤り。正確な内訳は次のとおり: Manufacturers 1 / Robots 1 / Deployments 1 / UseCases 2 / access.ts 3（対象内小計8/5ファイル）+ ArticlePlacements 1 / Media 1（全体10/7ファイル）** |
| `admin.description` | 20 | **開発者向けの実装メモが中心** |

つまり**30項目前後が一列に並んでいる**（一部は data group として入れ子）。
編集者が「どれが必須で、どれが重要で、どれが滅多に触らないものか」を判別する手がかりが画面上に無い。

**ラベル未定義は対象7 collection以外にもある**（レビュー報告）: `Admins` 1件、
`ArticlePlacements` 14件、`Media` 11件。「編集画面に英語が無い」を完了条件にするなら、
対象collectionを明示する必要がある。

`admin.description` の中身も、たとえばこうである:

> 日付のみの値。timestamptz にすると import 時の server TZ で日付がずれるため text
> （Task 5、詳細は lib/payload/access.ts の sourcesField）。

これは**実装の都合の説明**であって、編集者への案内ではない。

### ページのセクションとの対応が切れている

公開ページ側の見出しは、**別ファイルの定数**から来ている。

```tsx
// src/app/(frontend)/manufacturers/[slug]/page.tsx
title={uiText.manufacturers.robotsSection}
title={uiText.manufacturers.relatedReports}
```

`lib/uiText.ts` に日本語の見出しがあり、field名（英語）とは**何も繋がっていない**。
編集画面の「Why It Matters」がページのどの見出しの下に出るのかは、
**画面上のどこにも書かれていない。** コードを読まないと分からない。

---

## 本来どうあるべきか（設計の観点、実装はしない）

### 反映について

- **公開したら数秒〜十数秒で反映される**のが期待値。1時間待つのは運用として成立しない
- そのためには再検証の通知が確実に届く必要があり、Previewでは
  Vercelの保護をどう扱うかの決着が要る（コードだけでは閉じない）
- 反映は非同期なので、**編集者に「反映中」「反映済み」が見える**ことが望ましい。
  現在は公開が成功したことしか分からず、ページに出たかどうかは自分で見に行くしかない

### 接続について

- サーバーレスでは**1インスタンスが保持する接続数を明示的に絞る**のが定石。
  現在は無指定で、環境の許容量に依存している
- 上限に当たったとき、いまは**画面が壊れる**。編集中の内容を失う形の失敗は避けたい

### UIについて

- field名は**編集者の言葉**であるべきで、実装の識別子をそのまま見せるものではない
- 20項目を平坦に並べるのではなく、**必須・重要・詳細**の区別が画面で分かること
- 編集している項目が**ページのどこに出るのか**が分かること
- `admin.description` は編集者への案内に使い、実装メモはコードのコメントに置くこと

---

## G. Preview `DATABASE_URL` の変更履歴（**2026-09-05 3回目改訂で新規追加**）

Vercel Activity Log（read-only、`GET /v3/events`）と `GET /v9/projects/:id/env`（read-only、
値は取得せずmetadataのみ）で追跡した。**値そのものは一度も表示・出力していない。**

### 確定した事実

| 時刻（JST） | イベント |
|---|---|
| 2026-08-25 15:13:16 | Preview `DATABASE_URL` を追加 |
| 2026-08-25 16:14:13 | Production `DATABASE_URL` を追加 |
| **2026-08-25 22:43:24** | Preview `DATABASE_URL` を削除 |
| **2026-08-25 22:43:27** | Preview `DATABASE_URL` を再追加 |

commit `67b90e8`（22:47、3分後）が同じ操作を記録している:

> 同日PR Previewの再デプロイで、Supabaseパスワード更新後に残っていたPreview側`DATABASE_URL`の
> 旧値を検出した。Preview環境変数を最新のtransaction-pooler接続文字列へ更新し、再デプロイを開始済み。

`GET /v9/projects/:id/env` で確認すると、Preview用 `DATABASE_URL` は**1本だけ**存在し
（`gitBranch: null` = 全Previewブランチ共通、branch別上書きは無し）、
`updatedAt` は 22:43:27 の1回のみ。**この値は現在まで一度も変更されていない。**

### ここから言えること・言えないこと

| | 内容 |
|---|---|
| **確定** | 8/25 22:43 の変更が、現在Previewが使っている唯一のDATABASE_URL設定である |
| **確定** | それ以降、この変数は一度も変更されていない |
| commit の記述 | 「transaction-pooler接続文字列へ更新」——**意図は6543** |
| **未確定** | 実際に入力された値のポートが本当に6543だったか |

**矛盾がある。** 8/25 22:43 の変更が記述どおり6543なら、以後変更が無い以上、現在も6543の
はずである。しかし2026-09-04〜05に観測している`EMAXCONNSESSION ... session mode`は
session pooler(5432)固有の文言であり、`task9-preview-rehearsal-preflight-v1.md`の記録では
6543切替後にこのエラーは消えている。

**最有力の説明（推定）**: 8/25 22:43 の再入力時、意図（6543）と実際に貼り付けた値が食い違った。
`~/secrets/deploid-supabase-connections.txt` には`pooler`行として**5432の値だけ**が
保存されており、6543の値はどこにも保存されていない。修正作業者が「pooler接続文字列」を
このファイルからコピーした場合、**意図せず5432を貼ってしまう経路が実在する。**

**これは検証済みの事実ではなく、状況証拠から導いた仮説である。** 確定させるには
実際のポート番号を読む必要があり、値がSecret型のため、
`task9-preview-rehearsal-preflight-v1.md`と同じ手法（credential非露出の一時debug route）
以外に確認手段が無い。

---

## まだ確認できていないこと

| 項目 | なぜ確認できないか | 有力な仮説 |
|---|---|---|
| Preview `DATABASE_URL` の実際のポート | Secret型。debug route以外に手段が無い | 8/25 22:43の入力ミスで5432のまま（上記G節） |
| Supabase の Supavisor `pool_size` の実設定値 | ダッシュボードでしか見えない | 15（`task9-preview-rehearsal`の実測と一致） |
| `revalidationHook.ts`の内部fetchが実行時にbypass secretを読めているか | 実行時のenv var自体は確認したが、fetch呼び出し内でのアクセスは未実測 | 読めている可能性が高い（`isEnvVar:true`確認済み） |
| 本番が同条件で枯渇しないか | 本番で負荷をかける検証は行っていない | 未定 |
| 再検証の通知が実際に成功しているか | 保護に弾かれる問題は解消見込みだが、成功ログの直接観測はまだ | 未定 |

---

## この調査で判明した、私自身の誤り（改訂履歴）

複数回のレビューを経て、以下の誤りを段階的に訂正した。**古い誤りも消さずに残す**——
何を、なぜ間違えたかが、次に同じ間違いを避ける手がかりになるため。

| ラウンド | 誤り | 実際 |
|---|---|---|
| 1回目 | 「`find`+`draft=true`はfield pathが噛み合わず0件」 | アクセス制御が原因。`page.request`がauth cookieを運ばないことが真因 |
| 1回目 | 「日本語訳を書けば表示される」（`supportedLanguages`未設定のまま） | Payload既定は`{en}`のみ。一度も表示されていなかった |
| 2回目 | 「Previewだけsession modeで本番はtransaction mode」 | **migration専用ファイルの値を比較していた**（アプリ実行時DATABASE_URLは別の、読めない値） |
| 2回目 | 「bypass修正はPreviewで無効」 | 検証コマンドで送っていたトークンが `tr -d` のバグで壊れていた。正しく送ると機能する |
| 2回目 | 「最大1時間で反映される」 | stale-while-revalidateの契約を誤解。アクセスが無ければ再生成されない |
| 2回目 | 「構造化ゼロ」「10件/6ファイル」 | `type:'group'`は既に存在（対象7collection+access.ts: 8件/5ファイル。全体: 10件/7ファイル） |
| **3回目** | 「pool.max未指定が主因」 | **pooler modeの退行（8/25 22:43の変更に起因する疑い）が主因候補**。pool.maxは二次要因 |
| **3回目** | 「全ページがuse cache」 | about/compare/contact/privacyは使っていない |
| **3回目** | draft保存は通知に関係しない（黙って見落とし） | draft保存（HTTP PATCH）は`deferRevalidationUntilCommit`を持たず、公開と合わせて1クリックで通知が2回飛ぶ |

**回数が多いことについて**: 各ラウンドで指摘を鵜呑みにせず実コード・実ログ・実APIで検証し、
検証できたものだけを確定として扱ってきた。その過程で自分の検証コマンド自体のバグ
（`tr -d`の結合事故）も1件見つかっている。
