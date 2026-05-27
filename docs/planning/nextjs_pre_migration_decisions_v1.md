# Next.js移行前の事前決定事項 v1

## 1. この文書の目的

Figma Makeで作った Vite/React UI を参照しながら、Next.js本番実装へ移る前に決めることを固定する。

目的は次の3つ。

- AIに一括変換させて構造が崩れるのを防ぐ
- UI、データ、CMS、URLの判断を先に揃える
- MVP後にCMSやDBへ移行しやすい形で実装を始める

---

## 2. 前提

### 既存Figma Make UIの扱い

`B2B Robot Buyer Portal UI` は本番コードではなく、**UI参照元** として扱う。

使うもの：

- 画面構成
- 情報の並べ方
- カード、一覧、3カラム構成などのUIパターン
- `robots / manufacturers / compare / guides / use-cases / reports` のページ役割

そのまま使わないもの：

- Vite構成
- `react-router`
- `routes.tsx`
- `src/main.tsx`
- `/posts`
- `/industries`
- 産業ロボット寄りの仮スペック項目

---

## 3. 技術スタックの決定

| 項目 | 決定 |
|---|---|
| フレームワーク | Next.js |
| Router | App Router |
| 言語 | TypeScript |
| UI | React |
| Styling | Tailwind CSS |
| 公開 | Vercel |
| 初期データ | ローカルTSデータ |
| CMS | 初期実装では未接続。ただしSanity前提で設計 |
| DB | 初期実装では不要 |

### 理由

- SEO対象になる詳細ページが多い
- 一覧、詳細、比較、関連コンテンツの構造が多層
- 将来CMS、保存機能、問い合わせ管理へ拡張しやすい
- Figma Make UIをReactコンポーネントとして移植しやすい

---

## 4. URLと名称の決定

| 画面 | 表示名 | URL |
|---|---|---|
| Home | Home | `/` |
| Robots | ロボット | `/robots` |
| Robot Detail | ロボット詳細 | `/robots/[slug]` |
| Manufacturers | メーカー | `/manufacturers` |
| Manufacturer Detail | メーカー詳細 | `/manufacturers/[slug]` |
| Compare | 比較 | `/compare` |
| Guides | ガイド | `/guides` |
| Guide Detail | ガイド詳細 | `/guides/[slug]` |
| Use Cases | 用途から探す | `/use-cases` |
| Use Case Detail | 用途詳細 | `/use-cases/[slug]` |
| Reports | 記事 | `/reports` |
| Report Detail | 記事詳細 | `/reports/[slug]` |
| About | 会社概要 / このサイトについて | `/about` |
| Contact | お問い合わせ | `/contact` |

### 使わないURL

- `/posts`
- `/industries`

---

## 5. ナビゲーションの決定

グローバルナビは以下。

```text
ロボット / メーカー / 比較 / ガイド / 用途から探す / 記事 / 会社概要 / お問い合わせ
```

### 優先度

MVPでまず作り切る優先順。

1. Home
2. Robots
3. Robot Detail
4. Manufacturers
5. Manufacturer Detail
6. Compare
7. Guides
8. Guide Detail

次点：

1. Use Cases
2. Use Case Detail
3. Reports
4. Report Detail

---

## 6. ページ役割の決定

### Home

役割：サイト全体のハブ。

既存Figma UIの `主要コンテンツカード` は参考にするが、単なる3カードでは弱い。  
Next.js実装では、以下の導線を明確にする。

- 探す：Robots
- 売り手を見る：Manufacturers
- 比べる：Compare
- 判断する：Guides
- 用途から逆引き：Use Cases
- 動向を見る：Reports

### Robots

役割：製品DBの入口。

既存Figma UIのグリッドとフィルタ構造は使う。  
ただし表示項目は変更する。

優先表示：

- 国内入手可否
- 調達形態
- 価格感
- 保守・サポート
- 導入段階
- 主要用途
- 出典あり/要確認

下げる項目：

- `6-axis`
- `repeatability`
- `cycle time`
- 汎用産業ロボット風スペック

### Robot Detail

役割：機種ごとの導入判断ページ。

最上部に出すもの：

- この機種は誰向けか
- 日本で買えるか
- どの用途に向くか
- 何が未確認か

主要セクション：

- Overview
- Japan Availability
- Procurement & Price
- Support & Maintenance
- Safety / Regulation
- Use Cases
- Specs
- Sources

### Manufacturers

役割：会社一覧ではなく、供給体制DB。

優先表示：

- 日本展開状況
- 国内代理店
- サポート体制
- 対応機種
- 公式窓口

