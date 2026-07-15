# ロボット画像・メーカーロゴ調達 実行計画 v1

Last created: 2026-07-08 / Last updated: 2026-07-15（現行データモデル・全61公開機体を基準に全面改訂）

## 0. 位置づけ

この文書は `docs/planning/README.md` の「(c) 未実装・作業計画」に属する。
ロボット画像とメーカーロゴを、漏れ・重複・権利状態の混同なく収集し、公開データへ登録するための実行計画である。

この文書は実装や権利判断の正本ではない。矛盾した場合は、次の順で現行実装を優先する。

1. `data/types.ts`
2. `lib/media.ts`, `lib/robotMedia.ts`, `lib/manufacturerLogo.ts`, `lib/validate.ts`
3. `docs/planning/copyright_and_media_rights_policy_v1.md`
4. `docs/data/README.md`, `docs/planning/data-maintenance-checklist-v1.md`
5. 本計画

本計画の実行は、ロボットカタログ改修PRの完了後に、最新 `main` から作る専用branch/worktreeで行う。
素材調達をUI改修PRへ混ぜない。

## 1. 目的と非目的

### 1.1 目的

- 公開中の全RobotとManufacturerを、機械的に数えられる調達スロットへ分解する。
- 各スロットを「未調査」のまま残さず、公開済みまたは理由付きの非公開状態へ解決する。
- 公式性、画像品質、転載権、公開状態を別々に確認する。
- 候補素材・却下履歴・許諾記録・公開素材のSSOTを分離する。
- 弱いコーディングモデルでも、決められた状態遷移と停止条件だけで安全に作業できるようにする。
- Robot画像をカード、詳細カルーセル、比較、metadata、JSON-LDで共通利用する。
- Manufacturerロゴをカード、詳細、世界地図、記事関連メーカー、JSON-LDで共通利用する。

### 1.2 今回しないこと

- 記事hero画像、記事本文画像、活用事例リンク先のサムネイル収集。
- Manufacturerの汎用hero画像収集。現在のUIに必須の共通表示枠がないため対象外。
- 画像を集めるためだけのRobot/Manufacturer新規レコード作成。
- スペック、価格、用途、活用事例、タグ、説明文の同時更新。
- `ImageRole`を埋めるための不要な写真採用。
- 1つのroleへ複数画像を入れる配列化。
- DIYパーツ、交換ハンド、アタッチメント、互換部品のデータモデル追加。
- メーカーが配布していないsymbol/wordmark/combinedロゴの合成・トレース。
- 権利不明素材を公開してから事後通知する運用の自動実行。
- ローカルの `public/images/_local-prototype/` を公開素材の根拠として利用すること。

## 2. 現行コードとデータの事実

### 2.1 現行データモデル

Robot画像の公開SSOTは次の形である。

```ts
type ImageRole =
  | 'hero'
  | 'transparent'
  | 'side'
  | 'inOperation'
  | 'scale'
  | 'endEffector'
  | 'mobility';

interface Robot {
  images?: Partial<Record<ImageRole, ImageAsset>>;
}
```

- 1 Robotにつき最大7role、各roleは最大1画像。
- `BaseRecord.heroImage` はRobotの新規画像登録に使わない。
- `getRobotPrimaryImage()` は `transparent → hero → inOperation → side → scale → endEffector → mobility` の順で代表画像を解決する。
- `getDisplayableRobotImages()` は表示可能な登録画像だけをカルーセル順で返す。
- 表示画像0枚はplaceholder、1枚は静止表示、2枚以上はカルーセルになる。

Manufacturerロゴの公開SSOTは `Manufacturer.logos` である。

```ts
interface ManufacturerLogos {
  symbol?: ImageAsset;
  wordmark?: ImageAsset;
  combined?: ImageAsset;
}
```

- 新規ロゴをlegacy `Manufacturer.logo`へ登録しない。
- 公式に存在するvariantだけを登録する。
- 表示面は `resolveManufacturerLogo()` のfallbackを利用する。

`ImageAsset` はRobot画像・ロゴ・記事画像で共有する。

```ts
interface ImageAsset {
  src: string;
  alt: string;
  credit?: string;
  sourceUrl?: string;
  rights: RightsMeta;
  aspectRatio?: number; // 実行時計測。raw dataへ手入力しない
}
```

### 2.2 2026-07-15時点の実数

| 対象 | 件数 |
|---|---:|
| Robot全体 | 63 |
| published Robot | 61 |
| archived Robot | 1 (`figure-02`) |
| draft Robot | 1 (`pudu-d7`) |
| publishedで画像あり | 22 |
| publishedで画像なし | 39 |
| publishedで1枚のみ | 18 |
| publishedで2枚以上 | 4 |
| publishedの画像登録 | 26 |
| publishedの画像実ファイル | 23（3ファイルを機種variant間で共有） |
| Manufacturer全体 | 26 |
| published Manufacturer | 25 |
| structured logoあり | 8 |
| structured logoなし | 17 |

公開Robot画像26登録はすべて `sourceType: 'manufacturer-official'` かつ
`rights.status: 'reference-attributed'` で、商用再掲載の明示許諾は未確認である。
structured logo 8点はすべて `commercial-permitted` である。

### 2.3 現行モデルの適否

`Robot.images` の「1roleにつき1画像、最大7画像」は、現行カードと詳細カルーセルには十分である。
今回配列化しない。複数の稼働写真を保存したくなった時点で、実際の重複要件を確認して別計画にする。

一方、公開用 `ImageAsset` は素材候補、却下履歴、許諾交渉、同一許諾の共有を管理する用途には足りない。
これらを `Robot.images` / `Manufacturer.logos` に押し込まず、§5の調達台帳と許諾SSOTを追加する。

## 3. MECEな調達対象

### 3.1 対象集合

実行開始時点の `getRobots()` 相当のpublished Robot全件と、`getManufacturers()` 相当のpublished Manufacturer全件を対象にする。
2026-07-15時点では次の502スロットになる。

```text
Robot画像:       61 Robot × 7 ImageRole       = 427 target
Manufacturerロゴ: 25 Manufacturer × 3 variant = 75 target
合計:                                          502 target
```

