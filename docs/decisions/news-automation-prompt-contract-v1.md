---
status: current
updated: 2026-07-10
---

# ニュース収集・記事化自動化データ契約 v1

Last reviewed: 2026-07-10

この文書は、ChatGPT Scheduled Tasks の日次出力を CLI 側AIが機械的に Deploid の公開記事データへ変換するための契約を定める。

この文書に、ChatGPTへ登録する日次プロンプト本文は固定しない。プロンプト本文はタスク設定側で管理し、ここでは以下だけを正本にする。

- ChatGPT Scheduled Tasks が返す日次 JSON スキーマ
- ChatGPT 側で完了すべき調査・執筆品質
- CLI 側AIがその JSON を受け取ったときの変換ルール
- 週次ニュースレターの作り方
- 重複記事を作らないための機械判定ルール

## 0. 基本方針

日次タスクの目的は「今日のニュースを1本のダイジェストにすること」ではない。記事化する価値のある公開ニュースを最大3本選び、それぞれを Deploid の通常ニュース記事として公開できる本文データまで作る。

週次ニュースレターは ChatGPT Scheduled Tasks の外部検索タスクとして実行しない。原則として、その週に Deploid で公開済みの日次ニュース記事を CLI 側AIが読み、ニュースレター本文へ編集する。週次で新規検索を始めると日次との重複・抜け・品質差が出るため、週次はローカル記事データからの配信用編集に限定する。

CLI 側AIは日次記事について補足検索をしない。CLI 側AIがしてよいのは、現行リポジトリ上の既存ID照合、型変換、重複確認、URL形式確認、指定済み画像候補の保存可否確認、`npm run validate:data` 実行だけである。ChatGPT 出力に本文・出典・画像候補・タグ候補が不足している場合、CLI 側AIは検索で補わず、該当記事を作成しない。

重複が疑われる記事は新規作成しない。CLI 側AIは `data/articles.ts` の既存記事を読み、同じニュースなら既存記事の更新候補として扱うか、編集せず重複理由を報告する。

## 1. 日次ニュース記事バッチ

### 1-1. 件数と優先順位

日次タスクは `articles` を最大3本に限定する。原則3本を目指すが、公開品質に達するニュースが3本ない日は無理に埋めない。

優先順位は以下。

1. 実導入・商用契約: 導入企業、現場、作業、台数、契約形態が分かるもの
2. 製品・価格・販売条件: 新モデル、価格、予約、販売地域、RaaS、保守、納期
3. 量産・供給体制・資金調達: 工場、出荷台数、IPO、資金調達、M&A、主要提携
4. 安全・規制・政策: 法規制、標準、補助金、国家戦略、認証、安全要件
5. 大手企業との提携・導入準備: 自動車、物流、EC、空港、製造大手の実装に近い発表

バズ動画、論文単体、出典1本の噂、内容の薄いプレスリリースは原則 `excludedItems` または `watchItems` に回す。

### 1-2. サムネイル・画像候補

日次タスクは、各記事に必ず `heroImagePlan` を入れる。画像なしの記事を作る前提にしない。

優先順位:

1. 既存の汎用ライセンス素材で代替できる場合は `reuse_existing_generic` を指定する
2. 既存のロボット/メーカー素材が権利上使える場合だけ `reuse_existing_robot_or_article_image` を指定する
3. 既存素材がない場合は、Unsplash / Pexels など商用Web利用可能な汎用素材を調査し、`download_from_candidate` を指定する
4. 権利が不明な公式画像、報道画像、SNS画像、動画スクリーンショットは使わない

`heroImagePlan.mode: "leave_empty"` は例外である。使う場合は `mechanicalConversionNotes` に、なぜ既存素材・汎用素材で代替できないかを書く。

既存汎用素材の例:

- 遠隔操作・VR: `/images/article-generic/teleoperation-vr/vr-headset-hands-outstretched.jpg`
- 工場・産業自動化: `/images/article-generic/industrial-automation/factory-orange-machines.jpg`
- 物流・倉庫: `/images/article-generic/logistics-warehouse/forklift-warehouse-pallets.jpg`
- 政策・政府: `/images/article-generic/policy-government/china-flags-skyscrapers.jpg`, `/images/article-generic/japan-policy/japan-flag-building.jpg`
- 安全・認証: `/images/article-generic/safety-certification/construction-safety-helmet.jpg`
- 資金調達: `/images/article-generic/finance-funding/stock-chart-dark-screen.jpg`
- 展示・イベント: `/images/article-generic/conference-expo/speaker-stage-audience.jpg`, `/images/article-generic/conference-expo/crowd-seated-event.jpg`

