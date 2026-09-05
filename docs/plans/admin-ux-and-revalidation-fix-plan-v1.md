---
status: plan
updated: 2026-09-05
---

# Admin運用の5症状に対する修正計画

前提: `docs/plans/admin-ux-and-revalidation-investigation-v1.md`

**この文書の時点では実装しない。** 決定事項（§3）を確定させてから着手する。
`ai/rules/10-workflow.md` §1 / §1.1 の要求形式に従う。

## 2026-09-05 改訂（外部レビュー Request changes を反映）

初版はレビューで **Blocker 5件 / High 3件 / Medium 1件** を受けた。全件を検証し、
**9件すべてを妥当と判断して反映した**。却下した指摘は無い。

| # | 指摘 | 自己検証 | 反映先 |
|---|---|---|---|
| 1 | 「bypass無効」は現在の事実でない | **検証不能**（`vercel logs` は履歴を返さない）。ただし**推論自体が無効**だったことは自分で確認 | C撤回。D-1 を「有効性はレビュー報告あり・要再確認」へ |
| 2 | 「通知なしでも最大1時間」は誤り | **確認**（stale-while-revalidate。既存e2eもポーリングしている） | T3 を SLO 設計へ変更 |
| 3 | T1 が原因と対策を過剰に確定 | **確認**（`pg-pool` 既定は `max:10` / `idleTimeoutMillis:10000`。idle接続は返却済みで正常） | T1 を接続予算＋負荷試験へ全面改訂 |
| 4 | T2 は記載Filesだけでは実装不能 | **確認**（通知結果は `Promise<void>` で消える。route も documentId しか返さない） | T2 の Files を5ファイル＋テストへ |
| 5 | T5 は「labels.ts不変」では完了不能 | **確認**（select値121種のうち **29件**が labels.ts に無い。うち2件は選択肢ラベルなので実質27件） | T5 に「正本を補完する」を追加 |
| 6 | field inventory が共有fieldと既存groupを数えていない | **確認**（`type: 'group'` は6ファイルに10件存在） | 調査書の数表を差し替え |
| 7 | ja/en 契約を壊す | **確認**（`supportedLanguages: { en, ja }` を自分で入れた。`label` は `StaticLabel` でlocalize可能） | D-4 を新設 |
| 8 | T8 では cached HTML への反映を証明できない | **確認**（既存e2eは Payload REST を読んでおり、Nextのcached HTMLを通らない） | T8 を改訂 |
| 9 | doc運用ルールの不整合 | **確認**（`80-doc-governance.md:30-36` は `status` / `updated` を要求） | 両文書の frontmatter を修正 |

**#1（1回目レビュー）について**: 当時取得できなかった `vercel logs` の履歴は、
2回目レビューへの対応で再検証した。結論は下記「2026-09-05 3回目改訂」を参照
（bypass機構は実際に動作することを直接確認した。一方DB枯渇の主因はpool.maxではなく
pooler modeの退行である可能性が高いことが判明した）。

## 2026-09-05 3回目改訂（2回目レビュー Request changes を反映）

2回目レビューで **Blocker 2件 / High 4件 / Medium 1件**。全件検証し、全件を妥当と判断した。

| # | 指摘 | 自己検証で分かったこと | 反映 |
|---|---|---|---|
| 1 | DB枯渇の主因はpool.maxでなくpooler mode退行 | **確認**。`task9-preview-rehearsal-preflight-v1.md` に2026-08-23の同一症状＋transaction pooler(6543)切替で解消した実績があった。前回「本番もPreviewも5432」は**migration専用ファイルを比較していた誤り**（アプリ実行時DATABASE_URLはSecret型で別値、読めない） | T0/T1 を全面差し替え |
| 2 | SLOが `revalidateTag(tag,'max')` の意味論では保証不能 | **確認**。既に前回「stale-while-revalidate」に訂正済みだったが、D-2のSLO文言が「初回アクセスで新内容」のままだった不整合を修正 | D-2/T3 の文言修正 |
| 3 | draft保存で不要な再検証通知 | **確認**。`deferRevalidationUntilCommit` は Local API 経由の公開処理でのみ設定され、draft保存（HTTP PATCH）には付かない。1クリックで通知が2回飛ぶ | T2 に追加 |
| 4 | vercel logsの履歴取得・bypass設定確認 | **一部確認**。`--since`/`--until` は実在したが、実行して30秒待っても出力が得られず有効性は確定できなかった（前回の「不可能」は言い過ぎだった）。**Vercel Project API（読み取り専用）でbypass設定を直接確認でき**、`isEnvVar:true` を確認した。さらに**bypassヘッダを正しいトークンで送ると実際に機能する**ことも確認した——前回の失敗は自分の `tr -d` コマンドがコメント行とトークンを結合していたバグだった | C節を再訂正。D-1 の確度を上げた |
| 5 | T1のエラーがmapPublishError()に届かない | **確認**。`getPayload()` はtry/catchの外（`route.ts:73`、後続のtry/catchは`publishFromAdmin`呼び出しのみを囲む） | T1 のFilesにroute.tsを追加 |
| 6 | T4/T5の対象範囲・言語契約が未確定 | **確認**。`lib/labels.ts` は全件日本語のみ（英語版が無い） | D-4/T4/T5 に反映 |
| 7 | 測定手順・doc手順の不備 | **確認**（group数の不一致、docs/README未登録など） | 各所修正 |

**却下した指摘は無い。**


---

## 2026-09-05 4回目改訂（3回目レビュー Request changes を反映）

3回目レビューで **Blocker 2件 / High 3件 / Medium 2件**。全件検証し、全件妥当と判断した。
**却下した指摘は無い。**

| # | 指摘 | 自己検証 | 反映先 |
|---|---|---|---|
| 1 | 「退行原因を調べない」が不誠実。Activity Logで追跡できる | **確認・実施**。Vercel Activity API（read-only）で追跡し、**2026-08-25 22:43:24/27 JSTのPreview `DATABASE_URL`削除→再追加を秒単位で特定**。commit `67b90e8`が「transaction-poolerへ更新」と記録。以後この変数は未変更（`GET /v9/projects/:id/env`のupdatedAtで確認）。**矛盾点も判明**: 記録どおり6543なら現在も6543のはずだが、現在の症状はsession mode固有の文言。最有力仮説として「入力ミス」を追記 | investigation.md「G節」新設。T0/T1を全面差し替え |
| 2 | 調査書内で結論が正反対（新旧混在） | **確認**。末尾2節が1回目の内容のまま放置されていた | 末尾2節を全面差し替え。改訂履歴として古い誤りも残しつつ、現在の結論と分離 |
| 3 | T1の分岐・Files・テストが不整合 | **確認**。`adminPublishErrors.ts`/`adminPublishMessages.ts`がFilesに無く、既存テストはmapperのみでroute自体を組み立てていない | T1のFilesと検証を拡張 |
| 4 | T2のdraft抑制が`ArticlePlacements`/`Media`/`SiteSettings`を覆っていない | **確認**（コードで確認: `revalidationHook.ts:115`、`ArticlePlacements.ts:107`、`Media.ts:31`、`SiteSettings.ts:27`）。T2がT0前提になっている矛盾も確認 | T2にケース別マトリクスを追加。T0依存を削除 |
| 5 | T4/T5の対象範囲・ja/en方式が未決定 | **確認**。`SiteSettings`がFilesに無い。`lib/labels.ts`は日本語のみ | D-5を新設。T4/T5のFilesと完了条件を確定 |
| 6 | 数値インベントリ・use cache対象が不正確 | **確認**。`about`/`compare`/`contact`/`privacy`は`'use cache'`を使わない（実測）。group数の記載箇所ズレ | investigation.md・本文の両方を修正 |
| 7 | 検証ゲートが実効性を持たない | **確認**。knipは`src/app/**/route.ts`を明示entry化しており、残存debug routeをdead code判定しない | ゲートを`test !e`方式に変更。T8の数値を明記 |