427/75は「すべて公開する枚数」ではない。全候補スロットを一度は判定し、
`not-applicable` や `no-usable-candidate` を含めて未調査を残さないための台帳件数である。

作業中にpublishedレコードが増減した場合、固定件数を信じず、同期scriptで対象集合を再生成する。
新規published Robotには7target、新規published Manufacturerには3targetを追加する。
既存targetを自動削除しない。

### 3.2 一意キー

targetは次の形式で一意にする。

```text
robot:<robotId>:<imageRole>
manufacturer:<manufacturerId>:logo:<variant>
```

例:

```text
robot:unitree-g1:hero
robot:unitree-g1:inOperation
manufacturer:unitree:logo:wordmark
```

- `robotId` / `manufacturerId` は不変idを使う。slugを使わない。
- target keyの重複はvalidatorでerrorにする。
- 同じ公開ファイルを同一Robot内の複数roleへ登録しない。
- variant間で画像を共有する場合、同一筐体・同一外観である公式根拠と理由を台帳へ残す。

### 3.3 スコープ外レコード

| id | status | 扱い |
|---|---|---|
| `figure-02` | archived | 今回の502targetに含めない。既存詳細維持だけを確認する |
| `pudu-d7` | draft | publish gateを満たしてpublishedになるまで対象に含めない |

AIは「画像を見つけたから」という理由でpublishStatusを変更してはならない。

## 4. role・variantの判定規則

### 4.1 Robot画像の必要度

各targetは `requirement` を次のいずれか1つだけ持つ。

```ts
type MediaTargetRequirement = 'required' | 'preferred' | 'conditional' | 'optional' | 'not-applicable';
```

| role | 初期requirement | 採用条件 |
|---|---|---|
| `hero` | required | 対象機体を識別できる全身または主要外観。正面優先 |
| `inOperation` | preferred | 作業・移動・実環境での稼働が分かる |
| `endEffector` | conditional | 腕・ハンド・把持部が製品理解に有用 |
| `mobility` | conditional | 二足、車輪、wheel-leg等の移動機構が製品理解に有用 |
| `transparent` | optional | 公式配布済み、または背景除去・加工許諾がある |
| `side` | optional | 側面形状が分かる独立した有用画像がある |
| `scale` | optional | 人・設備・既知物体との大きさ比較が明確 |

`not-applicable` は初期値ではなく、調査後に「その機体に該当機構が存在しない」または
「メーカーがそのlogo variantを公式に持たない」と確認できた場合だけ使う。
探したが見つからない場合は `no-usable-candidate` であり、`not-applicable` ではない。

`hero`が見つからなくても、別roleに正しく分類される代表画像を `hero` と偽って登録しない。
代表画像resolverは他roleへfallbackできるため、roleの意味を優先する。

Robotの公開目標は次の二段階で判定する。

```text
minimum visual coverage:
  displayableな代表画像が1枚以上

carousel coverage:
  異なる内容のdisplayable画像が2枚以上
```

許諾上可能なRobotはcarousel coverageを完了条件とする。
明示禁止・許諾拒否・利用可能素材なしの場合は、理由付きplaceholderを正しい完了状態とする。

### 4.2 Robot画像roleの決定木

AIは空いているslotからroleを決めてはならない。画像内容から次の順で1roleを決める。

1. 背景透過された全身の公式配布素材か。Yesなら `transparent`。
2. 全身または主要外観を単体で確認できる代表写真か。Yesなら `hero`。
3. 作業・移動・現場利用中か。Yesなら `inOperation`。
4. 真横から外形を確認することが主目的か。Yesなら `side`。
5. 人・設備・既知物体との大きさ比較が主目的か。Yesなら `scale`。
6. ハンド・把持部・腕先が主被写体か。Yesなら `endEffector`。
7. 脚・足・車輪・移動台車が主被写体か。Yesなら `mobility`。
8. どれにも一意に分類できなければ採用せず `IMAGE_ROLE_AMBIGUOUS` を報告する。

### 4.3 Manufacturerロゴvariantの決定木

3variantはすべて `requirement: 'optional'` で初期化する。公開目標は最低1variantであり、
3variantを揃えることではない。公式ブランド体系に存在しないvariantは、人が確認した後に
`requirement: 'not-applicable'`, `resolution: 'not-applicable'` とする。

1. 文字を主とせず図形・アイコンだけか。Yesなら `symbol`。
2. 会社名文字を読ませる独立した公式ロゴか。Yesなら `wordmark`。
3. シンボルと会社名が公式に1ファイルで組み合わされているか。Yesなら `combined`。
4. 人が一意に判定できなければ登録せず `LOGO_VARIANT_REVIEW_REQUIRED` を報告する。

symbolとwordmarkを実装側で結合しない。PNGをSVGへトレースしない。

### 4.4 品質・同一性の採用条件

候補はすべて次を満たす。

- source pageの製品名とRobot.idが指す機体が一致する。
- 旧世代、類似モデル、別SKU、四足ロボット、合成バナーと誤認しない。
- 複数機種が写る場合、対象機体を一意に識別できる。
- ロゴや透かしで重要部分が隠れていない。
- カードの `object-contain` で機体が判別できる解像度がある。
- 画像内テキストを消す、背景を除去する、人物を消す等の改変を前提にしない。
- 未成年、患者、個人識別可能な人物が主被写体の素材は原則採用しない。
- 同じ元写真の全体版とcrop版を、カルーセル枚数を増やす目的で別roleにしない。

機種同一性に確信が持てない場合、AIは推測せず `MODEL_IMAGE_AMBIGUITY` を報告する。

## 5. 調達台帳と許諾SSOT

### 5.1 公開SSOTと運用SSOTの分離

| 情報 | SSOT | 入れてよいもの |
|---|---|---|
| 公開Robot画像 | `data/robots.ts` の `images` | 公開採用済みの1role1画像 |
| 公開Manufacturerロゴ | `data/manufacturers.ts` の `logos` | 公開採用済みの公式variant |
| 素材候補・却下履歴・進捗 | `docs/data/media/robot-media-collection-ledger.json`（新規） | 候補URL、状態、判断理由 |
| 共有許諾の公開要約 | `data/mediaPermissions.ts`（新規） | 非機密の許諾範囲と不変id |
| 許諾メール・契約書・受領原本 | リポジトリ外の非公開保管先 | 原本と機密情報 |
| 未承認の画像ファイル | `.media-staging/candidates/`（gitignore、新規） | 規約上download自体が禁止されていないローカル確認用候補 |
| 許諾済み・公開前ファイル | `.media-staging/approved/`（gitignore、新規） | 最適化・最終目視待ち |
| 公開可能な最適化済みファイル | `public/images/robots/`, `public/images/manufacturers/logos/` | rights gateを通す採用素材だけ |

