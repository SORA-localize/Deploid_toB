# 著作権・商標・メディア権利対策ポリシー v1

Last reviewed: 2026-05-29

> この文書は、公開Webサイトとしてヒューマノイド関連情報を扱うときの著作権・商標・画像利用・引用・出典管理の運用方針をまとめる。法的助言ではなく、個人運営でも事故を起こしにくくするための保守的な実務ルールとして使う。

---

## 1. 基本方針

このサイトは、メーカーや報道機関のコンテンツを転載するサイトではなく、公開情報をもとに導入判断用の構造化情報を作るサイトとして運用する。

原則：

1. 権利が確認できない画像・ロゴ・動画・スクリーンショットは公開しない。
2. `credit` や出典リンクは、許諾の代わりにならない。
3. 公式サイトに載っている画像でも、再掲載してよいとは限らない。
4. 文章は必ず自分の言葉で要約・分析し、外部記事の表現をなぞらない。
5. 数値・事実・発表内容は `sources` に残す。
6. 画像やロゴは、事実確認の出典とは別に「利用権限」を管理する。
7. 迷う素材は使わない。必要ならテキスト名と外部リンクで代替する。

特に日本向けに公開する場合、非営利や個人運営であっても、ネット公開は私的利用とは別扱いになる。文化庁も、SNS等への一般公開では原則として権利者の許諾が必要と説明している。

---

## 2. 対象範囲

このポリシーは以下を対象にする。

| 対象 | 現在の主なフィールド | 主なリスク |
|---|---|---|
| ロボット写真 | `BaseRecord.heroImage`, `Robot.images` | 写真の著作権、CDN直リンク、商用再掲載不可 |
| メーカーロゴ | `Manufacturer.logo` | 商標、ロゴ図案の著作権、提携誤認 |
| 本文Markdown | `Guide.body`, `Report.body` | 外部記事・プレスリリースの表現コピー、長い引用 |
| 短文コンテンツ | `summary`, `description`, `overview`, `whyItMatters`, `keyTakeaways`, `comparison` | 事実の無出典化、外部表現の要約コピー |
| SEO文言 | `seo.metaTitle`, `seo.metaDescription`, `metadata.description` | 外部コピー・商標誤認・広告的表現 |
| 出典情報 | `Source.title`, `Source.url`, `Source.publisher` | 引用元タイトルの扱い、リンク先の信頼性 |
| 将来の埋め込み | YouTube, X, PDF, slides, screenshots | 埋め込み規約、スクリーンショット転載、肖像・ロゴ |
| 生成画像 | AI生成画像、図解、アイコン | 学習元・類似性・実機誤認・商標混入 |
| ユーザー投稿 | listing request, correction request | 投稿者が権利を持たない素材の混入 |

---

## 3. 権利ステータス

画像・ロゴ・動画・PDF・引用ブロックなど、第三者コンテンツの可能性があるものには、次のどれかの状態を付ける。

| status | 意味 | 公開可否 |
|---|---|---|
| `own` | 自分で制作・撮影し、必要な許諾も取れている | 可 |
| `licensed` | 有償/無償ライセンスがあり、Web公開条件を満たす | 可 |
| `official-permitted` | 公式素材で、利用条件上このサイトで使える | 可 |
| `press-editorial` | press kit等で報道・編集用途に限定 | 個別判断。一般公開DBでは原則避ける |
| `permission-requested` | 許諾依頼中 | 不可 |
| `permission-required` | 許諾が必要だが未取得 | 不可 |
| `blocked` | 利用不可、または条件に合わない | 不可 |
| `unknown` | 権利未確認 | 不可 |

公開ページに出してよいのは、原則 `own`, `licensed`, `official-permitted` のみ。

`press-editorial` は、報道記事としての文脈・利用条件・広告や収益化の有無・地域条件を確認できる場合だけ例外扱いにする。個人運営で守りを固めるなら、`press-editorial` も非表示にする。

---

## 4. 画像利用ルール

### 4.1 使ってよい候補

優先順位：

