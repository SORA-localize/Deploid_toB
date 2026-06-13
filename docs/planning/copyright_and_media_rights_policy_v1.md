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

## 2. デモ利用の現実的な線引き

広告をまだ載せていない、個人が作る、カンファレンスで紹介する、という事情はリスクを下げる要素にはなる。ただし、このサイトは将来的に広告、スポンサー、送客、問い合わせ、案件獲得、有料レポートなどのビジネス導線に使う前提である。したがって、公開URL・登壇・資料・外部共有に出すものは商用利用として扱う。

特に、次の状態は私的利用ではなく公開利用に近い。

- インターネット上のURLで誰でも見られる。
- カンファレンスの登壇画面で映す。
- 登壇動画が録画・配信・アーカイブされる。
- スライドやスクリーンショットが配布・SNS投稿される。
- デモサイトをQRコードやURLで参加者に渡す。

このサイトでは、デモ段階を以下に分けて扱う。

| phase | 想定 | 画像・ロゴの扱い |
|---|---|---|
| `local-prototype` | 自分のPCだけでUI検証する | 怪しい画像を仮置きしてもよいが、公開・録画・配布しない |
| `restricted-demo` | 少人数に一時的に見せる、URL非公開、noindex、パスワード付き | 未許諾画像は原則避ける。使う場合も `prototype-only` として明示し、録画・配布しない |
| `conference-demo` | カンファレンス登壇や公開デモで紹介する | 商用前提の公開利用として扱う。商用利用許諾済み、CC等の商用可ライセンス、自作画像に寄せる |
| `public-demo` | 誰でもアクセスできるデモURL | 本番扱い。未許諾画像・ロゴは出さない |
| `production` | 継続運用、SEO、問い合わせ導線あり | `own`, `licensed`, `commercial-permitted` のみ表示 |

結論：

- `local-prototype` では Humanoid Hub, Humanoid Guide, Humanoid-robots.io などを参考にした見た目検証をしてよい。
- `conference-demo` では、怪しい画像をそのまま出さない。将来商用化するサイトの紹介なので、録画なしでも対外利用として扱う。
- `public-demo` では、広告なしでも本番と同じ権利基準にする。

リファレンスサイトの読み方：

- Humanoid Hub は、メーカー提供素材を前提にしている可能性が高い。参考にすべきは「メーカー提供画像として管理する」運用であって、画像URLを真似ることではない。
- Humanoid Guide や Humanoid-robots.io は、メーカー画像にクレジットを付けているが、外部から許諾有無は確認できない。見た目や情報設計の参考にはできるが、権利根拠にはしない。
- IEEE Spectrum / ROBOTS Guide やTech系メディアは、媒体としての取材・プレス提供・編集利用の関係で画像を使っている可能性がある。個人サイトが同じ条件とは限らない。
- 販売店サイトは、販売契約や代理店関係に基づいてメーカー画像を使っている可能性がある。独立リファレンスサイトの根拠にはしない。

カンファレンス紹介用の現実解：

1. まずは画像なしでも成立するUIにする。
2. メーカー名はテキスト表示を基本にする。
3. 画像が必要な箇所は、商用利用許諾済み・CC等の商用可ライセンス確認済み・自作図解・メーカー提供画像を優先する。
4. 未許諾の公式画像を使う場合は `local-prototype` か `restricted-demo` に閉じる。
5. 登壇資料や録画に残る画面では、未許諾画像を映さない。
6. 登壇・外部共有・デモURL公開をする場合は `public-demo` とみなし、未許諾画像を非表示にする。

---

## 3. 掲載許諾の取り方

個人や学生でも、掲載許諾をもらえる可能性はある。ただし、このサイトは将来的に商用利用する前提なので、非営利利用として許諾を取らない。最初から「将来的に広告・スポンサー・送客・問い合わせ・有料コンテンツ等につながる可能性がある公開Webサイト」と説明する。

商用利用前提にすると許諾ハードルは上がる。それでも、用途・掲載範囲・表示方法を狭く切れば、メーカー側がPR/露出として許可する余地はある。

通りやすい依頼：

- 大学生個人が運営する初期プロジェクトだが、将来的な商用利用可能性があると正直に説明する。
- 使用画像を数点に絞る。
- 使う場所を明確にする。例: robot detail page, manufacturer profile, conference slide。
- 現時点では広告・課金・スポンサー表示なし。ただし将来追加可能性があると明記する。
- 公式・公認・提携・推薦を示さないと明記する。
- 指定クレジットを表示すると明記する。
- 削除依頼があれば速やかに取り下げると明記する。
- できればスクリーンショットや仮URLを添える。

通りにくい依頼：

- 「公式サイトの画像を自由に使っていいですか」と広く聞く。
- 期間・場所・目的を曖昧にする。
- 非営利デモと説明して許諾を取った後に、広告・スポンサー・送客・有料機能を追加する。
- ロゴ利用、画像加工、再配布、ダウンロード提供まで同時に求める。
- 返信前に公開してから事後承諾を求める。