### Manufacturer Detail

役割：そのメーカーから日本企業がどう調達・検証できるかを判断するページ。

主要セクション：

- Company Overview
- Japan Presence
- Distribution / Partners
- Supported Robots
- Support / Maintenance
- Related Reports
- Sources

### Compare

役割：候補機種の導入判断表。

既存Figma UIの左右サイドバーと選択UIは参考にする。  
ただしカードを並べるだけで終わらせない。

必須比較項目：

- 国内入手可否
- 調達形態
- 価格感
- 保守体制
- 安全・法規
- 用途適性
- 稼働時間
- 可搬重量
- 導入段階

### Guides

役割：意思決定ライブラリ。

既存Figma UIの3カラム構成は採用。

分類：

- Learn
- Evaluate
- Act

### Use Cases

役割：業界情報ではなく、用途発見UI。

既存Figma UIを採用。

URLは `/use-cases`。

### Reports

役割：ブログではなく、買い手向けインテリジェンス。

既存Figma UIを採用。

URLは `/reports`。

---

## 7. データモデルの事前決定

実装用の真実源は `nextjs_data_types_v1.ts`。Next.js プロジェクト作成後は、この内容を `data/types.ts` にコピーする。

この文書では方針だけを持ち、フィールド一覧の二重管理はしない。

### 共通方針

- 公開URLの識別子は `slug`
- 旧Figma Makeの `id` は `slug` に置き換える
- 全主要モデルに `publishStatus`, `updatedAt`, `reliability`, `sources` を持たせる
- `sources` はURL文字列配列ではなく、`Source[]` として `checkedAt` と `reliability` を持たせる
- 画像は `heroImage: ImageAsset` とし、`alt`, `credit`, `sourceUrl` を扱えるようにする
- enum値は英語トークンにし、UI側で日本語ラベルへ変換する

### コレクション

- `robots`
- `manufacturers`
- `guides`
- `useCases`
- `reports`

### 明示的に使わない名前

- `posts`: 旧名。今後は `reports`
- `industries`: 旧名。今後は `useCases` を主役にし、業界は `industryTags` で扱う
- `companies`: 将来検討余地はあるが、MVPのURL/UIは `manufacturers`

### 参照関係

- `Robot.manufacturerSlug` -> `Manufacturer.slug`
- `Robot.useCaseSlugs[]` -> `UseCase.slug`
- `Manufacturer.robotSlugs[]` -> `Robot.slug`
- `Guide.relatedRobotSlugs[]` -> `Robot.slug`
- `Guide.relatedUseCaseSlugs[]` -> `UseCase.slug`
- `UseCase.candidateRobotSlugs[]` -> `Robot.slug`
- `Report.relatedRobotSlugs[]` -> `Robot.slug`
- `Report.relatedManufacturerSlugs[]` -> `Manufacturer.slug`
- `Report.relatedUseCaseSlugs[]` -> `UseCase.slug`

### 実装時の配置

```txt
data/
  types.ts
  robots.ts
  manufacturers.ts
  guides.ts
  useCases.ts
  reports.ts
lib/
  robots.ts
  manufacturers.ts
  guides.ts
  useCases.ts
  reports.ts
```

`data/*.ts` は配列データだけを持つ。検索・filter・slug lookup は `lib/*.ts` に寄せる。

---

## 8. CMS方針の決定

### 初期実装

CMSは接続しない。  
`data/*.ts` でローカルデータを持つ。

### 設計上の第一候補

Sanity。

理由：

- robots / manufacturers / use-cases / guides / reports の関連が多い
- structured content と reference に強い
- Next.jsとの相性がよい

### 代替候補

microCMS。

選ぶ条件：

- 日本語UIを優先する
- 記事更新の簡単さを最優先する
- 関連モデルがそこまで複雑にならない

### 今決めないこと

- CMSの契約
- CMS接続実装
- 管理画面カスタマイズ
- DB
- 認証

---

## 9. コンポーネント設計の決定

### 共通化するもの

- `PageHeader`
- `Breadcrumbs`
- `StatusBadge`
- `InfoMetric`
- `SourceList`
- `RelatedContent`
- `FilterPanel`
- `SearchInput`
- `SegmentedControl`
- `RobotCard`
- `ManufacturerCard`
- `GuideCard`
- `UseCaseCard`
- `ReportCard`
- `ComparisonTable`

### 重要ルール

- `RobotCard` は robots 一覧、manufacturer detail、compare で使い回す
- `SourceList` は robot / guide / report 詳細で共通化する
- `RelatedContent` は guide / use-case / report 詳細で共通化する
- `ComparisonTable` は compare 専用にしつつ、表示項目は robots のデータモデルから生成する