1. 自分で撮影した写真、または自分で作成した図解。
2. 商用Web利用が明示された有償ストック素材。
3. `CC BY`, `CC BY-SA`, `CC BY-ND` など商用利用可能なライセンス素材。ただし表示条件を守る。
4. 公式media kit / press kitで、このサイトの用途が許可されている素材。
5. メーカーから書面で許諾を得た素材。

### 4.2 避けるもの

使わない：

- Google画像検索で見つけた画像。
- メーカー公式サイトやCDNの画像URLを、許諾確認なしで直リンクすること。
- SNS投稿、YouTube、動画、PDFから切り出したスクリーンショット。
- 報道機関の記事画像。
- press kitでも、用途が「press purposes only」「editorial use only」に限定される素材。
- 出典不明のWikimedia以外の転載画像。
- `CC BY-NC` など非商用限定ライセンスの素材。

### 4.3 表示時のルール

- 画像の近くに `Photo: 権利者名` または `Image: 権利者名` を表示する。
- `sourceUrl` は情報源リンクであり、許諾証跡ではない。別途 `rights` を持つ。
- ロボット全身や製品画像は `object-contain` を基本にし、切り抜きで誤認させない。
- 画像を加工・トリミング・背景除去する場合は、ライセンスが改変を許すか確認する。
- 実機写真ではなく生成画像やイメージ図の場合は、実機写真と誤認しないラベルを付ける。

---

## 5. ロゴ・商標ルール

メーカー名や製品名は、事実説明としてテキストで使うことを基本にする。

ロゴを使う場合の条件：

- 公式ブランドガイドライン、media kit、または書面許諾がある。
- 色・比率・余白を改変しない。
- サイトロゴやナビの主役にしない。
- 「公式」「認定」「提携」「推薦」を示すような配置にしない。
- ロゴ一覧を「協賛企業」「導入先」「パートナー」のように見せない。
- 可能ならロゴではなくテキスト名を使う。

日本では商標権者は指定商品・サービスに関連して登録商標を独占的に使う権利を持つ。単なる事実説明の会社名表示と、ロゴをブランド表示として使うことはリスクが違う。

---

## 6. 文章・引用ルール

### 6.1 要約・分析

外部記事や公式発表を使う場合、本文は以下の形にする。

- 事実は `sources` に紐づける。
- 文章表現は自分で書き直す。
- 公式コピーや報道記事の見出し・リード文をなぞらない。
- 数字、日付、会社名、製品名は出典を残す。
- 推測・解釈は「推定」「報道ベース」「公式未確認」と分ける。

### 6.2 引用

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

## 7. データモデルへの追加案

現在の `ImageAsset` は `credit` と `sourceUrl` だけなので、権利管理には足りない。次のような型を追加する。

```ts
export type RightsStatus =
  | 'own'
  | 'licensed'
  | 'official-permitted'
  | 'press-editorial'
  | 'permission-requested'
  | 'permission-required'
  | 'blocked'
  | 'unknown';

export interface RightsMeta {
  status: RightsStatus;
  rightsHolder?: string;
  licenseName?: string;
  licenseUrl?: string;
  permissionUrl?: string;
  permissionNote?: string;
  allowedUses?: string[];
  prohibitedUses?: string[];
  checkedAt: ISODate;
  expiresAt?: ISODate;
  riskNote?: string;
}

export interface ImageAsset {
  src: string;
  alt: string;
  credit?: string;
  sourceUrl?: string;
  rights?: RightsMeta;
  fit?: 'contain' | 'cover';
}
```

将来、Markdown本文にも引用や埋め込みを入れるなら、`Guide` / `Report` に次のような管理項目を足す。

```ts
export interface ContentRightsReview {
  checkedAt: ISODate;
  hasThirdPartyQuotes: boolean;
  hasEmbeddedMedia: boolean;
  hasScreenshots: boolean;
  reviewerNote?: string;
}
```

---

## 8. 公開ゲート

公開前チェックは次の順に行う。

1. `publishStatus: 'published'` のレコードだけ対象にする。
2. `heroImage`, `images`, `logo` の `rights.status` を確認する。
3. `unknown`, `permission-required`, `permission-requested`, `blocked` は公開ページで非表示にする。
4. `press-editorial` は初期設定では非表示にする。
5. `body` に長い引用、スクリーンショット、外部画像がないか確認する。
6. `sources` が空の重要コンテンツは公開しない。
7. SEO文言が外部コピーや過度な商標利用になっていないか確認する。