最初に狙う依頼先：

| 会社 | 連絡先の例 | 備考 |
|---|---|---|
| Unitree | `marketing@unitree.com` | 公式ContactにMarketing宛メールがある |
| Agility Robotics | Press / Media Inquiry | 公式PressページにPress Teamへの問い合わせ導線がある |
| Apptronik | Contact Us / Press Releases経由 | Press ReleasesページからContact Usへ行ける |
| Figure AI | 公式Contactフォーム | Terms上は明示的な書面許諾が必要。フォーム経由で依頼する |
| 1X | Press Gallery / Contact | Press Galleryはmedia use only条件があるため、商用サイト掲載は個別確認する |

依頼するときは、最初から商用利用可能性を伝える。ただし許可範囲は狭くする。

> Public website use of selected product images on a humanoid robot reference website that may later include ads, sponsorship, lead generation, affiliate links, paid reports, or other commercial features, with credit, no endorsement claim, no image redistribution, and takedown on request.

許諾が来たら、次を保存する。

- メール本文またはフォーム返信。
- 許可された画像URLまたはファイル名。
- 許可された用途。
- クレジット表記。
- 改変・トリミング・再ホスト可否。
- 有効期限。
- 返信者名、所属、日付。

許諾メールが曖昧な場合は、以下だけ追加確認する。

1. May I use these images on a public demo website?
2. May I show the website in a conference presentation and recorded talk?
3. What credit line should I display?
4. May I resize or crop the images for layout?
5. Is permission still valid if the site later adds ads, sponsorship, lead generation, affiliate links, paid reports, or other commercial features?

---

## 4. 対象範囲

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

## 5. 権利ステータス

画像・ロゴ・動画・PDF・引用ブロックなど、第三者コンテンツの可能性があるものには、次のどれかの状態を付ける。

| status | 意味 | 公開可否 |
|---|---|---|
| `own` | 自分で制作・撮影し、必要な許諾も取れている | 可 |
| `licensed` | 有償/無償ライセンスがあり、Web公開条件を満たす | 可 |
| `commercial-permitted` | 公式素材・第三者素材について、商用Web掲載が明示的に許可されている | 可 |
| `reference-attributed` | 出典・権利者を明記し、参照用途として初期公開する。商用再掲載の明示許可は未取得 | 初期MVPでは可。ただし削除依頼に即応し、将来は許諾取得へ移行 |
| `permission-requested` | 許諾依頼中。表示条件は `reference-attributed` と同じだが、交渉状態を区別する | 初期MVPでは可。拒否・条件不一致なら即 `blocked` |
| `prototype-only` | UI検証用の仮置き。権利未確認 | 公開不可。ローカルまたは限定デモのみ |
| `blocked` | 利用不可、または条件に合わない | 不可 |

本サイトの初期MVPでは、リファレンスサイトと同様に出典明記ベースの `reference-attributed` を許容する。ただし、これは許諾取得済みを意味しない。メーカー交渉・削除依頼対応・将来の厳格化に備えて、コード上は `rights.status` と表示ゲートで必ず管理する。

営業資料、広告、協賛表示、公式提携のように見える画面、または商用色が強い運用へ移す場合は、`NEXT_PUBLIC_MEDIA_USAGE_POLICY=commercial-strict` に切り替え、`own`, `licensed`, `commercial-permitted` のみ表示する。

---

## 6. 画像利用ルール

### 6.1 使ってよい候補

優先順位：

1. 自分で撮影した写真、または自分で作成した図解。
2. 商用Web利用が明示された有償ストック素材。
3. `CC BY`, `CC BY-SA`, `CC BY-ND` など商用利用可能なライセンス素材。ただし表示条件を守る。
4. 公式media kit / press kitで、商用Webサイト・カンファレンス資料での利用が許可されている素材。
5. メーカーから商用利用を含む書面許諾を得た素材。

### 6.2 避けるもの

使わない：

- Google画像検索で見つけた画像。
- メーカー公式サイトやCDNの画像URLを、許諾確認なしで直リンクすること。
- SNS投稿、YouTube、動画、PDFから切り出したスクリーンショット。
- 報道機関の記事画像。
- press kitでも、用途が「press purposes only」「editorial use only」に限定される素材。
- 出典不明のWikimedia以外の転載画像。
- `CC BY-NC` など非商用限定ライセンスの素材。
- 非営利利用として許諾された素材を、将来商用化するサイトに載せ続けること。

### 6.3 表示時のルール

- 画像の近くに `Photo: 権利者名` または `Image: 権利者名` を表示する。
- `sourceUrl` は情報源リンクであり、許諾証跡ではない。別途 `rights` を持つ。
- ロボット全身や製品画像は `object-contain` を基本にし、切り抜きで誤認させない。
- 画像を加工・トリミング・背景除去する場合は、ライセンスが改変を許すか確認する。
- 実機写真ではなく生成画像やイメージ図の場合は、実機写真と誤認しないラベルを付ける。

---

## 7. ロゴ・商標ルール

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