---

## 10. データ取得層の決定

ページは直接 `data/*.ts` を読まない。  
必ず `lib/` の取得関数を通す。

想定：

```ts
getRobots()
getRobotBySlug(slug)
getManufacturers()
getManufacturerBySlug(slug)
getRobotsByManufacturerSlug(slug)
getGuides()
getGuideBySlug(slug)
getUseCases()
getUseCaseBySlug(slug)
getReports()
getReportBySlug(slug)
```

理由：

- CMS移行時に差し替えやすい
- ページ内のデータ加工を減らせる
- 関連コンテンツの取得ルールを一箇所に集約できる

---

## 11. SEOとメタデータの決定

Next.jsでは各詳細ページで `generateMetadata` を使う。

最低限：

- title
- description
- open graph title
- open graph description
- updated date 表示

詳細ページで必須：

- `/robots/[slug]`
- `/manufacturers/[slug]`
- `/guides/[slug]`
- `/use-cases/[slug]`
- `/reports/[slug]`

---

## 12. 移行前の未決定事項

今すぐ決めなくてよいが、後で判断する。

| 項目 | 判断タイミング |
|---|---|
| SanityかmicroCMSか | ローカルデータでMVPの型が固まった後 |
| DB | shortlist / inquiry 管理が必要になった時 |
| 認証 | 会員機能や企業管理画面が必要になった時 |
| 画像管理 | 実データ投入前 |
| 独自ドメイン | Vercel公開後 |
| 多言語 | 日本語版の導線が固まった後 |

---

## 13. 追加で検討すべき論点

現時点の計画で漏れやすいもの。移行前にすべて実装する必要はないが、設計上の置き場所は決めておく。

### 13-1. `manufacturers` と `companies` の扱い

現行のURLとUIは `manufacturers` だが、将来はメーカーだけでなく以下も扱う可能性がある。

- メーカー
- 国内代理店
- SIer
- OS / AI企業
- 研究機関

方針：

- URLは当面 `/manufacturers` のまま
- データモデル上は `companyType` を持たせる
- `companyType: manufacturer | distributor | integrator | ai-os | research`
- MVPでは `manufacturer` のみ表示
- 将来、代理店DBを出す時に `/partners` や `/companies` を再検討する

理由：

- 今すぐ `/companies` にすると買い手に分かりづらい
- ただしモデル上はメーカー以外を受けられるようにしておくべき

### 13-2. `reports` と `posts` の完全統一

方針：

- コード、URL、データモデルは `reports`
- UI表示は日本語で `記事` でもよい
- 内部名に `posts` を残さない

理由：

- `posts` はブログ感が強く、サイトの「買い手向けインテリジェンス」とズレる
- 旧Figma UIや旧文書の `posts` は移植時に置換する

### 13-3. `use-cases` と `industries` の完全統一

方針：

- URL、コード、データモデルは `useCases`
- UI表示は `用途から探す`
- 業界は use case の属性として扱う

理由：

- このページの役割は業界説明ではなく、用途発見
- `industries` を独立主役にすると、探索導線がぼやける

### 13-4. 画像管理

実データ投入前に決める。

最低限の方針：

- 初期はローカル画像または外部公式画像URLを使う
- 画像ごとに `imageCredit` と `imageSourceUrl` を持つ
- CMS移行時は Sanity Asset か microCMS 画像APIに移す
- 公式画像を使う場合、転載可否を確認する

必要フィールド：

- `heroImage`
- `imageAlt`
- `imageCredit`
- `imageSourceUrl`

### 13-5. 出典モデル

現状は `sources: string[]` だけだが、将来は弱い。

方針：

- MVPでは `sources` 配列でよい
- ただし shape は構造化しておく

推奨：

```ts
type Source = {
  title: string;
  url: string;
  publisher?: string;
  publishedAt?: string;
  checkedAt: string;
  reliability: 'verified' | 'official' | 'reported' | 'estimated';
};
```

理由：

- 価格、販売可否、代理店情報は更新頻度が高い
- `checkedAt` がないと、情報の古さをUIで出せない

### 13-6. Draft / Published / Archived

CMS前提なら公開状態を先に持つ。

推奨：

- `draft`
- `published`
- `archived`

用途：

- `draft`: 非公開
- `published`: 公開
- `archived`: 過去情報として残すが通常一覧では弱める

### 13-7. 比較機能の状態管理

MVPではDB不要。ただし比較状態の置き場所は決める。

方針：

