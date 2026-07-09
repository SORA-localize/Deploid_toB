# ロボット画像調達・カードUI対応 実行計画 v1

Last created: 2026-07-08

## 位置づけ

この文書は「(c) 未実装・作業計画」に属する。権利判断の詳細ルールは正本である
`copyright_and_media_rights_policy_v1.md` を参照し、ここでは重複させない。
このファイルは、その方針を前提に「どの機体をどう調達し、どの順で作業するか」を定めた実行計画。

## 背景

2026-07-09時点の `data/robots.ts` は全63機体（published 61 / archived 1 / draft 1）。`images.hero.src`
が入っているのは全体23件、publishedでは22/61件で、公開詳細ページ・一覧カードにはまだ
placeholder表示が多い。権利メタ (`rights.status`, `sourceType`, `checkedAt` 等) は型・表示ゲート
(`lib/media.ts`) まで実装済みで、`reference-attributed` ステータスも「初期MVPでは公開可」と明記されて
いるにもかかわらず、実データではほぼ使われてこなかった。つまり技術的な障害ではなく運用が止まっていた
だけであり、今回の計画はその運用を再開させることが目的になる。

2026-07-08時点で、DBに登録している26メーカーの公式サイトを実地調査した結果、メーカーを3グループに
分類できることがわかった。この分類が本計画の作業単位になる。

## メーカー分類（2026-07-08時点の調査結果）

**グループA：写真を使わない（利用規約が明示的に商用・広告目的を除外している）**

Tesla（Optimus）、Boston Dynamics（Atlas）、1X Technologies（NEO）、XPENG Robotics、Wandercraft、
**Agility Robotics（Digit）**、**Kepler Robotics（K1/K2）** の7社。いずれも「報道関係者限定」
「広告・宣伝目的での利用不可」「事前の書面同意が必要」「個人・非商用ライセンスのみ」を規約上明記
している。この7社については `reference-attributed` での掲載・事後通知という前回までの一般方針を
適用しない。規約を読んだ上で従う判断であり、後から「知らなかった」を装えないため、無許諾での掲載は
行わない。

Agility Robotics と Kepler Robotics は2026-07-08時点で `data/robots.ts`・`data/manufacturers.ts` 上
も `rights.status: 'blocked'` として運用中（2026-06-19にそれぞれの利用規約を確認し、Agilityは
"personal, non-commercial use only" "must not use for any commercial purposes"、Keplerは
"individual, non-commercial license" "書面の同意なしの複製・再公開を禁止" を理由に、それ以前の
`commercial-permitted` / `reference-attributed` 登録から非表示化した経緯がある）。今回の画像調達
作業でこの記録を再発見し、上書きを回避した。今後この2社の画像を再検討する際は、必ず該当レコードの
`permissionNote` を先に確認すること。

この7社は同時に、関係構築を優先的に狙う価値の高い相手でもある（知名度が高く、写真の効果も大きい、
または既に一度交渉の痕跡があるため）。将来的に取材・協業関係ができた時点で、書面での許諾取得を
個別に目指す。

**グループB：沈黙（明示的な利用規約が見つからない。手動収集を進めてよい）**

Unitree Robotics、Figure AI、Apptronik、Sanctuary AI、AgiBot、UBTECH Robotics、
Fourier Intelligence、Booster Robotics、川崎重工業、LimX Dynamics、Mentee Robotics、Aeolus Robotics の
12社、および報道向け配布実績が確認できた Pudu Robotics を含めて計13社。これらは公式サイトに
「メディアキット」としてまとまった素材集が存在しないケースが大半で、製品ページやニュースリリースに
掲載されている個々の写真を1枚ずつ拾う作業になる。まとめて片付く近道はない。

**運用上の注意（2026-07-08 追記）**：着手前に必ず対象レコードの既存 `rights.status` を確認する。
`blocked` が付いている場合はその `permissionNote` に過去の調査結果が残っているため、分類が変わって
いないか確認してから上書きの要否を判断する。今回Agility Roboticsで、調査不足のまま上書きしかけた
near-missが発生している。

