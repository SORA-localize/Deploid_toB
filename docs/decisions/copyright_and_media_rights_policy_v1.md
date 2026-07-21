---
status: current
updated: 2026-07-19
---

# 著作権・商標・メディア権利対策ポリシー v1

Last reviewed: 2026-07-19

> この文書は、公開Webサイトとしてヒューマノイド関連情報を扱うときの著作権・商標・画像利用・引用・出典管理の運用方針をまとめる。法的助言ではなく、個人運営でも事故を起こしにくくするための実務ルールとして使う。

---

## 0. この版での方針転換

旧版（〜2026-05-29）は「権利が確認できない画像は公開しない」を原則とし、`reference-attributed` を初期MVPのみの暫定状態として扱っていた。

この版では、素材を積極的に集める方向へ方針転換する。

- ロゴ・製品画像は、メーカーが利用条件を明示していなくても、明確な禁止表示がなく、かつ公式チャネルから取得したものであれば掲載する。
- これは「だから安全」という意味ではない。実務上のリスクは残ることを理解した上で、①導入検討者への実在確認・視認性向上、②ヒューマノイド業界がまだ認知拡大を歓迎しやすい段階にあることを踏まえたメーカーとの関係構築の入口、という2つのメリットを取りにいく事業判断として、意図的にリスクを取る。
- 「禁止と明記されていない」ことは「許可されている」ことの証明ではない。判断に迷った場合の既定値をどちらに倒すかという運用上の選択であり、削除依頼が来れば即座に応じる前提で成立している。

---

## 1. 基本方針

このサイトは、メーカーや報道機関のコンテンツを転載するサイトではなく、公開情報をもとに導入判断用の構造化情報を作るサイトとして運用する。

原則：

1. `credit` や出典リンクは、許諾の代わりにならない。事実確認の出典（`sources`）と、素材の利用権限（`rights`）は別に管理する。
2. 取得元は公式チャネル（後述 §2）に限定する。第三者サイト・報道記事・SNS転載からは取得しない。
3. 明確な禁止表示（§3）に該当する素材は使わない。
4. 文章は必ず自分の言葉で要約・分析し、外部記事の表現をなぞらない。
5. 数値・事実・発表内容は `sources` に残す。
6. 削除・修正依頼には迅速に対応する。この迅速対応が、事前許諾を取らずに掲載する判断の前提条件になる。

---

## 2. 掲載前調査

各メーカーについて、以下の優先順位で確認する。

### 2.1 ブランド・メディアページ

優先順位：

1. Brand Guidelines
2. Media Kit
3. Press Kit
4. Newsroom
5. Press
6. Media Resources

確認事項：

- ロゴ利用条件
- 製品画像利用条件
- 報道利用可否
- 商用利用可否
- 加工可否
- クレジット表記

### 2.2 利用規約

以下を確認する。

- Terms of Use
- Copyright
- Legal
- Intellectual Property

確認事項：

- 画像転載禁止
- 商用利用禁止
- ロゴ利用条件

### 2.3 取得対象

利用条件が公開されておらず、§3の禁止表示にも該当しない場合、次のみから取得する。

- 公式サイト
- 公式プレスリリース
- 公式News
- 公式Productページ

第三者サイト（販売店、リセラー、報道機関、まとめサイト、SNS転載）からは取得しない。独立した比較サイトが、他者の許諾関係にただ乗りする形になるため。

---

## 3. 明確な禁止事項の判定

以下に該当する場合は「利用禁止」と判断する。

- 「事前許可が必要」と明記
- 「無断転載禁止」
- 「Do not use without permission」
- 「No commercial use」
- ブランドガイドラインで対象用途外と明記
- 個別メールで利用不可の回答を受けた

これらは掲載対象外とするか、個別交渉を行う（§7のステータスE）。

条件付き許可（「報道目的のみ」「editorial use only」等）は、Deploidの実際の用途（広告枠・スポンサー表示ではなく、導入判断用の編集的なロボット/メーカー解説）がその条件に収まるかを個別に判断する（§7のステータスD）。収まらない、または判断がつかない場合は掲載しない。

---

## 4. 加工方針

許容する加工：

- リサイズ
- トリミング
- 背景透過
- 背景色追加
- カードデザインへの最小限のレイアウト調整

禁止する加工：

- ロゴ改変
- 色変更
- ロボット形状変更
- AI生成による描き直し
- ウォーターマーク削除
- ロゴ削除
- ブランドイメージを損なう加工

---

## 5. ロゴ表示時の追加ルール

ロゴは著作権だけでなく商標上のリスク（提携・認定の誤認）を伴うため、画像利用ルールに加えて次を守る。

- 「公式」「認定」「提携」「推薦」を示すような配置にしない。
- ロゴ一覧を「協賛企業」「導入先」「パートナー」のように見せない。
- サイトロゴやナビの主役にしない。
- 色・比率・余白を改変しない。
- 可能な場面ではロゴではなくテキスト名で足りることを優先する（一覧のフィルタ表示など、認識速度が主目的の場面ではロゴが有効）。

---