`public/` はURL直指定で配信される。`prototype-only`、`permission-requested`、`blocked`、権利未確認素材を置かない。
現存するgitignored `public/images/_local-prototype/` は内容を再利用せず、収集開始前に `public/` 外へ移すか削除する。

### 5.2 台帳のtarget schema

台帳はtarget keyごとの配列とし、自由形式Markdown表をSSOTにしない。

```ts
type MediaTargetResolution =
  | 'unsearched'
  | 'not-applicable'
  | 'no-usable-candidate'
  | 'candidate-found'
  | 'rights-review'
  | 'permission-requested'
  | 'prohibited'
  | 'approved'
  | 'staged'
  | 'published';

interface MediaCollectionTarget {
  key: string;
  targetKind: 'robot-image' | 'manufacturer-logo';
  ownerId: string;
  slot: ImageRole | 'symbol' | 'wordmark' | 'combined';
  requirement: MediaTargetRequirement;
  resolution: MediaTargetResolution;
  candidates: MediaCandidate[];
  selectedCandidateId?: string;
  publishedPath?: string;
  permissionId?: string;
  permissionRequestRef?: string;
  permissionRequestedAt?: ISODate;
  checkedAt?: ISODate;
  decisionReason?: string;
}
```

### 5.3 candidate schema

1targetに複数候補を保持し、却下候補を上書きで消さない。

```ts
type MediaCandidateDecision = 'pending' | 'selected' | 'rejected';

type MediaCandidateRejectionReason =
  | 'wrong-model'
  | 'variant-ambiguous'
  | 'duplicate-scene'
  | 'low-resolution'
  | 'watermark-or-overlay'
  | 'privacy-or-minor'
  | 'source-unclear'
  | 'rights-prohibited'
  | 'alteration-not-permitted'
  | 'other';

interface MediaCandidate {
  id: string; // <target-key>:c<number>
  pageUrl: string;
  assetUrl?: string;
  sourceType: MediaSourceType;
  rightsHolder: string;
  termsUrl?: string;
  ownerIdentityMatch: true | false | 'unknown';
  alterationNeeded: Array<'resize' | 'crop' | 'format-convert' | 'background-remove'>;
  decision: MediaCandidateDecision;
  rejectionReason?: MediaCandidateRejectionReason;
  note?: string;
}
```

`assetUrl` は取得時点の直接URLであり、公開表示URLとして使わない。
`pageUrl` は人が原典と文脈を再確認できるページにする。検索結果URLを入れない。

### 5.4 状態遷移

AIは次の方向にだけ状態を進める。飛び越しを禁止し、validatorで不正組み合わせを検出する。

```text
unsearched
  ├─> not-applicable
  ├─> no-usable-candidate
  └─> candidate-found
        ├─> no-usable-candidate
        └─> rights-review
              ├─> no-usable-candidate
              ├─> prohibited
              ├─> permission-requested
              │     ├─> prohibited
              │     └─> approved
              └─> approved
                    └─> staged
                          └─> published
```

不変条件:

- `targetKind: 'robot-image'` はImageRoleだけ、`manufacturer-logo` はlogo variantだけをslotに持つ。
- `ownerId` は対象kindのpublished recordを指す。
- `not-applicable` は `requirement: 'not-applicable'` を持つ。
- `candidate-found` 以降は候補が1件以上ある。
- `no-usable-candidate`, `not-applicable`, `prohibited` は `decisionReason` と `checkedAt` が必須。
- `permission-requested` は `permissionRequestRef`, `permissionRequestedAt`, `checkedAt` が必須。
- 許諾依頼文を作っただけでは `permission-requested` にしない。実際の送信・受付を確認してから遷移する。
- `selectedCandidateId` は同targetのcandidateを指す。
- `approved` 以降はselected candidateの `ownerIdentityMatch === true` かつ `decision === 'selected'`。
- `approved` 以降は `permissionId` またはselected candidateの正確な公開ライセンスURLを追跡できる。
- `staged` は許諾済みファイルが `.media-staging/approved/` に存在する。
- `published` は `publishedPath` が `public/` に存在し、対応する `ImageAsset.src` と一致する。
- `permission-requested` と `prohibited` は `public/` にファイルを持たない。候補binaryも許諾回答後に不要なら削除する。
- rejectionReasonが `other` ならcandidateの `note` が必須。
- `published` targetだけを公開カバレッジとして数える。
- 状態を戻す場合は理由を残す。権利失効・拒否は公開ファイルを除去して `prohibited` にする。

### 5.5 `MediaPermission` の最小設計

同じメーカーの許諾を多数の `permissionNote` へ複製しない。

```ts
interface MediaPermission {
  id: Id;
  rightsHolder: string;
  grantType: 'public-license' | 'published-terms' | 'direct-permission';
  status: 'active' | 'expired' | 'revoked';
  publicWebsite: boolean;
  commercialUse: boolean;
  territories: string[];
  coverage:
    | { kind: 'specific-assets'; assetRefs: string[] }
    | { kind: 'collection'; collectionUrl: string }
    | { kind: 'all-official-assets'; scopeNote: string };
  permittedAlterations: Array<'resize' | 'crop' | 'format-convert' | 'background-remove'>;
  creditLine?: string;
  expiresAt?: ISODate;
  evidenceRef?: string;
  sourceUrl?: string;
  checkedAt: ISODate;
  note?: string;
}
```