### 1-3. 記事本文品質

ChatGPT は `docs/decisions/editorial_style_guide_v1.md` と `docs/plans/editorial-methodology-review-2026-06-24.md` の要点を適用した本文を出す。

必須条件:

- 対象読者は日本の toB 事業者の導入検討者・意思決定者
- だ・である調
- プレスリリース翻訳ではなく、公開情報の構造化と解釈にする
- 「何が起きたか」より「導入判断のどの変数が動いたか」を重視する
- 数字、固有名詞、日付、台数、顧客名は出典にあるものだけを書く
- 公式未確認の報道は「報じた」と明記する
- 未確認点を本文内に明記する
- `body` は公開記事に近い完成稿にする。CLI 側AIに本文生成を任せない
- 冒頭で「これは読者にとって何が変なニュースなのか」「なぜ今読む価値があるのか」を具体的に立てる
- 正確さを優先しつつ、文の順番は「注意書き」からではなく「読者が続きを読みたくなる差分」から始める
- 筆者の視点は、主観的な感想ではなく「導入検討者ならここで引っかかる」という編集判断として出す

禁止:

- 長い引用・翻訳
- 「革新的な」「画期的な」「ゲームチェンジャー」「業界全体を変える」
- 「まとめると」「総じて言えば」「今後の動向が注目される」で逃げる締め
- 「なぜ重要か」「まとめ」「Deploid読者への示唆」などの汎用見出し
- 動画デモを実運用・商用導入と断定すること
- 本文中で「Wiredによれば」「The Robot Reportは」「ロボスタの記事では」のように媒体名を主語にして進めること

出典名の扱い:

- 原則として本文中に媒体名を出さない。出典は `sources[]` に置く
- 本文では「報道では」「公式発表では」「論文では」程度に抽象化する
- 媒体名を本文に出してよいのは、出典そのものが論点になる場合だけである
- 例外: Natureなどの学術論文、政府文書、規制当局文書、公式発表主体、調査会社レポート、独占報道であることが読解に必要な場合

読み味の参考:

- GIGAZINE型: タイトルと冒頭で具体的な差分・数字・新しさを先に出し、記事内では画像や短い段落でテンポよく事実を積み上げる
- Gizmodo型: 筆者の体験・違和感・驚きをフックにし、読者が「自分にも関係ある」と感じる問いから入る
- Deploidでは一人称や過度な軽さは使わないが、「報告書のように注意事項を並べる」のではなく、最初に読者の判断が動くポイントを提示する

本文量の目安:

- `news-brief`: 1,200〜1,800字
- `tech-update`: 1,500〜2,500字
- `deployment-report`: 2,000〜3,500字
- `market-analysis` / `policy-update` / `analysis`: 2,500〜4,000字
- `event-report`: 1,200〜2,000字

### 1-4. 日次 JSON スキーマ

ChatGPT Scheduled Tasks は、必ず JSON コードブロック1つだけを返す。

