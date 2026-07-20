# メーカー実データ拡充 下書き調査・実装計画

作成日: 2026-06-02

## 1. 目的

`data/manufacturers.ts` のメーカー情報を、公開情報に基づいて拡充する。

今回の目的は、いきなり本番データを書き換えることではなく、AIが途中で中途半端な作業をしても破綻しないように、以下を分けて進めること。

1. 既存データ構造の把握
2. 現在掲載中の17社の網羅性確認
3. 追加候補3社の掲載妥当性確認
4. 下書き用データの作成
5. ファクトチェック
6. `data/manufacturers.ts` への反映

## 2. 前提

対象ユーザーは、ヒューマノイド導入に興味はあるがメーカー事情をまだ把握していない一般社会人・事業担当者。

メーカー情報の役割は、単なる会社紹介ではなく、以下を判断しやすくすること。

- どの会社が主要プレイヤーなのか
- どの地域・用途・事業段階に強いのか
- 日本から相談しやすいのか
- 代理店・直販・問い合わせのどれが現実的か
- ロボット一覧や記事ページとどう関連するのか

## 3. 既存コード調査結果

確認したファイル:

- `data/types.ts`
- `data/manufacturers.ts`
- `data/robots.ts`
- `lib/data.ts`
- `lib/media.ts`
- `components/ManufacturersBrowser.tsx`
- `src/app/manufacturers/[slug]/page.tsx`
- `docs/planning/humanoid_data_management_guide_v1.md`
- `docs/planning/humanoid_data_model_policy_v1.md`
- `docs/planning/copyright_and_media_rights_policy_v1.md`

### 3.1 型の真実源

実装上の真実源は `data/types.ts`。

`Manufacturer` は `BaseRecord` を継承しており、主なフィールドは以下。

- `slug`
- `summary`
- `publishStatus`
- `updatedAt`
- `reliability`
- `sources`
- `heroImage`
- `seo`
- `name`
- `nameJa`
- `companyType`
- `companyStatus`
- `country`
- `hqCity`
- `headquarters`
- `foundedYear`
- `website`
- `logo`
- `contactUrl`
- `description`
- `japanPresence`
- `domesticDistributors`
- `distributorNote`
- `supportNote`
- `procurementNote`
- `vendorRiskNote`
- `featuredRank`

### 3.2 日本対応のenum

`JapanPresence` は以下。

- `office`
- `distributor`
- `partner`
- `remote`
- `none`
- `unknown`

注意点:

- UI上の「相談ルート」としては、このenumを直接表示しない。
- 表示ラベルは既存のラベル関数・UI方針に合わせる。
- `domesticDistributors` がある場合は、代表代理店名と追加件数表示に使える。
- `none` / `unknown` の場合は、カードでは長文にせず「問い合わせ」導線へ寄せる方針。

### 3.3 画像・ロゴの型

画像は `ImageAsset`。

必須:

- `src`
- `alt`
- `rights`

推奨:

- `credit`
- `sourceUrl`

`rights` は以下を持つ。

- `status`
- `sourceType`
- `checkedAt`
- `rightsHolder`
- `licenseUrl`
- `permissionNote`

注意点:

- `sourceUrl` は出典リンクであり、利用許諾の証跡ではない。
- 公式サイト画像でも、再掲載可能とは限らない。
- 画像・ロゴは `lib/media.ts` の `getDisplayableAsset` / `canDisplayAsset` によって表示可否が制御される。
- 本番公開前提では `prototype-only` や `blocked` を表示してはいけない。

## 4. 現在掲載中のメーカー

`data/manufacturers.ts` には現在17社が掲載されている。