**グループC：要目視確認（自動調査がブロックされた、または規約が曖昧）**

NEURA Robotics、Leju Robotics、PAL Robotics、EngineAI、RobotEra、Galbot の6社。
自動クローラーが403やJS描画で弾かれただけで、規約自体は通常通り存在する
可能性がある。着手前に人力でサイトを開き、グループA/Bどちらに該当するか判定してから作業する。

ロゴについては26社中、編集利用を明示的に許可している例はゼロだった。ロゴは全社テキスト名表示のまま
とし、この計画の対象外とする。

## 実行手順（グループB・C確定分、機体単位）

1. `data/robots.ts` から対象ロボットの `manufacturerId` を確認し、当該メーカーの公式サイトで
   製品ページ・ニュースリリース・プレスページを探す。
2. 実機を正面から捉えた、加工されていない写真を1枚選ぶ。公開用の `reference-attributed` 画像では
   背景透過やトリミングなど、配布時点から姿を変える加工はしない（同一性保持権の観点で無加工利用より
   扱いが不利になるため）。`transparent` は、改変許諾を確認できた `licensed` / `commercial-permitted`
   素材、またはローカル確認専用の `prototype-only` だけで扱う。
3. 画像をダウンロードし、`public/images/robots/README.md` の命名規則・圧縮ルール
   （`<robot-id>-hero.jpg` 等、300KB以下、幅1920px以下）に従ってローカル保存する。
4. `data/robots.ts` の該当レコードに `images.hero`（または他ロール）を追加し、
   `rights.status: 'reference-attributed'`、`sourceType: 'press-release'` または
   `'manufacturer-official'`、`checkedAt` に確認日、`rightsHolder` にメーカー名、`sourceUrl` に
   取得元ページを記録する。
5. `npm run validate:data` を通す。

## 公開後の通知メール

グループB・Cで掲載した機体は、公開後にメーカーへ通知する。事前許諾を待つ運用ではなく、掲載してから
知らせる順序を取る（詳細な理由は `copyright_and_media_rights_policy_v1.md` §3 を参照）。文面は以下を
基本形にする。

> Deploidという日本向けヒューマノイド情報データベースを運営しており、御社の製品ページに掲載されて
> いた写真を出典明記の上でロボット詳細ページに掲載しました。指定画像への差し替え、クレジット表記の
> 修正、削除のいずれのご要望にも速やかに対応します。ご連絡先: [contact]

削除依頼が来た場合は即日で `rights.status: 'blocked'` に変更し、`canDisplayAsset` により自動的に
非表示になることを確認する。

## カードUIの対応

グループAの5機体、およびグループB/Cで写真が取得できなかった機体は、当面 `images.hero.src` が空の
ままになる。現状のカードUIが透過画像を前提にした見た目になっていないか確認し、非透過の通常写真、
および画像なしのどちらでも崩れず・貧相に見えないデザインに調整する。これは実装作業であり、
`design_system_v1.md` のカード方針と整合させた上で別途着手する。グループAの機体については、
写真の代わりにメーカー名・YouTube公式動画のfacade埋め込み（規約上問題のない代替表現）を検討する。

## 優先順位

1. グループB・Cのうち、既にDB掲載機体数が多い主要メーカー（Unitree、Figure AI、Agility Robotics、
   Apptronik、UBTECH）から着手する。
2. グループCの目視確認を先に済ませ、グループB/Aどちらに転ぶか確定させる。
3. カードUIの非透過・画像なし対応は、機体画像がある程度揃ってから見た目を検証する。
4. グループAは通知・許諾取得の個別交渉が発生するため、他メーカーとの関係構築が進んだ段階で扱う。

## 進捗（2026-07-08 実行分）

優先メーカー5社のうち4社に着手し、13機体に画像を追加した（`npm run validate:data` と
`tsc --noEmit` は通過済み）。

- **Unitree**：g1, g1-edu, h1, h2, h2-edu, h2-plus, r1(AIR), r1-standard, g1-d の9機体。
  h1-2のみ公式サイトの画像が他製品（四足ロボット）と混在しており、単体写真が見つからず保留。