```json
{
  "schema": "deploid_daily_article_batch_v1",
  "taskKind": "daily_article_generation",
  "runDate": "YYYY-MM-DD",
  "timezone": "Asia/Tokyo",
  "targetArticleCount": 3,
  "actualArticleCount": 0,
  "coverageWindow": {
    "from": "YYYY-MM-DDTHH:mm:ss+09:00",
    "to": "YYYY-MM-DDTHH:mm:ss+09:00",
    "label": "直近24〜48時間"
  },
  "sourcePasses": [
    {
      "name": "official-newsrooms|official-social|wire-services|industry-media|japanese-sources|policy-sources",
      "status": "completed|partial|not-checked",
      "notes": ""
    }
  ],
  "selectionPolicyApplied": {
    "maxArticles": 3,
    "priorityOrder": [
      "deployment_or_commercial_contract",
      "product_pricing_or_sales_condition",
      "mass_production_funding_or_supply",
      "policy_safety_or_regulation",
      "major_enterprise_partnership"
    ],
    "weakItemsWereNotPadded": true
  },
  "articles": [
    {
      "article": {
        "idHint": "kebab-case-id",
        "slugHint": "kebab-case-id",
        "dedupeKey": {
          "eventType": "deployment|product|pricing|funding|production|policy|safety|research|event|partnership|other",
          "eventDate": "YYYY-MM-DD or unknown",
          "primaryEntityNames": [],
          "primaryRobotNames": [],
          "primarySourceUrls": [],
          "canonicalClaimJa": "このニュースの重複判定に使う1文。誰が、何を、いつ発表/実施/報道したかを書く。"
        },
        "title": "English title",
        "titleJa": "日本語タイトル",
        "type": "news-brief|deployment-report|tech-update|market-analysis|policy-update|event-report|analysis|case-study",
        "category": "news|company-report|analysis|policy|interview",
        "section": "deployment|business|tech|policy|entertainment",
        "summary": "記事カード用の日本語要約。何が起き、導入判断のどの変数が動いたかを2〜3文で書く。",
        "publishStatus": "published",
        "reliability": "official|reported",
        "publishedAt": "YYYY-MM-DD",
        "author": "Deploid Research",
        "industryTags": [],
        "regionTags": [],
        "themeTags": [],
        "whyItMatters": "導入検討者向けの核心。1〜2文。",
        "keyTakeaways": [],
        "readingTimeMin": 5,
          "body": "公開記事に近い完成稿。Markdown。見出しは具体的にし、汎用ラベルを使わない。本文中に媒体名を不用意に出さない。"
      },
      "writingChecks": {
        "styleGuideApplied": true,
        "methodologyApplied": true,
        "bodyCharacterCountJa": 0,
        "forbiddenPhrasesRemoved": true,
        "longQuotesAvoided": true,
        "factsAndUnknownsSeparated": true,
        "buyerImplicationIncluded": true,
        "sourceNamesAvoidedInBody": true,
        "readerHookIncluded": true,
        "sectionTemplateApplied": "deployment|business|tech|policy|entertainment"
      },
      "sourceCoverage": "multi-source|single-official",
      "sources": [
        {
          "title": "",
          "url": "",
          "publisher": "",
          "publishedAt": "YYYY-MM-DD or unknown",
          "sourceKind": "official|official-social|wire|trade-media|mainstream|government|dealer|academic|other",
          "reliability": "official|reported",
          "openedAndChecked": true,
          "usedForClaims": []
        }
      ],
      "confirmedFacts": [
        {
          "claim": "",
          "sourceUrl": "",
          "confidence": "official|reported"
        }
      ],
      "unknowns": [],
      "relatedHints": {
        "manufacturerNames": [],
        "robotNames": [],
        "useCaseNames": [],
        "possibleManufacturerIds": [],
        "possibleRobotIds": [],
        "possibleUseCaseIds": []
      },
      "heroImagePlan": {
        "mode": "reuse_existing_generic|reuse_existing_robot_or_article_image|download_from_candidate|leave_empty",
        "existingAssetPath": "",
        "candidate": {
          "title": "",
          "pageUrl": "",
          "imageUrl": "",
          "credit": "",
          "rightsStatus": "commercial-permitted|reference-attributed|unknown",
          "rightsNote": "",
          "recommended": false
        }
      },
      "mechanicalConversionNotes": ""
    }
  ],
  "watchItems": [
    {
      "headlineJa": "",
      "reason": "記事化せず監視に回す理由",
      "sourceUrl": ""
    }
  ],
  "excludedItems": [
    {
      "headlineJa": "",
      "reason": "除外理由",
      "sourceUrl": ""
    }
  ]
}
```

## 2. 週次ニュースレター

週次ニュースレターは ChatGPT Scheduled Tasks に登録しない。Deploid のローカル記事データを読む必要があるため、CLI 側AIまたは将来のサイト内ジョブで実行する。

週次処理は、原則として Deploid で直近7日間に公開されたニュース記事を材料にする。新規ニュース検索で記事候補を作らない。

推奨構成:

- 主役ニュース: 3本
- 補足ニュース: 2〜4本
- 今週の読み筋: 1本
- 来週以降に見るポイント: 3〜5点
- X投稿案: 3〜5本