| slug | name | country | japanPresence |
|---|---|---|---|
| `unitree` | Unitree Robotics | China | `distributor` |
| `figure-ai` | Figure AI | USA | `unknown` |
| `apptronik` | Apptronik | USA | `unknown` |
| `agility-robotics` | Agility Robotics | USA | `unknown` |
| `onex` | 1X Technologies | Norway | `unknown` |
| `boston-dynamics` | Boston Dynamics | USA | `distributor` |
| `tesla` | Tesla | USA | `none` |
| `sanctuary-ai` | Sanctuary AI | Canada | `none` |
| `agibot` | AgiBot | China | `unknown` |
| `ubtech` | UBTECH Robotics | China | `distributor` |
| `fourier-intelligence` | Fourier Intelligence | China | `unknown` |
| `booster-robotics` | Booster Robotics | China | `distributor` |
| `kawasaki-heavy-industries` | 川崎重工業 | Japan | `office` |
| `neura-robotics` | NEURA Robotics | Germany | `distributor` |
| `kepler-robotics` | Kepler Robotics | China | `remote` |
| `leju-robotics` | Leju Robotics | China | `none` |
| `pal-robotics` | PAL Robotics | Spain | `remote` |

## 5. MECE確認方針

ここでのMECEは、数学的な完全網羅ではなく、サイトの目的に対して「主要メーカー一覧として過不足が少ないか」を確認するための実務的な整理とする。

### 5.1 評価軸

以下の軸で17社を確認する。

- 地域: 北米、中国、欧州、日本
- 用途: 産業・物流、研究・教育、家庭・汎用、接客・コミュニケーション
- 導入段階: 量産・限定販売・実証・研究開発・コンセプト
- 日本からの相談可能性: 国内拠点、国内代理店、海外直販、問い合わせ必須、不明
- サイト内関連: `robots` に代表機種があるか、`reports` に関連記事があるか

### 5.2 追加候補3社

Gemini案に含まれていた追加候補は、下書き調査対象として扱う。

| 候補 | 国 | 仮の掲載理由 | 注意点 |
|---|---|---|---|
| LimX Dynamics | China | CL-1等の二足歩行・汎用ロボット開発 | 現行17社と比べた商用導入・日本相談ルートを要確認 |
| XPENG Robotics | China | 自動車メーカー系の量産・資本力 | ヒューマノイドとしての掲載範囲、製品公開状況を要確認 |
| Engineered Arts | UK | Ameca等の著名なヒューマノイド | 産業導入より接客・展示寄り。サイト対象と合うか要判断 |

重要:

- 追加3社は即 `published` にしない。
- まず `draft` 相当の下書きデータとして作る。
- 既存の17社と同じ粒度で比較できない場合は、本番追加を見送る。

## 6. Gemini出力の扱い

Geminiの下書きには、公式確認が必要な断定が含まれている。

そのため、以下の扱いにする。

- Gemini出力は「調査仮説」として扱う。
- 事実として `data/manufacturers.ts` に直接反映しない。
- 公式発表・企業公式ページ・代理店公式ページ・信頼できる報道で裏取りする。
- 2024-2026の実績や出荷台数など、変化しやすい情報は必ず `checkedAt` を残す。
- 「Amazon 100拠点」「世界1位」「標準導入」などの強い表現は一次出典がない限り避ける。
- 予測や推定は `reliability: 'estimated'` または note で明示し、事実文に混ぜない。

## 7. 作成する下書きデータ

本番の `data/manufacturers.ts` を直接編集する前に、以下のどちらかで下書きを作る。

推奨:

- `docs/data/manufacturer-research-draft-2026-06-02.md`

必要なら追加:

- `docs/data/manufacturer-research-draft-2026-06-02.ts`

下書きMDには、各社ごとに以下を持たせる。

```md
## {name}

- slug:
- 掲載判断:
- 既存掲載 / 追加候補:
- companyType:
- companyStatus:
- country:
- hqCity:
- foundedYear:
- website:
- contactUrl:
- japanPresence:
- domesticDistributors:
- 代表機種:
- description 下書き:
- summary 下書き:
- supportNote 下書き:
- procurementNote 下書き:
- vendorRiskNote 下書き:
- sources:
- logo / image candidates:
- rights status:
- 未確認事項:
- 本番反映可否:
```

## 8. ソース調査ルール

### 8.1 優先順位

1. 企業公式サイト
2. 公式プレスリリース
3. 公式ブログ・公式ニュース
4. 国内代理店公式ページ
5. 展示会公式・登壇資料
6. 信頼できる業界メディア
7. 一般ニュース・二次情報

### 8.2 `Source.reliability`

使い分け:

- `official`: 企業公式・代理店公式・公式プレスリリース
- `verified`: 直接確認、問い合わせ回答、契約・許諾など
- `reported`: メディア報道
- `estimated`: 推定、未確認の概算、公開情報からの推測