## 8. 文章・引用ルール

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

現在の実装では `data/types.ts` の `ImageAsset` に `rights` を必須で持たせる。

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

## 10. 公開ゲート

公開前チェックは次の順に行う。

1. `publishStatus: 'published'` のレコードだけ対象にする。
2. `heroImage`, `images`, `logo` の `rights.status` を確認する。
3. 表示は `lib/media.ts` の `canDisplayAsset(asset)` を通す。
4. `prototype-only`, `blocked`, `rights` 未設定は非表示にする。
5. `body` に長い引用、スクリーンショット、外部画像がないか確認する。
6. `sources` が空の重要コンテンツは公開しない。
7. SEO文言が外部コピーや過度な商標利用になっていないか確認する。

表示ポリシーは環境変数で切り替える。

| `NEXT_PUBLIC_MEDIA_USAGE_POLICY` | 表示されるstatus | 用途 |
|---|---|---|
| `reference-attributed` | `own`, `licensed`, `commercial-permitted`, `reference-attributed`, `permission-requested` | 初期MVPの公開運用 |
| `commercial-strict` | `own`, `licensed`, `commercial-permitted` | 営業・広告・商用色が強い運用 |
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

現時点で追加対応が必要な項目：

### 高リスク

- `data/robots.ts` の `Robot.images`
  - Unitree, Figure/BMW, Apptronik, Agility, 1X の公式画像/CDN画像を参照している。
  - `rights.status: 'reference-attributed'` として管理済み。
  - 商用Web再掲載の明示許可は未確認なので、メーカー交渉後に `commercial-permitted` へ昇格させる。
  - 一部URLは404/403になっており、技術的にも不安定。
  - 厳格運用では `NEXT_PUBLIC_MEDIA_USAGE_POLICY=commercial-strict` に切り替える。

- `data/manufacturers.ts` の `Manufacturer.logo`
  - ロゴは商標リスクがある。
  - `rights.status: 'reference-attributed'` として管理済み。
  - ブランドガイドラインや許諾確認は未完了。
  - 厳格運用では `commercial-permitted` 以外は非表示になり、テキスト名表示にフォールバックする。
  - カンファレンス資料では、メーカー名テキストだけで足りるならロゴを使わない。

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

- `tags`, `manufacturerId`, `product name`
  - 会社名・製品名の事実表示は通常必要。ただしロゴ・装飾・提携表現は別リスク。

- `public/favicon.svg`, `src/app/opengraph-image.tsx`
  - 自前のサイト資産なら問題は小さい。外部ロゴやロボット画像をOGPに入れる場合は再確認が必要。

---

## 12. 運用フロー

新しいロボット・メーカー・記事を追加するとき：

1. 事実確認用の `sources` を集める。
2. 画像やロゴを使う必要があるか判断する。
3. 必要なら、公式media kit、ブランドガイドライン、利用規約、ライセンスを確認する。
4. `rights.status` を入れる。
5. 出典明記で初期公開する素材は `reference-attributed`、許諾依頼中は `permission-requested`、商用利用可が明示されたら `commercial-permitted` に更新する。
6. 本文は自分の言葉で書く。
7. 直接引用は短く、必要な場合だけにする。
8. 公開前に `sources` と `rights` をレビューする。

表示ポリシーを切り替えるとき：

1. 初期MVPは `NEXT_PUBLIC_MEDIA_USAGE_POLICY=reference-attributed` を使う。
2. 営業・広告・商用色が強くなったら `commercial-strict` に切り替える。
3. `prototype` はローカル実行に閉じる。スクリーンショットをSNSや資料に載せない。
4. 登壇・録画・配布・営業・商談・公開URL・将来の広告/送客/問い合わせ導線がある場合は `prototype` を使わない。

許諾依頼時に確認する項目：

- 使いたい素材のURLまたはファイル名。
- 利用媒体: public website。
- 利用目的: robot/manufacturer profile, buyer research, editorial database。
- 収益化可能性: ads, affiliate, sponsorship, lead generation, paid report の有無。
- 地域: Japan / worldwide。
- 期間: indefinite / one year など。
- 改変: resize, crop, format conversion の可否。
- クレジット表記の指定。
- 再ホストの可否。

---

## 13. 参考資料

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

- 1X Press Gallery
  https://www.1x.tech/press

- Agility Robotics Press and Media
  https://www.agilityrobotics.com/press

- Unitree Contact
  https://www.unitree.com/contact/

---

## 14. 一言まとめ

このサイトでは、出典管理と権利管理を分ける。

`sources` は「事実をどこで確認したか」。  
`rights` は「その素材をこのサイトで使ってよいか」。

この2つを混ぜると、クレジットを書いたから使えるという危険な状態になる。公開運用では、未許諾素材を表示しない設計を先に入れる。

デモ版で一時的に見た目を作ることと、公開サイトで継続表示することも分ける。

`prototype-only` は「今だけUIを見るための仮置き」。
`public-demo` と `production` は、広告の有無にかかわらず商用公開利用として扱う。