## 6. 掲載後対応

掲載後、可能な範囲でメーカーへ通知する。

通知内容：

- Deploidの目的（日本向けヒューマノイド導入検討者への情報提供）
- 掲載URL
- 使用箇所（robot detail page / manufacturer profile 等）
- 修正・差し替え・削除依頼への迅速対応を約束する旨
- より適切な素材があれば提供を歓迎する旨

通知を送った・送っていない、返答があった・なかった、を記録する（§9データモデル）。

---

## 7. 権利ステータス

`ImageAsset.rights.status`（既存の `RightsStatus` 型、`data/types.ts`）は変更しない。運用上の判断ラベルとして、次のA〜Eを `RightsStatus` にマッピングして使う。

| 運用ラベル | 意味 | `RightsStatus` | 公開可否 |
|---|---|---|---|
| A | 正式許諾・メーカー提供素材あり | `own` / `licensed` / `commercial-permitted` | 可 |
| B | ブランドガイドライン等で商用Web利用が明示的に可能と確認 | `commercial-permitted` | 可 |
| C | 利用条件は不明だが、公式チャネル取得かつ禁止表示なし | `reference-attributed` | 可（この版からMVP限定ではなく標準運用とする） |
| D | 条件付き許可があるが、Deploidの用途が条件を満たすか個別判断が必要 | `permission-requested`（判断がつくまでは非公開） | 判断確定まで不可 |
| E | 明確な禁止表示、または個別に利用不可の回答 | `blocked` | 不可 |

`reference-attributed`（ラベルC）は、旧版では「初期MVPの暫定許容」だったが、この版からは§0の方針に基づき本番運用の標準状態として扱う。表示ポリシーの環境変数運用（§10）も、これに合わせて`reference-attributed`を本番の既定値とする。

---

## 8. 文章・引用ルール

（変更なし。旧版から継続。）

### 8.1 要約・分析

外部記事や公式発表を使う場合、本文は以下の形にする。

- 事実は `sources` に紐づける。
- 文章表現は自分で書き直す。
- 公式コピーや報道記事の見出し・リード文をなぞらない。
- 数字、日付、会社名、製品名は出典を残す。
- 推測・解釈は「推定」「報道ベース」「公式未確認」と分ける。

### 8.2 引用

引用は例外的に使う。

許容しやすい例：

- 短い公式発言を批評・分析のために使う。
- 規約やライセンス条件の要点を短く引用する。
- 読者が原文確認できるよう、出典リンクを置く。

避ける例：

- プレスリリース本文を長く貼る。
- 記事の見出し・本文・箇条書きをほぼ同じ構成で再利用する。
- 仕様表を他サイトから丸ごとコピーする。
- Markdown本文内に長い引用ブロックを入れる。

日本法上の引用は、出典明記だけでは足りない。公表された著作物であること、公正な慣行に合うこと、引用目的上正当な範囲であること、明瞭な区別性や主従関係などを確認する。

---

## 9. データモデル

現在の実装では `data/types.ts` の `ImageAsset` に `rights` を必須で持たせる（型定義自体は変更しない）。

```ts
export type RightsStatus =
  | 'own'
  | 'licensed'
  | 'commercial-permitted'
  | 'reference-attributed'
  | 'permission-requested'
  | 'prototype-only'
  | 'blocked';

export type MediaSourceType =
  | 'own'
  | 'manufacturer-official'
  | 'partner-official'
  | 'press-release'
  | 'third-party'
  | 'unknown';

export interface RightsMeta {
  status: RightsStatus;
  sourceType: MediaSourceType;
  checkedAt: ISODate;
  rightsHolder?: string;
  licenseUrl?: string;
  permissionNote?: string;
}

export interface ImageAsset {
  src: string;
  alt: string;
  credit?: string;
  sourceUrl?: string;
  rights: RightsMeta;
}
```

素材ごとに次を記録する運用とする（現状は `permissionNote` に自由記述でまとめる。件数が増えて管理しづらくなったら、`RightsMeta` へ `contactLog`（通知日・通知内容・返答）のような構造化フィールドを足すことを検討する。これは型変更を伴うので、必要になった時点で別タスクとして起票する）。

- 取得元URL（`sourceUrl`）
- 取得日（`checkedAt`）
- 加工内容
- 利用条件の判定結果（A〜E）
- 通知・連絡履歴

---

## 10. 公開ゲート

公開前チェックは次の順に行う。

1. `publishStatus: 'published'` のレコードだけ対象にする。
2. `heroImage`, `images`, `logo` の `rights.status` を確認する。
3. 表示は `lib/media.ts` の `canDisplayAsset(asset)` を通す。
4. `prototype-only`, `blocked`, `rights` 未設定は非表示にする。
5. `body` に長い引用、スクリーンショット、外部画像がないか確認する。
6. `sources` が空の重要コンテンツは公開しない。
7. SEO文言が外部コピーや過度な商標利用になっていないか確認する。

表示ポリシーは環境変数で切り替える（コードは変更なし、運用上の既定値のみ変更）。