- 初期はクライアント state
- URL query で比較対象を共有できるようにする
- 例：`/compare?robots=figure-02,unitree-h1`
- ログイン後の保存は将来DB

理由：

- DBなしでも比較リンクを共有できる
- 保存機能を後回しにできる

### 13-8. フィルタ状態のURL反映

一覧ページのフィルタは、可能ならURL queryに反映する。

対象：

- `/robots`
- `/manufacturers`
- `/use-cases`
- `/reports`

例：

- `/robots?availability=domestic&status=poc`
- `/use-cases?industry=logistics&task=picking`

理由：

- 検索流入、共有、ブラウザ戻る操作に強くなる
- 後からAnalyticsで需要を見やすい

### 13-9. 計測・Analytics

MVP公開時点で最低限の計測は入れる。

候補：

- Vercel Analytics
- Google Search Console
- Plausible

最低限見るもの：

- 流入ページ
- クリックされる詳細ページ
- 検索されるテーマ
- Contactクリック

### 13-10. 問い合わせ導線

Contact は最初からDB管理しない。

方針：

- 初期はメール直リンク or Formspree
- 問い合わせ種別を分ける
  - 情報提供
  - 掲載相談
  - 取材相談
  - 導入相談

理由：

- 将来の収益導線に直結する
- 最初から問い合わせ種別を分けておくと後で分析しやすい

### 13-11. UIトークン

Tailwindを使う場合でも、以下は先に決める。

- 背景色
- 文字色
- border色
- accent色
- radius
- card padding
- page max width
- 3カラム幅

理由：

- Figma Make UIをそのまま移すと、ページごとに微妙に余白や幅がズレやすい
- Next.js移行時にデザインの再現性が落ちる

### 13-12. MVP公開範囲とナビ表示

フルページ構成を作っても、公開時にナビへ出すかは別判断にする。

方針：

- 実装ルートは作ってよい
- 中身が薄いページはナビから外す
- 空ページは出さない
- 未完成ページを出す場合は `近日公開` ではなく、情報提供・掲載募集CTAに変換する

---

## 14. 筋が悪くなりやすい判断

### 14-1. Sanityを前提にしすぎる

Sanity第一候補は妥当。ただし、最初からSanity固有のクエリやschemaにUIを寄せすぎると、移行初期の速度が落ちる。

方針：

- UIはCMS非依存
- `lib/` で取得関数を抽象化
- CMS接続はMVPの型が固まってから

### 14-2. メーカーDBをメーカーだけに閉じる

導入現実の堀は、メーカーより国内代理店・SIer・保守体制にある。

方針：

- UIは `/manufacturers`
- データモデルは `companyType` を持つ
- 将来 `partners` や `companies` に分岐できるようにする

### 14-3. Compareをカード比較で終わらせる

カードを並べるだけでは、買い手の判断支援になりにくい。

方針：

- 比較表を必須にする
- 比較軸は導入判断変数を中心にする
- スペック比較は下段に置く

### 14-4. Reportsをニュース一覧にする

ニュース速報では勝ちにくい。

方針：

- `what happened` より `why it matters` を主役にする
- 日本の買い手にどう関係するかを書く
- ReportsはSEO用の記事一覧ではなく、判断材料の更新ログにする

### 14-5. Use Casesを業界説明に戻す

`用途から探す` の価値は業界紹介ではなく、タスク起点の発見。

方針：

- 業界はフィルタ
- 主役は task / use case
- 候補ロボットと関連ガイドへつなぐ

---

## 15. 追加検討チェックリスト

- [ ] `manufacturers` と `companyType` の関係を決めた
- [ ] `reports` に統一し、`posts` を残さない方針を決めた
- [ ] `use-cases` に統一し、`industries` を主役にしない方針を決めた
- [ ] 画像フィールドと画像出典の方針を決めた
- [ ] `Source` 型を構造化するか決めた
- [ ] draft / published / archived の公開状態を持つ方針を決めた
- [ ] compare の選択状態をURL queryで扱う方針を決めた
- [ ] 一覧フィルタをURL queryに反映する方針を決めた
- [ ] 最低限のAnalytics方針を決めた
- [ ] Contactの問い合わせ種別を決めた
- [ ] TailwindのUIトークンを決めた
- [ ] フル実装ページと公開ナビ表示を分けて考える方針を決めた

---

## 16. 移行開始前チェックリスト