- `evidenceRef` は非公開保管先の不変管理番号。メール本文や契約書をリポジトリへ入れない。
- `public-license` / `published-terms` は `sourceUrl`、`direct-permission` は `evidenceRef` を必須にする。
- `coverage` を必須にし、1枚への許諾を同メーカーの全素材へ拡大解釈しない。
- `specific-assets.assetRefs` は取得元URLまたは提供時ファイル名を使い、空配列を許可しない。
- `all-official-assets` は権利者がその範囲を明示した場合だけ使い、AIの要約解釈では使わない。
- 1許諾が複数画像に適用される場合、各 `RightsMeta` から `permissionId` で参照する。
- `status !== 'active'`、`publicWebsite !== true`、商用運用で `commercialUse !== true` の許諾は公開に使わない。
- cropや背景除去は `permittedAlterations` に明示されている場合だけ行う。
- 一般公開ライセンスの場合は `sourceUrl` に正確なlicense/file pageを入れる。

## 6. 権利判断

### 6.1 公式性と転載権を分ける

次を同一視しない。

```text
manufacturer-official = 画像の出所・被写体確認
commercial-permitted  = サイトへの掲載許可
```

メーカー公式サイトに掲載されている事実だけでは転載許可にならない。
`credit` と `sourceUrl` も許諾証跡ではない。

候補ソースの優先順位:

1. 自社撮影・自社制作で必要な肖像許諾もある素材。
2. メーカーから直接提供され、利用範囲を書面確認した素材。
3. 商用Web利用条件が明示された公式media/press kit。
4. 正確なfile pageで商用利用可能と確認したライセンス素材。
5. パートナー・顧客の公式発表で、権利者と利用条件を確認できる素材。

次は候補にしない。

- 検索結果の画像URLだけ。
- ロゴまとめサイト、Pinterest、転載ブログ、出所不明CDN。
- SNS投稿のスクリーンショット。
- YouTube動画のスクリーンショットや独自切り出し。
- 利用規約が禁止している公式サイト画像。
- 「出典を書けば使える」とAIが推測した画像。

### 6.2 公開ポリシーの決定gate

現行コードの既定値は `reference-attributed` で、`permission-requested` まで表示対象になる。
一方、`design_system_v1.md` は商用公開に `commercial-strict` を要求している。

素材一括収集前に、TASK MEDIA-001でこの矛盾を解消する。

推奨決定:

- productionは `commercial-strict`。
- `permission-requested` はproductionで非表示。
- `reference-attributed` はローカルの比較・権利再調査用に残しても、商用公開の完了画像として数えない。
- 現行26登録を「許諾済み」とみなさず、全件再審査する。

別方針を採る場合は、ユーザーがリスクを理解して明示決定し、
`copyright_and_media_rights_policy_v1.md`, `design_system_v1.md`, `lib/media.ts` を同じtaskで整合させる。
AIが独断で方針を選ばない。
本計画は法的助言ではない。利用条件が曖昧、または事業上のリスクが大きい場合は人間が最終判断する。

### 6.3 権利調査lane

2026-07-08の既存調査を初期laneとして使うが、実行時に規約を再確認する。

| lane | 意味 | 初動 |
|---|---|---|
| R1 | 明示禁止を既存調査で確認していない | 規約再確認後に候補収集。公式だから許可とは扱わない |
| R2 | JS/403/曖昧さにより人間確認が必要 | 人間が規約を確認するまでdownload/public登録しない |
| R3 | 商用利用・再公開制限を既存調査で確認 | 許諾対象を示す最低限のpage/file URLだけ特定し、local取得・公開より許諾依頼を先に行う |

R2:

- NEURA Robotics
- Leju Robotics
- PAL Robotics
- EngineAI
- RobotEra
- Galbot

R3:

- Tesla
- Boston Dynamics
- 1X Technologies
- XPENG Robotics
- Wandercraft
- Agility Robotics
- Kepler Robotics

R1は上記以外のpublished Manufacturer。R1は許諾済みという意味ではない。

## 7. 現行メーカー別インベントリ

laneと件数は実行開始時に同期scriptで再計算する。以下は2026-07-15のsnapshotである。

| manufacturerId | メーカー | lane | 公開機体 | 0枚 | 1枚 | 2枚以上 | 登録画像 | structured logo |
|---|---|---:|---:|---:|---:|---:|---:|---|
| `onex` | 1X Technologies | R3 | 2 | 2 | 0 | 0 | 0 | — |
| `aeolus-robotics` | Aeolus Robotics | R1 | 1 | 0 | 1 | 0 | 1 | — |
| `agibot` | AgiBot | R1 | 8 | 7 | 1 | 0 | 1 | combined |
| `agility-robotics` | Agility Robotics | R3 | 1 | 1 | 0 | 0 | 0 | combined |
| `apptronik` | Apptronik | R1 | 2 | 2 | 0 | 0 | 0 | — |
| `booster-robotics` | Booster Robotics | R1 | 2 | 0 | 2 | 0 | 2 | — |
| `boston-dynamics` | Boston Dynamics | R3 | 1 | 1 | 0 | 0 | 0 | — |
| `engine-ai` | EngineAI | R2 | 4 | 4 | 0 | 0 | 0 | — |
| `figure-ai` | Figure AI | R1 | 1 | 0 | 0 | 1 | 2 | — |
| `fourier-intelligence` | Fourier Intelligence | R1 | 4 | 3 | 1 | 0 | 1 | combined |
| `galbot` | Galbot | R2 | 1 | 1 | 0 | 0 | 0 | — |
| `kepler-robotics` | Kepler Robotics | R3 | 2 | 2 | 0 | 0 | 0 | — |
| `leju-robotics` | Leju Robotics | R2 | 2 | 2 | 0 | 0 | 0 | — |
| `limx-dynamics` | LimX Dynamics | R1 | 2 | 1 | 1 | 0 | 1 | — |
| `mentee-robotics` | Mentee Robotics | R1 | 1 | 0 | 1 | 0 | 1 | — |
| `neura-robotics` | NEURA Robotics | R2 | 1 | 1 | 0 | 0 | 0 | wordmark |
| `pal-robotics` | PAL Robotics | R2 | 2 | 2 | 0 | 0 | 0 | — |
| `robotera` | RobotEra | R2 | 3 | 3 | 0 | 0 | 0 | — |
| `sanctuary-ai` | Sanctuary AI | R1 | 1 | 0 | 0 | 1 | 2 | — |
| `tesla` | Tesla | R3 | 1 | 1 | 0 | 0 | 0 | — |
| `ubtech` | UBTECH Robotics | R1 | 6 | 3 | 1 | 2 | 5 | — |
| `unitree` | Unitree Robotics | R1 | 10 | 1 | 9 | 0 | 9 | wordmark |
| `wandercraft` | Wandercraft | R3 | 1 | 1 | 0 | 0 | 0 | wordmark |
| `xpeng-robotics` | XPENG Robotics | R3 | 1 | 1 | 0 | 0 | 0 | combined |
| `kawasaki-heavy-industries` | 川崎重工業 | R1 | 1 | 0 | 1 | 0 | 1 | combined |