対象記事が少ない週は無理に外部ニュースを足さない。公開済み記事が3本未満なら、短い週次メモとして出す。

CLI 側AIに渡す週次依頼の例:

````text
週刊ニュースレター 2026-07-10

直近7日間の published な news 記事を `data/articles.ts` から読み、ニュースレター本文を作成してください。
新規外部検索はしないでください。
主役ニュース3本、補足ニュース2〜4本、今週の読み筋、来週以降に見るポイント、X投稿案3〜5本を出してください。
````

## 3. CLI 側AIの処理ルール

ユーザーが CLI に次のような形で投げたら、CLI 側AIはこの文書を読んで処理する。ユーザーは別途CLI用プロンプトを貼らなくてよい。

````text
日次ニュース 2026-07-10

```json
{ ...ChatGPT Scheduled Tasks の出力... }
```
````

日次処理:

1. `schema` が `deploid_daily_article_batch_v1` であることを確認する。
2. `data/articles.ts` の既存記事を読み、各 `articles[]` item について重複判定を先に行う。
3. 次のいずれかに該当する場合は、新規 `Article` を作らない。
   - `idHint` または `slugHint` が既存記事の `id` / `slug` / `previousSlugs` と一致する
   - `sources[].url` または `dedupeKey.primarySourceUrls[]` が既存記事の `sources[].url` と一致する
   - `dedupeKey.eventType`、`eventDate`、`primaryEntityNames`、`primaryRobotNames`、`canonicalClaimJa` が既存記事の主題と実質的に同じ
   - 同じ会社・同じ機体・同じ発表日・同じ発表内容を扱っている
4. 重複時は、既存記事の更新が明確に必要な場合だけ同じ `id` で更新する。判断できない場合は編集せず、重複候補の既存 `id` と理由を報告する。
5. 重複しない場合だけ、`articles[].article` を `data/articles.ts` の `Article` に変換する。
6. CLI 側AIは本文生成・追加検索をしない。不足があれば該当記事を作成しない。
7. `relatedManufacturerIds`, `relatedRobotIds`, `relatedUseCaseIds` は既存IDだけを使う。ChatGPT 出力の ID は候補扱いにし、CLI 側で現行データと照合する。
8. `industryTags`, `regionTags`, `themeTags` は `lib/tagRegistry.ts` の登録値だけを使う。
9. `heroImagePlan.mode` に従って画像を設定する。`reuse_existing_generic` は既存の `public/images/article-generic/` 素材を使う。`download_from_candidate` は候補URLと権利メモが十分な場合だけローカル保存する。CLI 側AIは新たな画像検索をしない。判断できなければ該当記事を作成しないか、ユーザーに不足を報告する。
10. `publishStatus: "published"` として追加する。
11. 変更後に `npm run validate:data` を実行する。UIや型に影響する変更をした場合は `npm run build` も実行する。

週次処理:

1. ChatGPT Scheduled Tasks の出力は期待しない。
2. CLI 側AIが `data/articles.ts` の直近7日間の published な news 記事を読む。
3. 週次ニュースレターは `data/articles.ts` の新規 `Article` にしない。
4. 現時点でニュースレター専用の保存先データ構造はないため、CLI 側AIは本文を報告または、ユーザー指定の保存先がある場合だけ保存する。
5. 週次出力を根拠に新規ニュース記事を作らない。

## 4. 許可値

`category`: `news`, `interview`, `company-report`, `analysis`, `policy`

`type`: `analysis`, `deployment-report`, `interview`, `event-report`, `policy-update`, `case-study`, `news-brief`, `tech-update`, `market-analysis`

`section`: `deployment`, `business`, `tech`, `policy`, `entertainment`

`industryTags`: `manufacturing`, `logistics`, `construction`, `agriculture`, `healthcare`, `retail`, `facility-management`, `research`

`regionTags`: `japan`, `china`, `korea`, `us`, `europe`, `southeast-asia`, `global`

`themeTags`: `funding`, `ipo`, `pricing`, `business-model`, `mass-production`, `commercialization`, `market-analysis`, `safety`, `labor`, `consumer`, `poc`, `physical-ai`, `pr-demo`