## 2026-09-05 5回目改訂（4回目レビュー Request changes を反映）

4回目レビューで **Blocker 1件 / High 4件 / Medium 3件**。全件検証し、全件妥当と判断した。
**却下した指摘は無い。**

| # | 指摘 | 自己検証 | 反映先 |
|---|---|---|---|
| 1 | T0のdebug routeが`_debug`でprivate folder扱いされ動作しない | **確認**。`next/dist/build/route-discovery.js:97`の`ignorePartFilter: (part)=>part.startsWith('_')`で確定。Next.js公式仕様どおり | パスを`src/app/api/admin/debug-db-pool/route.ts`へ変更（全箇所） |
| 2 | T0/T1の分岐がまだ矛盾。6543確定時にpool.maxへ短絡している | **確認**。「pool.max未指定×負荷」はtransaction確定時にも**まだ検証されていない仮説**だった | T1で「transaction確定時は過去の失敗deploymentのenv snapshotとログを再照合してから」に変更。T0の分岐説明も「消去法で確定」と明記 |
| 3 | T4のnested/array除外で英語表示が大量に残る | **確認**（`sources`配列内の`title`/`url`等、実例で確認）。レビューの208件は自分の静的走査（197件相当）とも整合する規模 | 「nested/arrayを対象外」を撤回し、対象に含める設計へ変更 |
| 4 | T5がArticlePlacementsを含んでいない。`hero`衝突 | **確認**（`ArticlePlacements.slot`の`hero`と`imageRoleLabels.hero`はキーが同じだが意味が違う） | T5にArticlePlacements追加。field別Record対応表を新設し`hero`の別ラベルを明記 |
| 5 | T1のエラー境界がgetPayload()だけでは不足 | **確認**。`authenticatePublisher`は`payload.auth()`の全例外を意図的に401へ畳み込む設計（`publishRequestAuth.ts`のコメントで確認）。draft PATCHはPayload標準RESTで我々のroute外 | T1を4境界（①②③④）に分解。②を追加対応、③はT8の手動確認へ、新エラーコードは作らず既存`publish-temporarily-unavailable`を再利用 |
| 6 | 本文と後半の訂正が非同期（121/2件/10-6/ArticlePlacements対象外/labels.ts変更） | **確認**（全箇所該当） | §2数値表を「固定値を書かない」方針へ変更。§8影響範囲の矛盾を修正 |
| 7 | T3/T6/T7の成果物ファイル名が未指定 | **確認** | `docs/decisions/`配下に3つの正本ファイル名を確定 |
| 8 | 負荷試験「計24」が48と誤読されうる。一定期間の値が不統一 | **確認** | 「それぞれ12リクエストずつ、合計24」に統一。全箇所を「5分」に統一 |

## 1. 目的

編集者が **admin で編集 → 公開 → 合意した時間内にページへ反映** を、
**画面が落ちず、何が起きたか分かる状態で** 行えるようにする。

| # | 原因 | 状態 | 対応task |
|---|---|---|---|
| A | Postgres接続の枯渇。**主因はpooler modeの退行（疑い）**、pool.max未指定は二次要因 | pooler mode退行は状況証拠で強く示唆、値そのものは未確認 | T0 → T1 |
| B | 再検証webhookがVercelの保護に弾かれる | `7c18f0a` 前は確定。以後は**機構としては動作確認済み**（bypass実測成功） | T2 |
| C | ~~bypass修正が無効~~ | **撤回**（自分のシェルコマンドのバグだった。実際は機能する） | — |
| D | キャッシュが stale-while-revalidate | 確定 | T3 |
| E | field `label` 0件・編集画面の構造化不足 | 確定（既存groupは一部あり） | T4〜T7 |
| F | draft保存でも再検証通知が飛ぶ（**新規**） | 確定（コードで確認） | T2 |

**「反映されない」を1つの原因に帰着させない。** A（再生成の失敗）、B（タグ無効化の失敗）、
D（アクセスが無ければ再生成されない）は独立に効く。どれか1つを直しても症状は残りうる。

---

## 2. インベントリ（`10-workflow.md` §1.1）

### 調査したファイル

| 種別 | ファイル | 分かったこと |
|---|---|---|
| 接続 | `payload.config.ts:66` | `pool` に `max` 指定なし |
| 接続 | `node_modules/pg-pool/index.js:89,98-99` | 既定は `max=10` / `idleTimeoutMillis=10000` |
| 再検証 | `lib/payload/revalidationHook.ts:58` | 通知関数は `Promise<void>`。**結果がここで消える** |
| 再検証 | `lib/payload/publishApprovedVersion.ts:40,190` | 結果型に再検証状態が無い。commit後の通知結果を返していない |
| 再検証 | `src/app/api/admin/publish/route.ts:101` | `documentId` しか返さない |
| 再検証 | `components/admin/PublishFromApproval.tsx:124` | 成功bodyを読まず固定toast |
| 再検証 | `src/app/api/revalidate-content/route.ts:26,33` | `revalidateTag(tag,'max')` + 成功ログ |
| キャッシュ | `src/app/(frontend)/manufacturers/[slug]/page.tsx:93-96` | `'use cache'` + `cacheLife('hours')` + `cacheTag` |
| キャッシュ | `tests/e2e/cache-revalidation.spec.ts:78` | **既存e2eはポーリングで収束を待っている**（1リクエストでは保証されない） |
| ラベル | `lib/labels.ts` | enum値の日本語ラベルの正本。**ただし全selectを覆っていない（下記）** |
| schema | `collections/*.ts`, `lib/payload/access.ts` | field `label` 0件 / `tabs`・`collapsible`・`sidebar` 0件 / **`type: 'group'` は10件存在** |
| i18n | `payload.config.ts:53` | `supportedLanguages: { en, ja }`。**日本語のみのラベルは英語localeを壊す** |

### 実測した数値（計画の前提。2026-09-05 5回目改訂で最新化）

**この数値は実装の根拠にしない。** 測定方法（静的正規表現 vs 実行時Payload config走査、
対象collectionにArticlePlacementsを含むか等）によって数がずれることが3回のレビューで
繰り返し判明したため、**T4/T5では固定の件数を completion condition にせず、
「対象configから機械算出し、1件でも変化したらテストが検出する」方式にした。**
以下は経緯の記録として残す。

| 項目 | 値 | 取得方法 | 備考 |
|---|---|---|---|
| select値（ユニーク、7collection+access.ts） | 自分の正規表現走査で121、外部レビューのランタイム走査で119（sanitize後121、`_status`分+2） | 方式により変動 | 測定方法の違いによる差は解消していない |
| select値（ArticlePlacements込み） | 自分の走査で125、外部レビューで123 | 同上 | T5で対象に追加 |
| `lib/labels.ts` に無い値 | 29件（うち2件は`_status`＝Payload組み込み、アプリが補うのは27件） | 正規表現走査 | `_status`分は対象外（T5参照） |
| `type: 'group'` | 対象7collection+access.ts: 8件/5ファイル。全collection+access.ts: 10件/7ファイル | `grep -c` | T6で新規追加はしない前提 |
| nested/array field（hidden除く、編集者可視） | **208件**（外部レビューのランタイム再帰走査） | レビュー報告。自分の静的走査（197件、粗い推定）でも同程度の規模を確認 | T4で対象に含める（前回「対象外」としたのは撤回） |
| ラベル未定義の対象外collection | `Admins` 1 / `Media` 11 | レビュー報告 | `ArticlePlacements`はT4/T5で対象に追加済みのためここから除外 |