published 25社中、ロゴあり8社・なし17社。R3でもロゴだけは権利確認済みの会社があるため、
Robot写真のlaneとロゴの個別rightsを混同しない。
表の画像枚数は現行データへの登録数であり、`commercial-strict` で公開可能な枚数ではない。

## 8. Robot収集バッチ（61機体を重複なく分割）

各RobotはB1〜B6のちょうど1バッチに属する。合計61、重複0である。
バッチ内ではメーカー単位に作業し、1PRは2〜4メーカー、最大10機体または20asset程度に抑える。

### B1: Home高露出5機体

```text
aeolus-aeo
unitree-r1
unitree-r1-standard
agibot-a2
fourier-gr1
```

- Home注目5機体。
- 既存1枚の4機体は2枚目を優先する。
- `fourier-gr1` は代表画像と2枚目の両方を探す。
- 現行4画像が再審査で承認されれば目標追加数は最低6登録。
- 現行4画像が承認されない場合は、B1全体で最大10画像の承認または差し替えが必要。

### B2: 1枚あり・B1以外の14機体

```text
unitree-g1
unitree-g1-edu
unitree-h1
unitree-h2
unitree-h2-edu
unitree-h2-plus
ubtech-walker-s2
fourier-gr3
booster-t1
kawasaki-kaleido
booster-k1
limx-oli
mentee-menteebotv3
unitree-g1-d
```

- 既存画像のrights再審査と、異なる内容の2枚目を同時に行う。
- EDU/standard等で同じ写真を共有している機体は、外観差・variant差と公式説明を確認する。

### B3: R1・画像なし・B1以外の16機体

```text
unitree-h1-2
apptronik-apollo
fourier-gr2
agibot-a2-ultra
agibot-a2-max
limx-luna
agibot-a2-lite
agibot-x1
agibot-x2
agibot-x2-ultra
ubtech-walker-s
ubtech-walker-c
ubtech-walker-tienkung
fourier-gr3c
apptronik-apollo-2
agibot-g2
```

- 規約再確認後に代表画像から探す。
- 類似variant間で画像を推測流用しない。

### B4: R2・人間の規約確認が先の13機体

```text
neura-4ne-1
leju-kuavo
pal-talos
pal-kangaroo
leju-kuavo5
engineai-se01
engineai-pm01
engineai-t800
engineai-sa01
robotera-l7
robotera-q5
robotera-m7
galbot-g1
```

- 403、JS描画、曖昧なtermsを人間が確認する。
- 確認前は `rights-review` まで。画像を `public/` に置かない。

### B5: R3・個別許諾が先の9機体

```text
agility-digit
onex-neo
boston-dynamics-atlas
tesla-optimus
kepler-k2
xpeng-iron
kepler-k1
wandercraft-calvin
onex-eve
```

- 既存のblocked理由を消さない。
- 対象ファイル、媒体、商用性、地域、期間、加工、creditを明示して許諾依頼する。
- 書面許諾前はplaceholderが正しいUI状態。
- AIは依頼文と送信対象を準備できるが、ユーザーの明示許可なく外部へ送信しない。

### B6: 2枚あり・rights再審査の4機体

```text
figure-03
sanctuary-phoenix
ubtech-walker-s1
ubtech-walker-x
```

- `reference-attributed` policyではカルーセル枚数を満たすが、strictな公開coverageは再審査完了まで0として扱う。
- 現行2画像の権利、機種同一性、重複場面、加工履歴を再審査する。
- 3枚目は明確に有用なroleがある場合だけ追加する。

## 9. ロゴ収集バッチ（25社を重複なく分割）

### L1: structured logoあり8社の再監査

```text
unitree
agility-robotics
agibot
fourier-intelligence
kawasaki-heavy-industries
neura-robotics
xpeng-robotics
wandercraft
```

- 現在のvariant、license/file page、商標注記、ファイル安全性を確認する。
- 欠けたvariantを無理に追加しない。

### L2: structured logoなし17社

```text
onex
aeolus-robotics
apptronik
booster-robotics
boston-dynamics
engine-ai
figure-ai
galbot
kepler-robotics
leju-robotics
limx-dynamics
mentee-robotics
pal-robotics
robotera
sanctuary-ai
tesla
ubtech
```

- まず公式brand/press pageまたは正確なライセンスfile pageを探す。
- 最低1variantが目標だが、利用可能素材がなければテキスト名fallbackを正しい完了状態とする。
- Robot画像の許諾とロゴの商標・著作権判断は別targetとして扱う。

## 10. 1targetを処理する標準手順

AIは一度に1target、または計画で指定された1メーカーのtargetだけを処理する。

1. target key、owner id、slot、requirement、現在resolutionを読む。
2. `data/robots.ts` または `data/manufacturers.ts` の既存画像・blocked履歴・permissionNoteを読む。
3. ownerの公式site、product page、press/news page、brand/media kit、termsを探す。
4. 検索結果ではなく原典pageを開く。
5. 候補ごとに `MediaCandidate` を追加する。既存候補を上書きしない。
6. source pageの製品名と画像内容から機種・variantを確認する。
7. §4の決定木でrole/variantを判定する。
8. terms/license/書面許諾から転載・商用・加工可否を確認する。
9. 不明なら `rights-review` で停止する。実際に許諾依頼を送信済みの場合だけ `permission-requested` にする。
10. 規約上download自体が禁止されておらず目視に必要な候補だけ `.media-staging/candidates/` に一時保存する。外部URLを `ImageAsset.src` にしない。
11. 人が画像を開き、機種違い、低解像度、人物、overlay、余白、破損を目視する。
12. 不採用candidate binaryを削除する。候補履歴は台帳に残す。
13. 許諾済みcandidateを `.media-staging/approved/` へ移す。
14. 許可された範囲だけでresize/crop/format変換する。背景除去を既定処理にしない。
15. WebP推奨、300KB以下、最大幅1920pxへ最適化する。
16. 最終ファイルを規定pathへ移し、公開データの `ImageAsset` を更新する。
17. targetを `published` にし、`publishedPath` と `permissionId` または公開license根拠を記録する。
18. `npm run validate:data`, media audit, `npm run build`, `git diff --check` を実行する。
19. 変更したowner id、target key、source、rights根拠、却下候補、検証結果を報告する。