| `NEXT_PUBLIC_MEDIA_USAGE_POLICY` | 表示されるstatus | 用途 |
|---|---|---|
| `reference-attributed` | `own`, `licensed`, `commercial-permitted`, `reference-attributed`, `permission-requested` | 本番運用の既定値（この版から標準） |
| `commercial-strict` | `own`, `licensed`, `commercial-permitted` | 広告・スポンサー表示など、商用色が特に強い画面に限定したいとき |
| `prototype` | `commercial-strict` + `reference-attributed`, `permission-requested`, `prototype-only` | ローカルUI確認用 |

```ts
const commercialStatuses: RightsStatus[] = ['own', 'licensed', 'commercial-permitted'];
const referenceStatuses: RightsStatus[] = [
  ...commercialStatuses,
  'reference-attributed',
  'permission-requested',
];

export function canDisplayAsset(asset?: ImageAsset) {
  return Boolean(asset?.rights && referenceStatuses.includes(asset.rights.status));
}
```

`prototype` はローカル実行・限定確認だけで使う。スクリーンショットをSNSや営業資料に載せる画面では使わない。

---

## 11. 現状のリスク監査

### 高リスク

- `data/robots.ts` の `Robot.images`
  - Unitree, Figure/BMW, Apptronik, Agility, 1X等の公式画像/CDN画像を参照している。
  - `rights.status: 'reference-attributed'` として管理済み。この版からはこれを本番の標準状態として扱う。
  - 一部URLは404/403になっており、技術的にも不安定（`npm run check:source-links` で定期確認する）。

- `data/manufacturers.ts` の `Manufacturer.logo`
  - ロゴは商標リスクがある。§5のロゴ表示ルールを常に適用する。
  - `rights.status: 'reference-attributed'` として管理済み。

### 中リスク

- `data/useCases.ts`
  - `sources: []` のまま業界・用途の一般論を書いている。著作権より事実性リスクが中心。

- `summary`, `description`, `whyItMatters`, `keyTakeaways`
  - 短文でも外部記事の構成や表現を寄せすぎると危険。

### 低リスク

- `Source.title`, `url`, `publisher` — 出典表示として必要。
- `tags`, `manufacturerId`, `product name` — 会社名・製品名の事実表示は通常必要。
- `public/favicon.svg`, `src/app/opengraph-image.tsx` — 自前資産なら問題は小さい。

### 未決事項（`launch-readiness-meta-plan-v1.md` より2026-07-20転記、archive済み）

- カード画像すべてに visible credit が必要か、詳細ページの credit と全体方針の明記で足りるか、未確定
- コンテンツ別 OGP 画像に元メディア素材を直接使うか、生成したブランドカードを使うか、未確定

---

## 12. 運用フロー

新しいロボット・メーカー・記事を追加するとき：

1. 事実確認用の `sources` を集める。
2. 画像・ロゴが必要か判断する。
3. §2の優先順位でブランド・メディアページ、利用規約を確認する。
4. §3の禁止表示に該当しないか確認する。
5. 該当しなければ、公式チャネル（サイト・プレスリリース・News・Productページ）から取得する。第三者サイトからは取得しない。
6. §7のA〜Eで判定し、対応する `rights.status` を設定する。
7. §6の掲載後通知を行い、通知履歴を残す。
8. 本文は自分の言葉で書く。直接引用は短く必要な場合だけにする。
9. 公開前に `sources` と `rights` をレビューする。

---

## 13. Brand & Copyrightページ（サイト側対応）

サイトに専用ページを設置する（未実装、別タスク）。

内容：

- 公式に公開されている情報・画像を利用していること
- 権利者からの修正・削除依頼を受け付けること
- 依頼への迅速対応を約束すること
- 問い合わせ先

---

## 14. 参考資料

- 文化庁: 著作権について知っておきたい大切なこと
  https://www.bunka.go.jp/seisaku/chosakuken/taisetsu/index.html

- 文化庁: 文化芸術活動に関する法的問題についてよくあるご質問
  https://www.bunka.go.jp/seisaku/bunka_gyosei/kibankyoka/faq/index.html?s=09

- 特許庁: Effects of Trademark Rights
  https://www.jpo.go.jp/e/system/trademark/gaiyo/effects_trademark.html

- Creative Commons: Creative Commons Licenses
  https://creativecommons.org/share-your-work/use-remix/cc-licenses/

- Stanford Copyright and Fair Use Center: The Basics of Getting Permission
  https://fairuse.stanford.edu/overview/introduction/getting-permission/

- U.S. Copyright Office: What is Copyright?
  https://www.copyright.gov/what-is-copyright/

---

## 15. 一言まとめ

このサイトでは、出典管理と権利管理を分ける。

`sources` は「事実をどこで確認したか」。
`rights` は「その素材をこのサイトで使ってよいか」。

この版からは、`rights` が不明な素材について「禁止と明記されておらず、公式チャネル取得であれば使う」という既定値を取る。これは安全という意味ではなく、実在確認とメーカー関係構築のメリットを取りにいく事業判断であり、削除依頼への迅速対応とセットで初めて成立する。