### 再利用する既存コード

| 既存 | 用途 | 備考 |
|---|---|---|
| `lib/labels.ts` | select選択肢の日本語ラベル | **覆えるものだけ再利用**。不足27値は T5 で正本を補う |
| `lib/uiText.ts` | 公開ページの見出し | T7 の対応表で参照（変更しない） |
| `lib/content/cacheTags.ts` | タグ名 | 既に正本。増やさない |
| `lib/payload/adminPublishMessages.ts` | admin文言の型付き正本 | T2 の文言はここへ追加 |

### 変更しないファイル

- `lib/payload/publishAuthorization.ts`（認可）
- `createPublishGateHook`（`lib/payload/access.ts` の公開ゲート本体）
- `lib/content/domainTypes.ts` / `payloadMappers.ts`
- `lib/uiText.ts`
- `migrations/`（T4〜T7 は DB schema に影響させない）

**注意**: 初版は `publishApprovedVersion.ts` を「変更しない」に入れていたが、
T2 の実装には**変更が必須**であるため除外した（矛盾を解消）。

---

## 3. 先に決めること

### D-1. Preview で再検証を届かせる方法

**2026-09-05再訂正**: 前回「bypassは無効」→「無効という結論は撤回（未確定）」としたが、
今回**正しいトークンで再テストし、実際に機能することを直接確認した**
（`curl`でVercel保護を突破し、我々のrouteへ到達。応答が`{"error":"unauthorized"}`——
Vercelの保護応答ではなく我々のroute自身の応答であることで確認）。
Vercel Project APIでも`protectionBypass.isEnvVar: true`を確認済み。

| | 内容 | 状態 |
|---|---|---|
| **A（推奨・機構は動作確認済み）** | Protection Bypass for Automation。`7c18f0a`のヘッダロジックは正しい値で機能する | 残る不確実性は「`revalidationHook.ts`の内部fetchが実行時に同じ環境変数を読めているか」のみ |
| B | `revalidateTag`を内部から直接呼ぶ経路 | **却下**（`revalidationHook.ts`冒頭が明示的に否定） |
| C | Preview保護を無効化 | **却下** |
| D | Trusted Sources（OIDC） | 将来の選択肢として記録 |

**決めること**: A の残る不確実性（実行時env var）をT0/T2で実測確定させてよいか。

### D-2. 反映時間の目標（SLO）

初版は「最大1時間」と書いたが**誤り**。Next.js は stale-while-revalidate で、
`revalidate` は上限時間ではない。**アクセスが無ければ再生成されない。**

決めるべきは「何を約束するか」であって `cacheLife` の数字ではない。

| | 内容 |
|---|---|
| **A（推奨）** | 「通知が200を返した後、**ポーリングで**30秒以内に新内容へ収束する」を SLO とする。`revalidateTag(tag,'max')`は初回アクセスでの反映を保証しないため、**「初回アクセスで返る」とは書かない**。`cacheLife` は据え置き |
| B | `cacheLife` を短縮する | **非推奨**。アクセスがある場合に再生成機会が増えるだけで、A の接続枯渇と競合する。初版の「DBアクセス12倍」は不正確な表現だった（総量が常に12倍になるわけではない） |

**決めること: SLO の値（30秒でよいか）。**

### D-3. admin ラベルの正本

| | 内容 |
|---|---|
| **A（推奨）** | `lib/payload/adminFieldLabels.ts` に集約し、`collections/*.ts` は参照のみ |
| B | 各fieldに直接書く | 7ファイルに日本語が散り、表記ゆれを検出できない |

### D-4. ラベルの言語（**新設・レビュー指摘7**）

`payload.config.ts:53` で `supportedLanguages: { en, ja }` を明示している（私が入れた）。
日本語のみの `label` を付けると、**英語localeで日本語が出る**。
Payload の `label` は `StaticLabel` としてlocalize可能。

| | 内容 |
|---|---|
| **A（推奨）** | `{ ja: '国内入手性', en: 'Japan availability' }` の形で両言語を持つ | 既存の ja/en 契約と整合 |
| B | admin を日本語専用にし、`supportedLanguages` から `en` を外す | 契約変更。英語話者が編集する可能性を捨てる判断が要る |

**決めること: A か B か。** Bを選ぶなら `payload.config.ts` の変更も含める。

### D-5. admin用ラベルの言語別正本をどこに置くか（**新設・レビュー指摘5**）

`lib/labels.ts` は**公開サイト専用の日本語のみの `Record<型, string>`**
（例: `imageRoleLabels: Record<ImageRole, string>`）。D-4でAを選ぶ場合、
adminには`{ja, en}`両方が要るが、それをそのまま`lib/labels.ts`に混ぜると
**公開サイト側の型・表示に影響する**（`lib/labels.ts`は公開ページが直接importして使っている）。

| | 内容 | 利点 | 欠点 |
|---|---|---|---|
| **A（推奨）** | `lib/payload/adminSelectLabels.ts` を新設し、`{ value, label: { ja, en } }` 形式で保持。**値（`value`）は`lib/labels.ts`のキー集合と一致させ、日本語ラベルは`lib/labels.ts`の値を転記せず関数経由で参照する**（表記ゆれ防止）。英語ラベルのみこの新設ファイルが正本になる | `lib/labels.ts`の型・公開側表示は無傷。ja/en両方をadmin側だけで完結 | 新設ファイルが増える |
| B | `lib/labels.ts` の各Recordを `Record<型, {ja:string; en:string}>` へ拡張する | 正本が1箇所 | **公開サイト側の全呼び出し箇所を書き換える必要がある**。影響範囲が本計画のスコープを超える |

**推奨: A。** Bは公開サイトの表示ロジックまで踏み込む変更になり、
「実装しないこと」（公開ページのデザイン変更をしない）と矛盾する。

**決めること: A で進めてよいか。**

---

## 4. Tasks

1 task = 1 commit。

### T0. Previewの実行時DATABASE_URLの実ポートを確定させる（**優先度最上位**）

**Files**: 一時debug route（`src/app/api/admin/debug-db-pool/route.ts`、**検証後に削除必須**）,
`docs/reference/task9-preview-rehearsal-preflight-v1.md`（追記）

**2026-09-05 5回目改訂で訂正**: 当初 `src/app/api/_debug/db-pool/route.ts` としていたが、
**`_`で始まるディレクトリはNext.jsのprivate folderで、route探索から除外される**
（`next/dist/build/route-discovery.js:97` の `ignorePartFilter: (part) => part.startsWith('_')`
で確認。Next.js公式ドキュメントの仕様どおり）。このままではdebug route自体がURLとして
公開されず、T0が実行不能だった。**`src/app/api/admin/debug-db-pool/route.ts`
（アンダースコア無し、既存の`admin/publish`と同じ命名規則）へ変更した。**

**問題（2026-09-05 4回目改訂で精緻化）**: Vercel Activity Log（read-only API）を追跡した結果、
以下が**事実として確定**している。