画像収集taskで、スペック・価格・用途・説明文の「ついで修正」をしない。別taskへ報告する。
`permission-requested` は実送信後だけ使う。依頼文draft作成だけなら `rights-review` のままにする。

## 11. AIの停止条件と報告形式

次の場合、AIは推測・自動補完・別素材へのすり替えをせず停止して報告する。

| code | 条件 |
|---|---|
| `MEDIA_RIGHTS_UNRESOLVED` | 公式素材だが再掲載条件を確認できない |
| `MANUAL_BROWSER_REQUIRED` | 403、ログイン、JS描画等で人間確認が必要 |
| `MODEL_IMAGE_AMBIGUITY` | 対象機体・世代・variantを一意に確認できない |
| `IMAGE_ROLE_AMBIGUOUS` | 画像roleを一意に判定できない |
| `ALTERATION_PERMISSION_REQUIRED` | crop・背景除去等が必要だが改変許諾がない |
| `LOGO_VARIANT_REVIEW_REQUIRED` | symbol/wordmark/combinedを一意に判定できない |
| `MEDIA_PERMISSION_SCOPE_GAP` | Web、商用、地域、期間、加工、creditのいずれかが欠ける |
| `MEDIA_TARGET_SCHEMA_GAP` | 現行role/variantでは正しく分類できない |
| `ROBOT_IDENTITY_GAP` | data上のRobotと公式製品体系が一致しない可能性がある |

報告形式:

```text
BLOCKED <code>
targetKey: <key>
ownerId: <id>
candidatePageUrl: <url or none>
confirmed:
- <確認できたこと>
unknown:
- <確認できないこと>
requiredHumanAction:
- <人が確認・回答すべきこと>
safeCurrentState: <resolution>
```

新しい有用roleが必要に見えても、AIは `ImageRole` を追加しない。
`MEDIA_TARGET_SCHEMA_GAP` として複数機体で本当に必要かを人間へ報告する。

## 12. 実装task

各taskは原則1commitにできる大きさにする。データモデル、権利方針、素材追加、UI変更を同じcommitへ混ぜない。

### 12.1 依存関係

```text
MEDIA-001 rights policy
  └─> MEDIA-003 permission SSOT
        └─> MEDIA-002 ledger / sync / audit
              └─> MEDIA-004 staging / public hygiene
                    ├─> MEDIA-005〜010 Robot B1〜B6
                    └─> MEDIA-011〜012 Logo L1〜L2
                          └─> MEDIA-013 final audit / archive
```

- MEDIA-001〜004が終わるまで新規binaryをproduction dataへ追加しない。
- RobotとLogoのcontent taskは別worktreeで並行可能だが、同じledgerを変更するため同時編集時はtarget範囲を分ける。
- `data/types.ts`, `lib/validate.ts`, `package.json` を触るfoundation taskをcontent PRへ混ぜない。

### 12.2 計画全体で変更するファイル / 変更しないファイル

変更対象は各taskの `Files` に限定する。特に次は素材調達taskでは変更しない。

- `components/RobotCard.tsx`, `components/FeaturedRobotCard.tsx`, `components/RobotImageCarousel.tsx`
- `src/app/robots/**`, `src/app/manufacturers/**`
- `data/articles.ts`, `data/useCases.ts`, `data/deployments.ts`
- `lib/specSchema.ts`, `lib/tagRegistry.ts`, Robotの価格・spec・用途フィールド

画像によってUIの問題が見つかっても、`MEDIA_UI_GAP` として別計画へ報告する。

### MEDIA-001: 公開rights policyの決定と整合

**Files**

- `lib/media.ts`
- `docs/planning/copyright_and_media_rights_policy_v1.md`
- `docs/planning/design_system_v1.md`
- `.env.example`
- 必要なら `lib/validate.ts`

**Problem**

既定の `reference-attributed` と商用公開の `commercial-strict` が矛盾し、`permission-requested` も表示対象になっている。

**Change**

- ユーザーがproduction policyを決定する。
- 推奨はproduction `commercial-strict`、許諾依頼中は非表示。
- code、env例、権利方針、デザインシステムを同時に整合させる。

**Completion**

- 各RightsStatusのproduction/local表示可否が文書とcodeで一致する。
- 現行26画像がどのpolicyで表示されるか自動集計できる。

**Validation**

- `npm run validate:data`
- `npm run build`
- `commercial-strict` / `reference-attributed` / `prototype` のresolver unit相当確認

### MEDIA-002: 調達台帳schema・同期・検証

**Files**

- `docs/data/media/robot-media-collection-ledger.json`（新規）
- `scripts/sync-media-targets.mjs`（新規）
- `scripts/audit-media.mjs`（新規）
- `package.json`
- 必要なら `lib/mediaCollectionSchema.ts`（新規）

**Problem**

未調査、候補なし、許諾待ち、禁止、公開済みを機械的に区別・集計できない。

**Change**

- published 61×7と25×3からtargetを同期する。
- 既存target・候補・判断を消さず、新規targetだけ追加する。
- key、slot、状態遷移、不変条件、重複、件数を検証する。
- 既存ImageAssetをbootstrapする。`commercial-permitted` / `licensed` / `own` は根拠確認後にpublished、
  `reference-attributed` / `permission-requested` はrights-review、`blocked` はprohibitedとして履歴を移す。
- 既存の空src blocked recordの `permissionNote` も、許可素材で上書きする前にcandidate/decision historyへ移す。

**Completion**