実装では、表示コンポーネント側に `canDisplayAsset(asset)` を置き、未許諾画像はプレースホルダーにする。

```ts
const publicImageStatuses: RightsStatus[] = ['own', 'licensed', 'official-permitted'];

export function canDisplayAsset(asset?: ImageAsset) {
  return Boolean(asset?.rights && publicImageStatuses.includes(asset.rights.status));
}
```

---

## 9. 現状のリスク監査

現時点で追加対応が必要な項目：

### 高リスク

- `data/robots.ts` の `Robot.images`
  - Unitree, Figure/BMW, Apptronik, Agility, 1X の公式画像/CDN画像を参照している。
  - `credit` と `sourceUrl` はあるが、商用Web再掲載の許諾状態がない。
  - 一部URLは404/403になっており、技術的にも不安定。
  - 公開用には `rights.status` を追加し、未許諾なら非表示にする。

- `data/manufacturers.ts` の `Manufacturer.logo`
  - ロゴは商標リスクがある。
  - 現在は公式ロゴ/ファビコンを表示しているが、ブランドガイドラインや許諾確認がない。
  - 公開用にはテキスト名表示を基本にし、ロゴは `official-permitted` 以外非表示にする。

### 中リスク

- `data/guides.ts` の `Guide.body`
  - 現在 `sources: []` のまま、Figure/BMW/Apptronik/Agility/AMR等の具体例に触れている。
  - 文章自体は独自分析寄りだが、事実主張の出典を残すべき。
  - 関連する `reports` や公式発表を `sources` に追加する。

- `data/useCases.ts`
  - `sources: []` のまま業界・用途の一般論を書いている。
  - 著作権より事実性リスクが中心。ただし外部資料から作った場合は出典を残す。

- `summary`, `description`, `whyItMatters`, `keyTakeaways`
  - 短文でも外部記事の構成や表現を寄せすぎると危険。
  - 今後AIで生成・要約する場合は、原文と似すぎていないか確認する。

### 低リスク

- `Source.title`, `url`, `publisher`
  - 出典表示として必要。ただし記事タイトルを大量に集めた一覧を独立コンテンツ化しない。

- `tags`, `manufacturerSlug`, `product name`
  - 会社名・製品名の事実表示は通常必要。ただしロゴ・装飾・提携表現は別リスク。

- `public/favicon.svg`, `src/app/opengraph-image.tsx`
  - 自前のサイト資産なら問題は小さい。外部ロゴやロボット画像をOGPに入れる場合は再確認が必要。

---

## 10. 運用フロー

新しいロボット・メーカー・記事を追加するとき：

1. 事実確認用の `sources` を集める。
2. 画像やロゴを使う必要があるか判断する。
3. 必要なら、公式media kit、ブランドガイドライン、利用規約、ライセンスを確認する。
4. `rights.status` を入れる。
5. `unknown` や `permission-required` の素材は公開ページに出さない。
6. 本文は自分の言葉で書く。
7. 直接引用は短く、必要な場合だけにする。
8. 公開前に `sources` と `rights` をレビューする。

許諾依頼時に確認する項目：

- 使いたい素材のURLまたはファイル名。
- 利用媒体: public website。
- 利用目的: robot/manufacturer profile, buyer research, editorial database。
- 収益化可能性: ads, affiliate, sponsorship, paid report の有無。
- 地域: Japan / worldwide。
- 期間: indefinite / one year など。
- 改変: resize, crop, format conversion の可否。
- クレジット表記の指定。
- 再ホストの可否。

---

## 11. 参考資料

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

- BMW Group PressClub Legal Notices  
  https://www.press.bmwgroup.com/global/info/legal

- Figure AI Terms & Conditions  
  https://www.figure.ai/terms-and-conditions

---

## 12. 一言まとめ

このサイトでは、出典管理と権利管理を分ける。

`sources` は「事実をどこで確認したか」。  
`rights` は「その素材をこのサイトで使ってよいか」。

この2つを混ぜると、クレジットを書いたから使えるという危険な状態になる。公開運用では、未許諾素材を表示しない設計を先に入れる。