- 2026-08-25 22:43:24 JST: Preview `DATABASE_URL` 削除
- 2026-08-25 22:43:27 JST: Preview `DATABASE_URL` 再追加
- commit `67b90e8`（22:47）: 「transaction-pooler接続文字列へ更新」と記録
- `GET /v9/projects/:id/env` で確認: Preview用は現在もこの1本のみ（`gitBranch: null`、
  branch別上書き無し）、`updatedAt` は22:43:27のまま変化なし

**矛盾**: 記録どおり22:43の変更が6543なら、以後変更が無い以上、現在も6543のはずである。
しかし現在観測している `EMAXCONNSESSION ... session mode` は session pooler(5432) 固有の
文言で、`task9-preview-rehearsal-preflight-v1.md` の実測では6543化後にこのエラーは消えている。

**最有力仮説（未確定）**: 22:43の再入力時、意図（6543）と実際に貼り付けた値が食い違った。
`~/secrets/deploid-supabase-connections.txt` には5432の値だけが保存されており、
6543の値はどこにも保存されていない。修正作業者がこのファイルから値を貼った場合、
意図せず5432を貼ってしまう経路が実在する。

**これ以上の追跡はActivity Log/API（read-only）では不可能。** 残る確認は
「実際に設定されている値のポート番号」のみで、Secret型のため直接読む手段が無い。

**やること**:
- `task9-preview-rehearsal-preflight-v1.md` が使った手法をそのまま踏襲する:
  credential値を一切露出しない一時debug routeを作り、
  `process.env.DATABASE_URL` をFunction内でparseして **port・host種別だけ** を返す
- Previewへデプロイし、`{"port": "...", "hostKind": "...", "poolerMode": "..."}` を確認する
- **確認後は必ずこのrouteを削除する。** 削除漏れは `test ! -e src/app/api/admin/debug-db-pool/route.ts`
  で機械的に検出する（knipのdead-code検知には頼らない。§6ゲート参照）
- 結果を `task9-preview-rehearsal-preflight-v1.md` に追記し、8/25の記録と接続する

**完了条件**: 現在のPreview実行時DATABASE_URLのポートが判明し、debug routeが削除されている

**✅ 2026-09-05実施済み**: debug routeで確認した結果 `poolerMode: "session"`（5432）。
Activity Logで8/25 22:43以降DATABASE_URLの変更が無いことを確認済みのため、
「8/25 22:43の再追加が退行点」と確定。debug routeは削除済み
（`task9-preview-rehearsal-preflight-v1.md`に結果追記済み）。

**分岐（2026-09-05 5回目改訂で明確化）**:
- **session(5432)だった場合（実際にこちら）**: 「8/25 22:43の再追加が退行点」と**確定する**
  （それ以外に変更イベントが無いことをActivity Logで確認済みのため、消去法で確定できる）。
  T1は**transaction poolerへ戻す**（8/25の意図どおりの値へ、今度こそ正しく設定する）
- **transaction(6543)だった場合**: **「pool.max未指定 × 負荷」という仮説を、
  ここで初めて検証対象にする。** 現時点ではこれも未検証の仮説にすぎない。
  具体的には、`EMAXCONNSESSION`が実際に発生した過去のdeployment
  （`db5b3eb`のビルド失敗、17:27のページ表示不能）について、
  **そのdeploymentが使っていた環境変数のスナップショットとログ時刻を再照合し**、
  「6543なのにsession mode相当のエラーが出た」経路が実在するかを調べ直す
  （例: 一時的にsession poolerへフォールバックする挙動がSupabase側にある、
  当時のdeploymentだけ別のDATABASE_URLを掴んでいた、等）。
  **`pool.max`の実装はこの再照合が終わってから着手する**（原因を素通りして
  対症療法だけ実装しない）

---

### T1. pooler modeを正しい状態へ戻し、DB接続失敗の4つの境界を正しく扱う

**Files**（session/transaction分岐で一部異なる）:
- **共通**: `src/app/api/admin/publish/route.ts`（`getPayload()`用try/catch追加、
  `authenticatePublisher`のDB失敗を区別する分岐を追加）,
  `lib/payload/publishRequestAuth.ts`（DB接続失敗を検出して呼び出し元へ伝える）,
  `lib/payload/adminPublishErrors.ts`（**新規コード追加ではなく既存`publish-temporarily-unavailable`
  を再利用する**よう写像を拡張）,
  `tests/content/admin-publish-route.test.ts`（**route自体を組み立てて`getPayload()`失敗・
  認証時DB失敗を再現するテストを追加。既存テストは`mapPublishError`単体しか呼んでおらず、
  routeのtry/catchの有無を検証できていない**）
- **session(5432)と確定した場合のみ追加**: Vercel環境変数`DATABASE_URL`(Preview)の変更
  （ユーザー操作）
- **transaction(6543)だった場合のみ追加**: 過去の失敗deploymentのenv snapshot・ログ再照合
  （下記参照）。その結果次第で`payload.config.ts` + `tests/content/payload-pool-config.test.ts`

**問題（2026-09-05 5回目改訂で精緻化）**: `getPayload()`が`route.ts:73`でtry/catchの外にある
ことに加えて、**DB接続失敗が起きうる境界は4箇所あり、それぞれ現在の挙動が異なる**。

| # | 境界 | 現在の挙動 | 問題 |
|---|---|---|---|
| ① | `getPayload()`（route初期化） | try/catch無し。生の`digest`エラーがそのまま出る | 編集者に意味不明なエラー |
| ② | `authenticatePublisher()`内の`payload.auth()` | **意図的に**全例外を401「unauthenticated」へ畳み込む（`publishRequestAuth.ts:63`のコメント参照） | DB接続失敗が「ログイン切れ」と誤表示される |
| ③ | draft保存のPATCH（フェーズ①、Payload標準REST） | `components/admin/PublishFromApproval.tsx:90-91`。**我々のrouteの外**、Payload自身のREST handler | Payload自身のエラー表示に依存。本計画のスコープでは書き換えない（Payloadの内部機構） |
| ④ | 公開serviceの内部（`publishFromAdmin`呼び出し） | 既存の`mapPublishError()`が処理。`publish-lock-unavailable`等は既に503にマップ済み | 対応済み |

**②が特に重要。** `publishRequestAuth.ts`のコメントは「session storeの不調で500を返すより、
`unauthenticated`として扱うほうが呼び出し側の分岐が単純になる」という**意図的な設計判断**
として書かれている。しかしこれは「DB接続自体が失敗した」場合と「トークンが本当に無効」な
場合を区別できていない。編集者は再ログインしても直らず混乱する。

**新しいエラーコードは作らない。** `adminPublishErrors.ts:75`に既に
`publish-temporarily-unavailable`（503）が存在し、ja/en文言も揃っている。
①②のDB接続失敗はこれへ写像する。

**変更内容**:
1. T0の分岐に従いpooler modeを是正する（またはtransactionのまま維持する）
2. `route.ts`の`POST`ハンドラで`getPayload()`をtry/catchし、
   失敗を既存の`publish-temporarily-unavailable`（503）へ写像する
3. `authenticatePublisher()`を、DB接続失敗（Postgresの接続エラーであることを検出できる場合）と
   純粋な未認証・トークン無効を区別できる形へ変更する。DB接続失敗は503、それ以外は
   従来どおり401とする
4. ③（draft PATCH失敗）は**コード変更せず、T8の手動確認項目として明記する**——
   Payload標準REST機構のエラー表示を書き換えることは本計画のスコープを超える