- snapshotでは502target、重複0。
- B1〜B6のRobot合計61・unique 61。
- L1〜L2のManufacturer合計25・unique 25。
- unresolved件数をresolution別、owner別、role別に出力できる。

**Validation**

- `npm run sync:media-targets`
- `npm run audit:media`
- 同期を2回実行して差分が出ないこと

### MEDIA-003: 共有許諾SSOT

**Files**

- `data/types.ts`
- `data/mediaPermissions.ts`（新規）
- `lib/validate.ts`
- `scripts/validate-data.mjs`
- `docs/data/README.md`
- `docs/planning/manufacturer-logo-usage-spec-v1.md`

**Problem**

1つの許諾を多数の `permissionNote` へ複製すると、期限・加工条件・撤回時の更新が分散する。

**Change**

- `MediaPermission` と `RightsMeta.permissionId?` を追加する。
- permissionId参照、active status、scope、expiryをvalidateする。
- 非公開証跡は `evidenceRef` だけで追跡する。

**Completion**

- 同じ許諾を複数ImageAssetから不変id参照できる。
- expired/revoked/不足scopeを公開可として扱えない。
- 機密原本がgitへ入らない。

**Validation**

- `npm run validate:data`
- `npm run build`
- 存在しないpermissionId、期限切れ、加工scope不足のfixture相当確認

### MEDIA-004: stagingとpublic漏洩防止

**Files**

- `.gitignore`
- `.media-staging/`（ローカル、非追跡）
- `scripts/audit-media.mjs`
- `public/images/robots/README.md`

**Problem**

未許諾素材を `public/` に置くとrights gateをURL直指定で迂回できる。

**Change**

- 未承認候補を `.media-staging/candidates/`、許諾済み公開前素材を `.media-staging/approved/` に分ける。
- `public/images/_local-prototype/` を公開収集の対象外としてpublic外へ移動または削除する。
- public内の未参照・非公開status・規格外ファイルをauditする。
- MEDIA-001でstrict運用を採用した場合、現行のreference-attributed Robot画像23ファイルとdraft PUDU画像を
  publicに残さず、許諾確認までstagingへ退避するか削除する。

**Completion**

- 採用policyで非公開となるstatusの素材が `public/` にない。
- stagingファイルがgit statusへ出ない。

**Validation**

- `git status --short`
- `npm run audit:media`
- `git ls-files public/images` の目視

### MEDIA-005〜010: RobotバッチB1〜B6

**Files**

- `docs/data/media/robot-media-collection-ledger.json`
- `data/robots.ts`
- `data/mediaPermissions.ts`（許諾追加時だけ）
- `public/images/robots/*`

**Problem**

61公開機体の画像coverageとrights確認が不完全。

**Change**

- §8の各バッチを順に処理する。
- 1PRを2〜4メーカー、最大10機体または20asset程度に分割する。
- 既存reference-attributed画像も新規素材と同じ基準で再審査する。

**Completion**

- バッチ内の全7role targetが `unsearched` 以外。
- 許諾可能な機体は2枚以上、不可な機体は理由付きplaceholder。
- targetと公開ImageAssetが一致する。

**Validation**

- `npm run validate:data`
- `npm run audit:media`
- `npm run build`
- `git diff --check`
- 対象Robotのカード・詳細・比較を目視

### MEDIA-011〜012: LogoバッチL1〜L2

**Files**

- `docs/data/media/robot-media-collection-ledger.json`
- `data/manufacturers.ts`
- `data/mediaPermissions.ts`（許諾追加時だけ）
- `public/images/manufacturers/logos/*`

**Problem**

published 25社中17社にstructured logoがなく、8社も継続的な権利・file page監査が必要。

**Change**

- §9のL1/L2を処理する。
- 人がvariantを分類する。
- SVGのscript、event handler、`foreignObject`、外部参照を検査する。

**Completion**

- 25社×3variantの全targetが `unsearched` 以外。
- 利用可能な会社は最低1variant公開、利用不可はテキスト名fallbackと理由がある。
- legacy `logo` を新規追加していない。

**Validation**

- `npm run validate:data`
- `npm run audit:media`
- `npm run build`
- Home世界地図、Robot/Manufacturerカード、詳細、比較、記事関連メーカーを目視

### MEDIA-013: 最終回帰監査と正本反映

**Files**

- `docs/planning/copyright_and_media_rights_policy_v1.md`
- `docs/data/README.md`
- `docs/planning/data-maintenance-checklist-v1.md`
- `docs/planning/manufacturer-logo-usage-spec-v1.md`
- `docs/planning/README.md`
- 本計画（完了後archive）

**Problem**

実装で確定した運用が一時計画にだけ残ると、次回のAIが旧手順へ戻る。

**Change**

- 継続ルールを正本へ反映する。
- 本計画を `docs/planning/archive/` へ移し、README分類を更新する。

**Completion**

- 現行code・正本docs・AI rulesの指示が一致する。
- active planとして残らない。

**Validation**

- `rg --no-ignore "robot-image-sourcing-plan|permission-requested|commercial-strict|MediaPermission" ai docs data lib`
- `npm run validate:data`
- `npm run audit:media`
- `npm run build`
- `git diff --check`

## 13. media auditで機械検査する項目

最低限、次をerrorまたは集計として実装する。

### Error

- target key重複。
- published Robot/Manufacturerに必要なtargetがない。
- archived/draftがactive targetに混入。
- 不正なresolution遷移・必須フィールド欠落。
- selectedCandidateIdの参照切れ。
- publishedPathとImageAsset.srcの不一致。
- `public/` の参照ファイル不存在。
- `public/` 内の、採用したproduction policyでは非表示になるstatusの素材。
- `licensed` / `commercial-permitted` の許諾根拠不足。
- 同一Robot内で同じsrcを複数roleに登録。
- 同一Manufacturer内で同じsrcを異なるvariantへ誤登録。
- 300KB超過。
- 最大幅1920px超過。
- `aspectRatio` のraw手入力。
- `logos.*` の空src。
- `heroImage` へのRobot新規画像登録。
- `public/images/robots/` と `public/images/manufacturers/logos/` の孤立ファイル。

### Warning / report