### 8.3 禁止

- AIの記憶だけで事実を書く
- 公式画像URLを権利確認なしで本番表示する
- 報道記事の表現をそのまま要約文に流用する
- 出典が1つもないまま `published` 扱いにする
- `sources` と `rights` を混同する

## 9. 画像・ロゴ収集方針

### 9.1 収集対象

- メーカーロゴ
- 代表ロボットの公式画像
- 必要に応じてプレスキット・メディアキットのURL

### 9.2 記録する項目

`ImageAsset` として、少なくとも以下を記録する。

- `src`
- `alt`
- `credit`
- `sourceUrl`
- `rights.status`
- `rights.sourceType`
- `rights.checkedAt`
- `rights.rightsHolder`
- `rights.permissionNote`

### 9.3 権利ステータスの初期判定

| 状態 | 使い方 |
|---|---|
| `commercial-permitted` | 商用Web掲載が明示的に許可されている |
| `reference-attributed` | 出典明記で初期MVPに表示するが、明示許諾ではない |
| `permission-requested` | 許諾依頼中 |
| `prototype-only` | ローカル検証用。公開不可 |
| `blocked` | 利用不可 |

注意:

- 公式サイト上のロゴや製品写真は、原則 `commercial-permitted` ではなく `reference-attributed` または `permission-requested` から始める。
- 利用規約やメディアキットで再掲載条件が確認できた場合のみ `commercial-permitted` に上げる。
- 不明な画像は `prototype-only` か `blocked` にする。

## 10. 実装手順

### Phase 1: 既存データ監査

1. `data/types.ts` を再確認する。
2. `data/manufacturers.ts` の17社を一覧化する。
3. 各社の必須フィールド欠損を確認する。
4. `sources` の件数、信頼度、`checkedAt` の古さを確認する。
5. `logo.rights` の状態を確認する。
6. `robots` との関連を `manufacturerSlug` で確認する。
7. `reports.relatedManufacturerSlugs` との関連を確認する。

成果物:

- `docs/data/manufacturer-research-draft-2026-06-02.md`

### Phase 2: 17社の下書き拡充

1. 各社ごとに公式サイト・公式ニュース・代理店ページを確認する。
2. `summary` / `description` / `supportNote` / `procurementNote` / `vendorRiskNote` の下書きを作る。
3. 文章は長くしすぎず、買い手が判断するための情報に寄せる。
4. 断定が難しい内容は `要確認` とする。
5. 各社最低2件以上の `sources` を目標にする。

成果物:

- 17社分の下書きデータ
- 未確認事項リスト

### Phase 3: 追加候補3社の調査

1. LimX Dynamics、XPENG Robotics、Engineered Artsを調査する。
2. 現行17社と同じ型で記述できるか確認する。
3. 代表ロボットが `robots` に追加必要か確認する。
4. 産業導入・日本相談ルート・情報鮮度を確認する。
5. 掲載判断を `add` / `defer` / `reject` で分類する。

成果物:

- 追加候補3社の掲載判断
- 追加する場合の `slug` 案
- 追加しない場合の理由

### Phase 4: ファクトチェック

1. Gemini下書きの強い主張を抽出する。
2. 一次出典があるか確認する。
3. 公式未確認の数値・実績は表現を弱める。
4. `reliability` を適切に設定する。
5. `checkedAt` を2026-06-02以降の日付で更新する。

成果物:

- ファクトチェック済み下書き
- 本番反映してよい項目
- 本番反映を保留する項目

### Phase 5: 本番データ反映

1. `data/manufacturers.ts` を最小差分で更新する。
2. 型にない新フィールドは追加しない。
3. 新しい分類が必要な場合は、先に `data/types.ts` の変更計画を別途作る。
4. 追加候補3社は、掲載判断が固まったものだけ `publishStatus: 'draft'` で追加する。
5. `robots` 側に代表機種が必要な場合は、別計画に分ける。

## 11. 変更対象ファイル

### まず作る

- `docs/data/manufacturer-research-draft-2026-06-02.md`

### ファクトチェック後に変更する可能性がある

- `data/manufacturers.ts`
- `data/robots.ts`
- `data/reports.ts`