5. **session(5432)だった場合のみ** `pool.max`を評価する。8/23の記録が
   「transaction poolerに戻せばpool.max調整は不要」としているため、**まずpooler是正だけで
   様子を見て、それでも枯渇するときだけpool.maxに進む**（過剰設計をしない）
6. **transaction(6543)だった場合**、`pool.max`実装に進む前に、過去の失敗事例
   （`db5b3eb`のビルド失敗、17:27のページ表示不能）について**そのdeploymentが使っていた
   環境変数スナップショットとログ時刻を再照合し**、「6543なのにsession mode相当のエラーが
   出た」経路が実在するかを確認する。原因を素通りして対症療法だけ実装しない

**完了条件**:
- [x] T0の分岐に応じてpooler modeが是正されている（またはtransactionと確定し、再照合が完了している）
  ——**2026-09-05実施済み**。Preview `DATABASE_URL`をtransaction pooler(6543)へ更新
  （ユーザー承認済み、更新前に`psql`で接続確認）。並行負荷試験（各route12リクエスト、計24）で
  全て200・`EMAXCONNSESSION`0件、デプロイ後40秒のログ監視でも0件を確認
  （`task9-preview-rehearsal-preflight-v1.md`に追記済み）
- [x] ①②のDB接続失敗時、編集者に`publish-temporarily-unavailable`（既存コード）が出る
  （生の`digest`ではない、かつ「ログイン切れ」と誤表示されない）——**2026-09-05実装済み**。
  `mapPublishError`と`authenticatePublisher`の両方に`isDatabaseConnectionError`判定を追加し、
  既存の`publish-temporarily-unavailable`（503、ja/en文言あり）へ写像する。新規エラーコードは作らず、
  既存の「payload.authがthrowしても401へ倒す」テストはそのまま緑（判定文字列を実際に観測した
  `cannot connect to Postgres`/`EMAXCONNSESSION`/`ECONNREFUSED`/`ETIMEDOUT`に絞ったため衝突しない）
- [x] 上記をroute-levelで固定するテストがある（`getPayload`・`payload.auth`をモックし、
  実際に`POST`を呼ぶ）——**2026-09-05実装済み**。`vi.doMock('payload', ...)` +
  `vi.doMock('@/payload.config', ...)`で`route.ts`のtry/catchを外すと実際に赤転することを確認
- [x] ③はT8のチェックリストに追加されている——**2026-09-05追加済み**（§7参照。コードは変更しない）

**T1は完了。** pooler mode是正・エラー境界①②の実装・route-levelテストの3点とも完了。
③（draft PATCH失敗）はPayload自身のREST機構のため意図的にコード変更せず、
手動確認項目としてT8へ記録した。

**検証**:
- `npx vitest run tests/content/admin-publish-route.test.ts`
  （session/transaction分岐で追加した場合は該当テストも）
- **並行負荷試験**: `/robots/unitree-g1` と `/manufacturers` へ**それぞれ12リクエストずつ、
  合計24リクエスト**を発行する（8/23の実績と同条件。「12並列×2セット」という表現は
  「48リクエスト」と誤読されうるため書き換えた）。直後5分間、試験前後の接続数と
  `EMAXCONNSESSION`件数を記録する

**残る不確実性**: pooler modeが退行した根本原因（8/25の入力ミスという仮説の真偽）は、
T0で「今どちらか」は確定できるが、「なぜそうなったか」の人的経緯は当時の作業記録が
残っていない以上、断定できない。

---

### T2. 再検証の結果を編集者へ伝え、draft保存の無駄な通知を止める

**前提の訂正（2026-09-05 4回目改訂）**: 「T0でD-1確定が前提」としていたが誤り。
D-1（bypass機構）は既に動作を実測確認済みで、T0が調べるのはpooler mode（Aの原因）であり
D-1とは無関係。**T2はT0を待たずに着手できる。**

**Files**:
- `lib/payload/revalidationHook.ts` — 通知結果を返す型へ。draft判定を追加
- `lib/payload/publishApprovedVersion.ts` — 結果型に再検証状態を追加
- `src/app/api/admin/publish/route.ts` — 応答に含める
- `components/admin/PublishFromApproval.tsx` — 応答を読んで文言を出し分ける
- `lib/payload/adminPublishMessages.ts` — 文言（ja/en 両方）
- `tests/content/revalidation.test.ts` / `admin-publish-route.test.ts` /
  `tests/components/publish-from-approval.test.tsx` / `tests/e2e/payload-admin-publish.spec.ts`

**問題**: 通知結果は `Promise<void>` で消え、route は `documentId` しか返さず、
component は固定toastを出す。**失敗が編集者に一切伝わらない。**

**問題（draft抑制の対象、2026-09-05精緻化）**: `createRevalidationAfterChangeHook`
（`revalidationHook.ts:115`）は7 collectionだけでなく、**versionedな
`ArticlePlacements`（`ArticlePlacements.ts:107`）にも使われている**。
`Media`（`Media.ts:31`）は非versionedで別扱い。`SiteSettings`は別hook
（`createSettingsRevalidationAfterChangeHook`）だが、これも**draft対応global**
（`globals/SiteSettings.ts:27`）。draft抑制はこの全体を覆う必要がある。

**対象と期待される通知回数（完了条件の正本）**:

| 対象 | 操作 | 期待される通知回数 |
|---|---|---|
| 7 content collection（`manufacturers`等） | draft保存 | **0回** |
| 7 content collection | Admin公開（①draft保存→②公開） | **1回**（②commit後のみ） |
| 7 content collection | 直接published書き込み（`content:import`等） | 1回（従来どおり） |
| `ArticlePlacements` | draft保存 | **0回** |
| `ArticlePlacements` | published書き込み | 1回（従来どおり） |
| `Media` | 変更（非versioned） | 1回（従来どおり、draftの概念が無いため変更なし） |
| `SiteSettings` | draft保存 | **0回** |
| `SiteSettings` | published保存 | 1回（従来どおり） |

**変更内容**:
- 通知結果を DTO として commit 後から toast まで通す
- 状態は `ok` / `non-ok` / `unreachable` に加え、
  **現在は無言で return する `missing-secret` / `missing-base-url` も含める**
- 文言は「**タグ無効化を受理した**」であって「**ページ反映済み**」ではないことを
  取り違えない表現にする
- `createRevalidationAfterChangeHook` と `createSettingsRevalidationAfterChangeHook` の
  **両方**に、draft保存時は通知をスキップする判定を追加する
  （`deferRevalidationUntilCommit`と同様に、`_status !== 'published'`のPATCH/updateかどうかを見る）

**完了条件**: ✅ **2026-09-05実装済み**。

- `RevalidationNotifyResult`型（`ok`/`non-ok`/`unreachable`/`missing-secret`/`missing-base-url`）を
  `revalidationHook.ts`に新設し、`notifyRevalidation`/`notifyRevalidationAfterCommit`の戻り値へ。
  `PublishApprovedVersionResult.revalidation`経由でroute応答・componentまで到達する
- **5状態は型・ログでは区別するが、編集者向け文言は2つにまとめた**（当初「5状態それぞれ
  異なる文言」としていたが実装時に見直した）。`non-ok`/`unreachable`は編集者から見れば
  同じ対応（再読み込みして確認する）なので`publish-succeeded-reflection-failed`へ、
  `missing-secret`/`missing-base-url`は「この環境では未設定」という同じ意味なので
  `publish-succeeded-reflection-not-configured`へ。5状態別の文言をそのまま実装すると、
  編集者にとって意味の無い区別を増やすだけになる（guardrails「過剰な実装を避ける」）