- Robotごとのdisplayable画像0/1/2/3枚以上。
- role別のpublished/no-candidate/prohibited/permission-requested件数。
- Manufacturer別のRobot画像coverage。
- logo variant別のcoverage。
- `checkedAt`、license、permission expiryの期限接近。
- 同一ファイルhashを複数Robotが共有している箇所。
- JPG/PNGのうちWebPへ安全に変換できる候補。

## 14. リスクと軽減策

| リスク | 何が起きるか | 軽減策 |
|---|---|---|
| 公式性と転載権の混同 | 公式site画像を無許諾で公開する | candidateのsourceTypeとMediaPermissionを別項目にし、strict gateを通す |
| 類似機種・variant誤認 | 別Robotの写真をカードへ表示する | ownerIdentityMatch、人の実画像目視、曖昧時停止codeを必須にする |
| role埋め優先 | 同じ場面・不要画像で7roleを水増しする | 7roleは調査slotであり公開枚数目標ではないと固定する |
| blocked履歴の消失 | 許可素材で上書きした際に過去の禁止根拠を失う | bootstrapでcandidate/decision historyへ移してから更新する |
| 許諾条件の重複 | 同じ契約の期限・加工条件が画像ごとにずれる | MediaPermissionを不変id参照する |
| 機密情報流出 | 許諾メール・契約書をpublic repositoryへcommitする | 公開要約とevidenceRefだけをgit管理する |
| public直URL漏洩 | rights gate外から未許諾画像へアクセスできる | 未承認はpublic外、auditでpublic/status整合をerrorにする |
| 候補URL失効 | CDN URLが変わり原典を再確認できない | assetUrlとは別に恒久的なpageUrlとcheckedAtを残す |
| 画像容量増大 | Home・一覧・詳細の表示性能が落ちる | 300KB/1920pxを自動error、batch単位で総容量を報告する |
| 大量差分のレビュー不能 | 機種誤認やrightsミスを見落とす | 2〜4メーカー、最大10機体または20assetでPR分割する |
| 並行作業の台帳競合 | candidateやresolutionを上書きする | 専用worktree、target範囲分割、同期前後の差分確認を行う |
| 件数の陳腐化 | 作業中のRobot追加を未調査のまま残す | fixed countではなくpublished dataから同期し、target不足をerrorにする |

## 15. 手動確認面

素材PRごとに、変更対象を含む次の面を確認する。

- `/` Home注目ロボット5件。
- `/` Homeロボットプレビュー。
- `/robots` RobotCardの画像比率、長い機体名、画像なし。
- `/robots/<slug>` の0枚、1枚、2枚以上カルーセル。
- Robot詳細の関連ロボットrail。
- `/compare` の代表画像。
- `/manufacturers` のロゴfallback。
- `/manufacturers/<slug>` の見出し、取り扱いRobot。
- `/reports/<slug>` の関連Robot/Manufacturer。
- metadata/JSON-LDに非表示素材URLが入らないこと。
- direct URLで未許諾素材へアクセスできないこと。

画像は実ファイルを人が開いて確認する。ファイル名・alt・source pageだけで機種一致を判断しない。

## 16. PR・commit規格

- Foundation（MEDIA-001〜004）と素材データを同じPRへ混ぜない。
- Robot画像とLogoは同じメーカーの小規模batchなら同一PR可。ただしtarget kind別にcommitを分ける。
- 1commitで変更するownerを明示する。
- 1PRは2〜4メーカー、最大10機体または20asset程度。
- 画像binaryだけを先に大量commitしない。対応する台帳・rights・data更新と同commitにする。
- rejected candidateや未許諾binaryをgit commitしない。
- 作業開始前後に `git status -sb` を確認する。
- 同一checkoutで別セッションを動かさず、専用worktreeを使う。

commit例:

```text
feat(media): add acquisition ledger and audit
content(robots): add permitted Unitree robot media
content(manufacturers): add reviewed manufacturer logos
docs(media): archive completed sourcing plan
```

## 17. 全体完了条件

次をすべて満たしたときだけ完了とする。

1. 実行時点のpublished Robot×7とpublished Manufacturer×3が台帳に存在する。
2. target keyの重複が0。
3. `unsearched`, `candidate-found`, `rights-review`, `approved`, `staged` の一時状態が0。
4. published 61機体がB1〜B6のちょうど1バッチに属する。
5. published 25社がL1〜L2のちょうど1バッチに属する。
6. 許諾可能なRobotは異なる画像2枚以上でカルーセル表示できる。
7. 2枚を用意できないRobotは `no-usable-candidate`, `permission-requested`, `prohibited` の理由を持つ。
8. 全Manufacturerは最低1つの公開logo、または理由付きテキストfallbackを持つ。
9. 公開素材は採用target、ImageAsset、ローカルファイル、permissionが相互に追跡できる。
10. `public/` に非公開・未参照・規格外素材がない。
11. 機密の許諾原本がrepositoryにない。
12. `npm run validate:data`, `npm run audit:media`, `npm run build`, `git diff --check` が通る。
13. §15の主要面を目視確認している。
14. 継続運用ルールを正本docsへ反映し、本計画をarchiveしている。

`permission-requested` は外部回答待ちとして残り得る。これは「画像公開完了」ではない。
ただし、依頼証跡・対象素材・安全なplaceholderが台帳で管理され、他の一時状態が0なら、
一括調達プロジェクトを閉じて継続的な許諾backlogへ移管できる。

## 18. 実行モデルへの最終命令

各作業開始時に、AIへ次をそのまま渡す。

```text
この作業では robot-image-sourcing-plan-v1.md を実行契約として扱う。

1. 指定されたbatch以外を変更しない。
2. target key単位で台帳を読み、unsearchedを残さない。
3. 公式ページであることと転載許可を別々に確認する。
4. 権利不明素材をpublic/や公開dataへ入れない。
5. role/variant/機種を推測しない。曖昧なら規定codeで停止報告する。
6. 画像以外のスペック・価格・用途・記事データを変更しない。
7. 既存candidate、blocked理由、permission履歴を削除・上書きしない。
8. 人間の目視が必要な箇所を自動処理済みにしない。
9. validate:data、audit:media、build、diff checkを実行する。
10. 対象id、target key、採否、権利根拠、変更ファイル、検証結果、残件を報告する。
```