### 原則変更しない

- `data/types.ts`
- `lib/media.ts`
- `components/ManufacturersBrowser.tsx`
- `src/app/manufacturers/[slug]/page.tsx`

ただし、既存型で表現できない重要項目が出た場合は、別途「型変更計画」を作る。

## 12. 検証コマンド

`package.json` に存在するスクリプトに合わせ、以下を実行する。

```bash
npm run validate:data
npm run build
git diff --check
```

注意:

- `lint` / `typecheck` / `test` は現状の `package.json` scripts にはないため、勝手に存在する前提で実行しない。
- `npm run build` はTypeScriptチェックも兼ねる。

## 13. 手動確認項目

メーカー一覧:

- カードに長文が出ていないか
- 設立、代表機種、国内代理店、相談ルートが自然に見えるか
- 代理店が複数ある場合、代表1社 + 件数表示が破綻していないか
- `unknown` / `none` が問い合わせ導線として自然に見えるか

メーカー詳細:

- ファクトシートが過剰な文章になっていないか
- 関連ロボットと関連記事が正しく出るか
- 国内代理店リンクが正しいURLへ飛ぶか
- 外部リンクと問い合わせリンクの意味が混ざっていないか

画像・ロゴ:

- 権利不明の画像が本番表示されていないか
- `alt` が実態に合っているか
- ロゴの背景・余白・比率が崩れていないか
- 公式・提携・協賛と誤認させる配置になっていないか

レスポンシブ:

- 375px
- 768px
- 1024px
- 1440px

## 14. リスク

| リスク | 対策 |
|---|---|
| AIが未確認情報を断定する | すべて `sources` と `reliability` で管理する |
| 画像URLを権利確認なしで使う | `rights.status` と `getDisplayableAsset` の表示ゲートを守る |
| データ構造を理解せず新フィールドを増やす | `data/types.ts` を真実源にし、型変更は別計画に分ける |
| 17社と追加3社の粒度が揃わない | 追加候補は `draft` または下書き止まりにする |
| 代理店情報が古くなる | `checkedAt` を必ず残し、古い情報は要確認扱いにする |
| MECEが恣意的になる | 地域、用途、導入段階、日本相談ルートの軸で説明する |

## 15. Geminiへの実装指示テンプレート

```text
まず本番データは編集せず、下書き調査だけ行ってください。

目的:
data/manufacturers.ts のメーカー情報を実データで拡充するための下書きを作る。

必ず確認するファイル:
- data/types.ts
- data/manufacturers.ts
- data/robots.ts
- lib/data.ts
- lib/media.ts
- docs/planning/humanoid_data_management_guide_v1.md
- docs/planning/humanoid_data_model_policy_v1.md
- docs/planning/copyright_and_media_rights_policy_v1.md

ルール:
- data/manufacturers.ts を直接編集しない
- まず docs/data/manufacturer-research-draft-2026-06-02.md を作る
- 現在掲載中の17社をすべて対象にする
- LimX Dynamics、XPENG Robotics、Engineered Arts は追加候補として別扱いにする
- AIの記憶だけで事実を書かない
- 公式サイト、公式プレスリリース、代理店公式ページ、信頼できる報道を出典として記録する
- 各事実に checkedAt と reliability を付ける
- 画像・ロゴは sourceUrl だけでなく rights.status を必ず記録する
- 権利不明素材は prototype-only または blocked とする
- 強い主張は一次出典がない限り表現を弱める
- 新しい型やフィールドを勝手に追加しない

出力:
1. 既存17社の下書きデータ
2. 追加候補3社の掲載判断
3. ファクトチェックが必要な項目
4. 画像・ロゴ候補と権利状態
5. 本番反映してよい項目
6. 本番反映を保留する項目

まだ data/manufacturers.ts へ反映しないでください。
```

## 16. 完了条件

この計画の完了条件は以下。

- 17社すべての下書きがある
- 追加候補3社の掲載判断がある
- 各社に出典がある
- 画像・ロゴ候補に `rights` がある
- 未確認事項が明示されている
- `data/manufacturers.ts` へ反映する前にレビューできる
- `npm run validate:data` と `npm run build` が通る実装計画になっている