- **Figure AI**：figure-03（hero + endEffector）。figure-02は`publishStatus: 'archived'`のため
  今回はスキップ。
- **Agility Robotics**：0機体。着手前に`agility-digit`の既存`rights.status: 'blocked'`を発見し、
  上書きを回避（グループA行きの判断を裏付け）。
- **Apptronik**：0機体。公式サイトがJSクライアントレンダリングでWebFetch/curlどちらでも実画像URLを
  取得できず。手動でブラウザから収集する必要がある。
- **UBTECH**：walker-s1, walker-s2, walker-x の3機体（hero + 一部endEffector）。
  walker-c, walker-tienkungは公式サイトに単体写真が見当たらず保留。

**プロセス上の教訓**：Unitree・UBTECH等のJSレンダリングサイトはWebFetchで画像URLを抽出できても、
無関係な製品（別のロボット・四足ロボット・アイコン画像）が混在することがある。ダウンロード後に
必ず目視確認してから採用すること（本セッションでUnitree H1ページの候補画像が四足ロボットの写真
だったケースを確認済み）。また着手前に対象レコードの既存`rights.status`を必ず確認すること
（Agility Roboticsで上書きしかけたnear-missが発生している）。

**残タスク**：unitree-h1-2、apptronik-apollo/apollo-2、ubtech-walker-c/walker-tienkung、
figure-02、グループC 6社（NEURA, Leju, PAL, EngineAI, RobotEra, Galbot）の目視確認、
カードUIの非透過・画像なし対応。

### 追加進捗（同日続行分）

優先5社の後、グループBの残りメーカーにも着手し、以下7機体を追加した。

- **Sanctuary AI**：sanctuary-phoenix（Gen 8, hero + endEffector）
- **AgiBot**：agibot-a2（他バリアント a2-ultra/a2-max/a2-lite 等は仕様差が大きく別写真が必要なため保留）
- **Fourier Intelligence**：fourier-gr3（"Care-bot"の柔らかい意匠と一致確認）。fourier-gr2は
  候補画像が複数機種の合成バナーで誤認リスクがあり見送り
- **Booster Robotics**：booster-t1, booster-k1（いずれもワイドバナーを機体中心にクロップ。
  K1のeducationシーンは未成年の顔が写り込むため使わず、人物なしのprofessionalシーンを採用）
- **Kawasaki Heavy Industries**：kawasaki-kaleido（旧世代機の展示会実演写真。最新Kaleido 9の
  クリーンな単体写真は見つからず）
- **LimX Dynamics**：limx-oli（2体並んだ画像から手前の個体をクロップして単体化）
- **Aeolus Robotics**：aeolus-aeo
- **Pudu Robotics**：pudu-d7（プレスリリースのバナー画像から広告文言部分をクロップ）

この追加進捗を反映した現行データでは、2026-07-09時点で `images.hero.src` 入りは全体23件、
publishedでは22件。`npm run validate:data`・`tsc --noEmit`とも通過。

**運用上のインシデントと対処（重要）**：この作業中、同一リポジトリで並行稼働していた別セッション
（レスポンシブ対応作業）がブランチ切り替えを行い、一時的にコミット前の変更が見えなくなる事象が
発生した。実際にはデータは失われていなかったが、リスクを断つため以降は以下の運用に切り替えた。

1. 作業は`content/data-maintenance`ブランチ上で行う（READMEのブランチ運用どおり）。
2. メーカー数機体単位でこまめに`git commit`する（大きな作業をコミット前の状態で長時間放置しない）。
3. 複数セッションが同一チェックアウトを共有する場合は、`EnterWorktree`等で作業ツリーを分離することを
   推奨する。

## 完了条件とアーカイブ

主要メーカー分の画像調達とカードUI対応が完了した時点で、この計画は
`docs/planning/archive/` へ移動する。継続運用ルールが必要な場合は
`copyright_and_media_rights_policy_v1.md` または `docs/data/README.md` へ反映する。