- `isDraftSave(doc)`を純粋関数として`revalidationHook.ts`に実装し、export。
  `_status`フィールドが無いdocument（`Media`）は常にfalse（従来どおり毎回通知）、
  `_status !== 'published'`ならdraft保存とみなして通知しない
- **上記表の8ケースを`tests/content/revalidation.test.ts`に実装**
  （`isDraftSave`の単体テスト4件 + フック経由の統合テスト8件 + `notifyRevalidationAfterCommit`の
  5状態テスト5件、計17件追加）。`ArticlePlacements`/`Media`/`SiteSettings`相当は実DBを介さず
  フックへ直接`doc`/`req`を渡す形で検証（`RevalidatableCollectionSlug`に無いslugでも
  ロジックは同じため`'robots'`で代用、`Media`は非versioned形状の`doc`で代用）
- ミューテーションで両フックとも個別に赤転することを確認済み

**検証**: `npx vitest run tests/content/revalidation.test.ts tests/components/publish-from-approval.test.tsx`
（30件・21件、既存の`admin-publish-service.test.ts`等への副作用なしを確認済み）

**注意**: fail-open の設計は変えない。公開をブロックすると重大度の判断が逆転する。

---

### T3. 反映のSLOと運用手順を決めて記録する

**前提**: D-2。

**Files**: `docs/decisions/admin-publish-cache-reflection-slo-v1.md`（新規、正本ファイル名を確定。**`docs/reference/` ではない** — レビュー指摘9・`80-doc-governance.md`の「現行運用判断は`docs/decisions/`」に従う）

**変更内容**: 以下を分けて書く。
- **Next.jsが保証すること**: stale-while-revalidate の契約。`revalidate` は上限ではない
- **このプロジェクトが目標とすること**: 例「通知200から30秒以内に収束」
- **超過したときの手順**: 何を確認し、誰が何をするか

**完了条件**: ✅ **2026-09-05実装済み**。`docs/decisions/admin-publish-cache-reflection-slo-v1.md`
を新規作成し、契約（§1）・目標SLO（§2「通知200からポーリングで30秒以内に収束」）・
超過時の手順（§3）を分けて記載。`docs/README.md`の「最近の決定・反映」と
「decisions の主要文書」へ登録済み

---

### T4. field に日本語ラベルを付ける

**前提**: D-3 / D-4 / D-5。

**Files**: `lib/payload/adminFieldLabels.ts`（新規）, `collections/*.ts`（対象7つ）,
`collections/ArticlePlacements.ts`, `globals/SiteSettings.ts`, `lib/payload/access.ts`

**対象範囲（2026-09-05 5回目改訂で訂正）**:
- 公開必須項目を持つ7 collection（`Manufacturers`/`Distributors`/`RobotSeries`/`Robots`/
  `UseCases`/`Deployments`/`Articles`）+ `ArticlePlacements` + `SiteSettings`
- **対象外**: `Admins`（内部運用専用、編集者が直接触らない）、`Media`（別途検討）
- **nested / array 内のfieldは対象に含める（前回「対象外」としたのは誤り）。**
  実configを再帰走査した外部レビューにより、`admin.hidden`でない編集者可視のnested/array
  fieldが対象範囲だけで**208件**あることが判明した（例: `manufacturers.sources.title`、
  `manufacturers.heroImage.rights.status`、`robots.comparison.strengths`、
  `article-placements.sponsor.disclosure`、`site-settings.defaultSeo.metaTitle`）。
  これらを除外すると「ja localeで英語field名が無い」という完了条件そのものが成立しない
- **除外してよいのは** `admin.hidden: true` のfieldと、Payload組み込みfield（`updatedAt`等）
  のみ。**hidden・組み込み以外のnested/array fieldは全て対象。**

**変更内容**:
- 共有fieldは `access.ts` 側で1回だけ付ける（複製しない）
- `adminFieldLabels.ts` はnested構造を表現できる形にする（フラットな`Record<string,string>`
  ではなく、field path または入れ子構造でnested fieldのラベルも保持する）
- **D-4の決定に従い ja/en 両方**を持つ

**完了条件**: ✅ **2026-09-05実装済み**。

- `lib/payload/adminFieldLabels.ts` を新設。`AdminFieldLabelMap`（field名→`{ja, en}`の
  flat map）、`applyAdminFieldLabels(fields, labels)`（直下1階層だけにlabelを付ける。
  同名field衝突を避けるため階層ごとに個別呼び出しする設計）、
  `collectUnlabeledAdminFieldPaths(fields)`（nested/array/tabs/blocksまで再帰的に未ラベルを
  検出する、テスト専用の読み取り専用関数）を実装
- 共有field（`stableId`/`sources`/`heroImage`/`seo`等）は`access.ts`の各field生成関数
  （`baseContentFields()`/`sourcesField()`/`rightsMetaField()`/`imageAssetField()`/
  `seoField()`/`baseRecordContentFields()`）が自分自身の直下fieldへ`applyAdminFieldLabels`を
  呼ぶ形で1回だけ付ける。collection側は複製しない
- 9つの対象（7 collection + `ArticlePlacements` + `SiteSettings`）それぞれの固有fieldへ、
  nested group/arrayの中身も含めて`applyAdminFieldLabels`を適用。ja/en両方を持つ
  （D-4）ため`payload.config.ts`の`supportedLanguages: {en, ja}`と整合する
- `tests/content/admin-field-labels.test.ts`を新設。9対象それぞれで
  `collectUnlabeledAdminFieldPaths()`が空配列であることを検証（12件）。
  `admin.hidden`なfield（`adminPublishIntentField`）が誤って対象に含まれないこと、
  および安全網自体が機能すること（意図的に未ラベルのfieldを渡すと検出される）も検証
- **実際に1件消すと落ちることを確認済み**: `manufacturersFieldLabels`から
  `vendorRiskNote`を一時的に削除して実行したところ、`'manufacturers'`のテストだけが
  期待どおり赤転した。確認後に復元し、再度全12件が緑であることを確認した

---

### T5. select の選択肢ラベルを揃える

**Files**: `collections/*.ts`, `collections/ArticlePlacements.ts`, `lib/payload/access.ts`,
`lib/payload/adminSelectLabels.ts`（**D-5で新設**）

**初版からの訂正**: 「`lib/labels.ts` を変更せず再利用するだけ」は**成立しない**。

**対象範囲の訂正（2026-09-05 5回目改訂）**: T4で`ArticlePlacements`を対象に加えたのに、
T5の集計が「7 collection + access.ts」のままだった。`ArticlePlacements`を含めると
select値は増える（`surface`/`slot`/`kind`が追加）。**正確な値は実装時に対象configから
機械算出する**（本計画時点での手計算は方式の違いで前回・今回とも微妙にずれており
——自分の静的正規表現では121→125、外部レビューのランタイム走査では119→123——
**固定の件数を計画に書くこと自体をやめ**、下記のfield別Record対応表と、
「対象configから機械算出し1件でも増減したら気づけるテスト」を完了条件にする）。

**field別のRecord対応表（正本）**:

| collection.field | 対応するRecord | 備考 |
|---|---|---|
| `Manufacturers.companyType` 等 | `lib/labels.ts` の既存Record | そのまま再利用 |
| `Articles.kind` (editorial/sample/sponsored) | `adminSelectLabels.ts`（新規） | `lib/labels.ts`未収録 |
| `ArticlePlacements.surface` (reports-index) | `adminSelectLabels.ts`（新規） | |
| `ArticlePlacements.slot` (hero/feature) | `adminSelectLabels.ts`（新規）**——`lib/labels.ts`の`imageRoleLabels.hero`とキーが同じだが再利用しない** | `imageRoleLabels.hero`は「メイン画像」（画像の役割）。`ArticlePlacements.slot`の`hero`は「記事配置の最上段」という別概念。**同じ日本語を使い回すと意味が変わる事故になる**——別のラベル文言を`adminSelectLabels.ts`側に持つ |
| `ArticlePlacements.kind` (editorial/sample/sponsored/house) | `Articles.kind`と値は重複するが**別selectとして扱う**（`house`は`ArticlePlacements`のみの値） | |
| `_status` (draft/published) | 対象外 | Payload自身が翻訳を持つ組み込みfield |

**変更内容**:
- Recordが既にあるselectは**それを`lib/labels.ts`から再利用**（日本語部分。値は転記せず参照する）
- 不足分は **D-5で新設する`lib/payload/adminSelectLabels.ts`に、ja/en両方の正本を追加する**
  （`lib/labels.ts`本体は変更しない）
- **`slot: 'hero'` のような、既存Recordとキーが衝突するが意味が異なる値は、
  上記対応表のとおり別ラベルを持つ**（自動的な値の使い回しをしない）
- `_status`（draft/published）は対象外——Payload自身の翻訳に任せる
- **`options` の value 集合は変更前後で完全一致**させる

**完了条件**: ✅ **2026-09-05実装済み**。

- `lib/payload/adminSelectLabels.ts`を新設。対象32個のselect（access.ts共有5+
  Manufacturers 3+Distributors 2+Robots 8+UseCases 6+Deployments 1+Articles 4+
  ArticlePlacements 3、`RobotSeries`/`SiteSettings`はselect無し）を全て
  `{value, label:{ja,en}}`形の`Option[]`へ置換。既存Record（`reliabilityLabels`/
  `articleCategoryLabels`/`companyTypeLabels`等13個）がある値はjaをそこから直接参照
  （転記しない）、英語は新設ファイルだけが正本
- `ArticlePlacements.slot`は対応表どおり`imageRoleLabels.hero`を再利用せず、
  別の日本語（「最上段（トップ）」）を独自定義
- `Articles.contentKind`と`ArticlePlacements.kind`は値が一部重複するが別selectとして
  個別に定義（`house`は後者のみ）
- `tests/content/admin-select-labels.test.ts`を新設。9対象それぞれで
  `collectSelectFieldSnapshots()`が返す全selectについて (1) 全optionにja/en非空labelがある、
  (2) 値集合がrefactor前と完全一致することを検証。加えて`slot`が`imageRoleLabels.hero`を
  再利用していないことの専用テスト、安全網自体が機能することの確認を含め計20件
- **実際に1件消すと落ちることを確認済み**: `manufacturerCompanyStatusSelectOptions`から
  `acquired`を一時的に削除して実行したところ、値集合比較テストが期待どおり赤転した。
  確認後に復元し、再度全20件が緑であることを確認した
- `_status`（draft/published）はPayload組み込みのため対象外（selectとして定義していない）

---

### T6. 編集画面を構造化する

**Files**: `collections/*.ts`, `lib/payload/access.ts`,
`docs/decisions/admin-field-layout-v1.md`（新規、POC結果・配置表の正本）

**初版からの訂正**: 「構造化ゼロ」は誤り。`type: 'group'`（データ構造）は既に10件ある。
無いのは `tabs` / `collapsible` / `admin.position: 'sidebar'`（表示のみの構造）。

**変更内容**:
- **まず1 collection（`Manufacturers`を候補とする）で実画面POC**を行い、
  `sidebar` / `collapsible` の見え方を`docs/decisions/admin-field-layout-v1.md`へ記録してから展開する
- 運用頻度で3層に分け、collection別の配置表を同ファイルへ作る
- **`type: 'group'` を新規に追加しない**（data構造が変わりmigrationが必要になる）

**完了条件**:
- POCの結果が`docs/decisions/admin-field-layout-v1.md`に記録されている
- `npm run payload:migrate:create -- structure-check --skip-empty` が**新しいmigrationを生成しない**

---

### T7. `admin.description` を編集者向けに書き換える

**Files**: `collections/*.ts`, `lib/payload/access.ts`,
`docs/decisions/admin-field-to-page-section-map-v1.md`（新規、対応表の正本）

**変更内容**:
- **先に field → 公開ページ表示箇所の対応表を`docs/decisions/admin-field-to-page-section-map-v1.md`
  へ作る**（`lib/uiText.ts` の見出しと突き合わせる）
- 説明文を「何を入れるか」「ページのどこに出るか」に書き換える
- 実装理由はコードコメントへ移す（消さない）
- **D-4 に従い ja/en 両方**

**完了条件**: `admin.description` に実装用語（`timestamptz` / `Task 5` / ファイルパス）が残っていない。
対応表が`docs/decisions/admin-field-to-page-section-map-v1.md`に存在する

---

### T8. 検証

**Files**: `tests/e2e/`（拡張）

**初版からの訂正**: `tests/e2e/payload-admin-publish.spec.ts:73` は
**Payload REST（`/api/manufacturers`）を読んでおり、Next.js の cached HTML を通らない**。
これでは「ページに反映された」ことを証明できない。

**やること**:
- Admin で編集・公開し、**公開ページのHTMLをポーリングして収束を確認する** e2e を追加する
  （`tests/e2e/cache-revalidation.spec.ts` の方式に合わせる）
- 既存の両e2eを実行する
- Vercel 実機で route ログと HTML 反映の両方を確認する
- **並行負荷試験を8/23の実績と同条件で行う**: `/robots/unitree-g1` と `/manufacturers` へ
  それぞれ12リクエストずつ、合計24リクエストを発行し、直後5分間 `EMAXCONNSESSION` が0件であることを確認する
- ja / en 両localeで編集画面を確認する
- モバイル幅・キーボード操作を確認する

---

## 5. 順序制約

```
T0（pooler mode確定。全taskの前提、最優先）
  └→ T1（pooler是正 + getPayload()エラーハンドリング）

D-1 は既に機構動作を確認済み → T2（draft抑制を含む）
D-2 → T3
D-3 / D-4 → T4 → T5 → T6 → T7   （collections/*.ts を共有するため直列）
                                 すべて完了 → T8
```

- **T0 → T1 を最初にやる。** 8月23日の実績どおりpooler modeが原因なら、
  これだけで症状Aの大半が解消する可能性が高い
- T2 は D-1 の残る不確実性（実行時env var）をT2着手時に自己確認すればよく、
  T0を待つ必要はない（並行可）
- **T4〜T7 は直列。** 同じファイル群を触る
- **T3（短縮を選んだ場合）は T1 の後**（DBアクセスが増えるため）

---

## 6. 検証コマンド

```bash
npm run check
npx vitest run tests/content/revalidation.test.ts tests/content/admin-publish-route.test.ts
npx vitest run tests/content/payload-pool-config.test.ts
npm run payload:migrate:create -- structure-check --skip-empty
npm run test:e2e -- tests/e2e/payload-admin-publish.spec.ts tests/e2e/cache-revalidation.spec.ts
```

**ゲートが赤くなることの確認**:

| 壊し方 | 落ちるべきもの |
|---|---|
| T0のdebug routeを消し忘れる | **`test ! -e src/app/api/admin/debug-db-pool/route.ts`**（2026-09-05修正: knipは`src/app/**/route.ts`を明示entry扱いするため、dead-code検知はこの用途に効かない。ファイル存在の直接assertに変更） |
| `getPayload()`のtry/catchを外す | T1のroute-levelテスト（`getPayload`をモックして失敗させ、routeが構造化エラーを返すことを確認） |
| （transaction確定の場合）`pool.max`を消す | T1 の設定テスト |
| fieldの `label` を1つ消す | T4 のラベル網羅テスト（対象範囲のホワイトリストに対して） |
| select の value を1つ変える | T5 の value集合固定テスト |
| `type: 'group'` を新規追加 | `migrate:create --skip-empty` が空でなくなる |
| 通知結果を握り潰す | T2 の DTO テスト |
| draft保存で通知が飛ぶ | T2 の8ケースマトリクステスト（`ArticlePlacements`/`SiteSettings`含む） |

---

## 7. 手動確認チェックリスト

- [x] 並行負荷後（各route12リクエスト、計24）、直後5分間 `EMAXCONNSESSION` が0（T1・T8）——**2026-09-05実機確認済み。24/24が200、EMAXCONNSESSION 0件**
- [ ] draft保存（フェーズ①、`PublishFromApproval.tsx:90-91`のPayload標準REST）がDB接続失敗で
  落ちたとき、admin画面の表示が編集者にとって分かる内容になっているか確認する。
  **我々のroute外（Payload自身のREST handler）のため、コードは変更しない**（T1）
- [ ] 公開 → **公開ページのHTML**が SLO 内に変わる（T8）
- [ ] 通知が失敗したとき、その旨がtoastに出る（T2。単体テストでは確認済み、Preview実機はまだ）
- [ ] draft保存時にネットワークタブで`/api/revalidate-content`への通知が飛ばないことを確認する
  （公開時だけ1回飛ぶ）（T2。単体テストでは確認済み、Preview実機はまだ）
- [ ] **ja locale** で英語のfield名が無い（T4）
- [ ] **en locale** で日本語が混ざらない（D-4・T4）
- [ ] 選択肢の表記が公開ページと一致（T5）
- [ ] 最初に見える項目が日常編集の項目だけ（T6）
- [ ] 説明文が編集者向け（T7）
- [ ] モバイル幅・キーボード操作
- [ ] 公開ページの見た目が変わっていない

---

## 8. 影響範囲

| 対象 | 影響 |
|---|---|
| DB schema | **なし**（`type: 'group'` を新規追加しない前提。`--skip-empty` で証明） |
| 公開ページの見た目 | **なし**（`uiText.ts` を変更しない） |
| 公開処理・認可 | **なし** |
| `publishApprovedVersion` の結果型 | **あり**（T2。呼び出し元の追従が必要） |
| 本番の接続挙動 | **あり**（T1 は全環境に効く） |
| `lib/labels.ts` | **なし**（D-5により変更しない設計に変更済み。不足分は新設`adminSelectLabels.ts`へ） |

---

## 9. リスクと軽減策

| リスク | 重大度 | 軽減策 |
|---|---|---|
| （transaction確定時）`pool.max`を絞ってもinstance数超過で再発 | **高** | T1で「pool.max実装前に過去の失敗deploymentのenv snapshotを再照合する」を必須手順にした。原因を確定してから実装する |
| T4でnested/array fieldを対象に含めたことで作業量が208件規模に膨らむ | **高** | 1件ずつではなく、field pathベースの網羅テストで機械検出する設計にした（T4参照）。手作業の見落としをテストが拾う前提 |
| T5で不足分のラベルをどこかに追加する際、value集合を誤って変える。または`hero`のような衝突キーを誤って再利用する | **高** | D-5で`lib/labels.ts`本体には触れない設計にした（新設`adminSelectLabels.ts`のみ変更）。value集合の不変・`hero`の非流用をそれぞれテストで固定。公開ページのe2eを回す |
| T2 で結果型を変え、既存呼び出し元が壊れる | 中 | `publishApprovedVersion` の呼び出し元を先に洗い出す（CLI/import経路含む） |
| D-4 で ja/en 両対応を選ぶと作業量が2倍 | 中 | 対象範囲を先に絞る（T4 の完了条件で確定済み） |
| T6 の `sidebar` が期待と違う見え方 | 中 | 1 collection POC を完了条件に入れる |
| 8/25の入力ミス仮説が外れ、pooler modeが実は正しかった場合、T1の前提が崩れる | 中 | T0で「今どちらか」を必ず先に確認してからT1に進む。分岐を用意済み（T1参照） |
| T0のdebug routeが削除し忘れられ、credential構造のヒントが残る | 中 | 削除をT0の完了条件に含め、**`test ! -e`によるファイル存在の直接assert**で機械検出する（knipのdead-code検知はroute.tsを明示entry扱いするため効かない。§6参照） |

---

## 10. 実装しないこと

- `lib/uiText.ts` の変更
- 公開ゲート・認可・version保持の変更
- データ形状・`domainTypes` / `mappers` の変更
- 公開ページのデザイン変更
- `article-placements` の公開経路の新設
- 一括公開（PublishMany）
- Trusted Sources（OIDC）への移行
- Supabase / Vercel の設定変更を私の判断で行うこと
- `cacheLife` の短縮（D-2 で非推奨）
- **「なぜ8/25 22:43に間違った値が入力されたか」という、人の作業手順に関する再発防止策の設計**（監視・アラート整備等）。read-only APIで追跡できる範囲（いつ・何が変更されたか）はT0/G節で既に特定済みで、それ以上の人的原因究明は当時の作業記録が残っていない以上、技術的な手段では確定できない

---

## 11. 未確証のまま残るもの（T0/T1/T8 の実測ゲートで潰す）

| 項目 | 状態 | 潰すtask |
|---|---|---|
| Preview実行時DATABASE_URLがsession/transactionのどちらか | **未確認**（debug routeで確認できる） | T0 |
| Protection Bypass for Automation の有効/無効 | **確認済み**（Vercel Project API、`isEnvVar:true`） | — |
| bypassヘッダが実際にVercel保護を通過するか | **確認済み**（正しいトークンでcurl成功） | — |
| `revalidationHook.ts`の内部fetchが実行時に同じenv varを読めているか | 未確認 | T2 |
| Supavisor の `pool_size` 実設定値 | 未確認（8月23日の実績から間接的に15と推定） | — |
| 同時 Function instance 数 | 未確認 | T1（session mode退行が主因と確定すれば不要になる可能性が高い） |
| 現在の Preview での HTML 収束時間 | 未確認 | T8 |
| 本番が同等負荷で枯渇しないか | 未確認 | T8 |
| pooler modeが**いつ**退行したか | **確認済み**（Vercel Activity Log。2026-08-25 22:43:24/27 JSTの削除→再追加が唯一の変更点） | — |
| pooler modeが退行した実ポート番号 | 未確認 | T0 |
| **なぜ**その時に誤った値が入力されたか（人的原因） | **究明しない**（当時の作業記録が残っておらず、技術的手段では確定不能。§10参照） | — |

**「確定した原因」ではなく、実測で決着させる項目として扱う。
3回のレビューを経て、Protection Bypassまわりは機構の動作まで確認が進み、
pooler mode退行は「いつ」までActivity Logで特定できた。残るのは
「実際のポート番号」（T0）と「なぜ入力ミスが起きたか」（究明しない）の2点のみ。**