- [ ] URLを `/reports` と `/use-cases` に統一した
- [ ] `id` ではなく `slug` を正式識別子にした
- [ ] robots の判断軸をスペック中心から導入判断中心に変えた
- [ ] manufacturers を会社紹介ではなく供給体制DBとして定義した
- [ ] compare に比較表を入れる方針を決めた
- [ ] `data/` と `lib/` を分ける方針を決めた
- [ ] CMSは初期接続しないがSanity前提で設計する
- [ ] ViteプロジェクトはUI参照元として扱う
- [ ] Next.jsプロジェクトは新規作成する

---

## 17. まだ詰めるべき論点

ここはNext.js移行そのものではなく、公開後にB2B buyer portalとして信頼されるための論点。

### 17-1. 掲載対象の定義

`humanoid robot` の境界を決めないと、データベースが曖昧になる。

決めること：

- 二足歩行 humanoid のみか
- 上半身 humanoid / mobile manipulator を含めるか
- 四足歩行・AMR・協働ロボットを除外するか
- 研究段階・コンセプト機を掲載するか

MVP方針：

- 主対象は humanoid / general-purpose robot
- 境界事例は `category` と `deploymentStage` で明示する
- 「買えるか」「問い合わせ可能か」「研究/発表段階か」をUIで分ける

### 17-2. 編集・検証フロー

ロボット情報は変わりやすい。出典だけでなく、確認日と信頼度が必要。

決めること：

- 公式情報を最優先ソースにするか
- 報道・展示会情報・推定値をどう表示するか
- 古くなった情報をどう検知するか
- AIで下書きした記事の人間確認ルール

MVP方針：

- 全データに `checkedAt` を持たせる
- 推定値は `estimated` と明示する
- 価格・納期・日本販売可否は断定しない
- 公開前チェックリストを記事/ロボット/メーカーごとに用意する

### 17-3. 収益化と編集独立性

広告・掲載相談・問い合わせ送客をやるなら、編集情報と有料枠を混ぜない設計が必要。

決めること：

- 広告枠を置くか
- Sponsored listing を許可するか
- メーカー/代理店から掲載依頼を受けるか
- 問い合わせ送客を成果計測するか

MVP方針：

- 初期は通常記事と掲載相談導線を分ける
- 有料掲載を始める場合は `sponsored` フィールドを持つ
- 比較順位やおすすめ表示に広告を混ぜる場合は明示する

### 17-4. 法務・免責

B2Bの導入判断に関わる情報なので、価格・スペック・安全性の扱いは慎重にする。

決めること：

- 免責文言
- プライバシーポリシー
- 問い合わせフォームの個人情報取得範囲
- Cookie / Analytics の表示要否
- 画像・ロゴ・スクリーンショットの権利処理

MVP方針：

- `/privacy` と `/terms` は公開前に用意する
- 価格・仕様・提供地域は「最終確認は公式へ」と明記する
- 画像は公式press kit、メーカー提供、または権利的に安全なものを優先する

### 17-5. 言語と地域スコープ

日本企業向けなら、日本市場に関係する情報を主軸にするべき。

決めること：

- サイト本文は日本語のみか
- ロボット名・企業名は英語表記を併記するか
- 日本での販売/サポート可否を必須項目にするか
- 将来英語版を持つか

MVP方針：

- UIと本文は日本語
- 固有名詞は英語原文を併記
- データには `japanAvailability` を必須級の判断軸として持つ

### 17-6. SlugとIDの永続性

CMS移行時にURLが変わるとSEOと内部リンクが壊れる。

決めること：

- slug変更を許可するか
- 旧slugのredirectをどう管理するか
- CMS移行後もローカル時代のslugを維持するか

MVP方針：

- `slug` は公開URLの永続IDとして扱う
- 表示名変更ではslugを変えない
- どうしても変える場合はredirect一覧を持つ

### 17-7. 検索機能

一覧フィルタだけで足りるか、サイト内検索を入れるかは早めに決める。

決めること：

- MVPで検索バーを出すか
- 検索対象は robots / manufacturers / reports / guides / useCases の全部か
- 日本語検索をどう扱うか

MVP方針：

- 初期は一覧フィルタ中心
- Homeには検索風UIを置いてもよいが、未実装なら見せない
- 本格検索はコンテンツ数が増えてから検討する

### 17-8. 問い合わせ後の運用

フォームを置くなら、受けた後の処理まで決めないとB2B導線として弱い。

決めること：

- 送信先メール
- 自動返信
- スプレッドシート保存
- CRM連携
- 問い合わせ種別ごとの対応フロー

MVP方針：

- 初期はフォーム送信 + メール通知 + 管理用スプレッドシートで十分
- DB化は問い合わせ量が増えてから
- 導入相談と掲載相談は別の種別にする
