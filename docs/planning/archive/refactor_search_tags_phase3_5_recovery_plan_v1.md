# Phase 3.5 復帰前補修計画 v1

## 1. 目的

Phase 2、Phase 3 の実装後に「問題がある前提」で再調査した結果、ビルドは成功しているが、使い勝手・表示意味・アクセシビリティ・モバイル表示に不備候補が残っている。

この計画は、元の `refactor_search_tags_execution_plan_v1.md` の Phase 4（タグ基盤）へ戻る前に、先に閉じるべき不備を小さく修正するための割り込みフェーズである。

この Phase 3.5 が完了したら、元の計画に戻り Phase 4: タグ基盤へ進む。

---

## 2. 現在のベースライン

確認日: 2026-05-29

Git状態:

```text
main...origin/main
working tree clean
HEAD = origin/main = 603204a
```

検証:

```text
npm run build: success
```

前提:

- 既存のビルドは壊れていない
- ここで扱うのは「通るが後で問題になる」不備
- 検索ライブラリ導入、タグURL、タグ集約は元の Phase 4 以降に戻して扱う

---

## 3. 対象不備

### 3.1 UseCases の見えない filter が残る

該当:

- `components/UseCasesBrowser.tsx`

問題:

- `industry` と `task` の両方が内部状態として残る
- UI上は片方のモードしか見えていない
- 業種を選んだ後にタスクモードへ切り替えると、非表示の業種filterが効き続ける

修正方針:

- mode切り替え時に反対側のfilterをclearする
- または active filter を両方見えるUIにする
- KISS優先で、今回は「mode切り替え時に反対側をclear」を採用する

完了条件:

- 業種選択後にタスクへ切り替えても、非表示filterが残らない
- タスク選択後に業種へ切り替えても、非表示filterが残らない

---

### 3.2 Robots の active count 表示が release 状態に引きずられる

該当:

- `components/RobotsBrowser.tsx`

問題:

- `ACTIVE MODELS` の件数が `filtered.length` 依存
- `release === 'pre'` の時、active chip に pre-release 件数が表示される可能性がある

修正方針:

- release適用前の候補一覧を作る
- active件数とpre-release件数を、それぞれ release 条件だけ差し替えて算出する
- 現在の表示順と検索条件は維持する

完了条件:

- `ACTIVE MODELS` は active model 数を示す
- `PRE-RELEASE` は必要なら件数を出す、または件数なしで意味がズレない
- releaseを切り替えても chip 文言の意味が変わらない

---

### 3.3 SearchModal という要件名と実装実体がズレている

該当:

- `components/SearchInput.tsx`
- `components/RobotsBrowser.tsx`
- `components/ManufacturersBrowser.tsx`
- `components/UseCasesBrowser.tsx`
- `components/ReportsBrowser.tsx`

問題:

- 現在存在するのは `SearchInput`
- `SearchModal` コンポーネントは存在しない
- 「検索モーダル追加」という要件を厳密に読むと未実装

修正方針:

- Phase 3.5 では新しい検索モーダルを作らない
- 現状の実体を「一覧内検索欄」として明確化する
- 実際にモーダルUIが必要なら、元の Phase 6: 検索改善の前に別フェーズで設計する

完了条件:

- ドキュメント上で `SearchInput` と `SearchModal` を混同しない
- Phase 4 タグ基盤に入る前提として、検索モーダル未実装がブロッカーではないことを明記する

---

### 3.4 固定3カラムによるモバイル崩れリスク

該当:

- `components/RobotsBrowser.tsx`
- `components/ManufacturersBrowser.tsx`
- `src/app/page.tsx`

問題:

- `grid-cols-3` が固定
- モバイル幅でカードやselectが窮屈になる

修正方針:

- 一覧ページの主要gridを `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` に変更
- フィルタselectのgridも `grid-cols-1 md:grid-cols-3` に変更
- Compare の3ペインは影響範囲が大きいため Phase 7 へ残す

完了条件:

- Robots / Manufacturers / Home の主要3カラムがモバイルで1カラムになる
- 表示順とデータ内容は変わらない

---

### 3.5 FilterChipGroup の選択状態が支援技術に伝わりにくい

該当:

- `components/FilterChipGroup.tsx`

問題:

- 見た目では selected が分かる
- `aria-pressed` がないため、button group として状態が伝わりにくい

修正方針:

- wrapper に `role="group"` を付与する
- 各buttonに `aria-pressed={selected}` を付与する

完了条件:

- chip filter の選択状態がアクセシビリティ属性で表現される
- 既存の見た目と動作は変えない

---

### 3.6 icon button の aria-label 不足

該当:

- `components/RobotCard.tsx`
- `components/FavoriteCard.tsx`
- `components/CompareClient.tsx`

問題:

- 星ボタン、削除ボタン、比較追加/削除ボタンの一部に読み上げ用ラベルがない
- `title` だけではbuttonの意味として不十分

修正方針:

- icon-only button に `aria-label` を追加する
- 画面表示文言やレイアウトは変えない

完了条件:

- icon-only button がラベルを持つ
- `rg '<button'` と `aria-label` の対応を確認する

---

### 3.7 TagChip 適用残り

該当:

- `src/app/page.tsx`
- `src/app/guides/[slug]/page.tsx`
- `src/app/robots/[slug]/page.tsx`

問題:

- Phase 2で `TagChip` を作ったが、Home / 詳細ページに直書きchipが残っている
- Phase 4 のタグ基盤に入ると、タグ表示ルールの統一がやりにくくなる

修正方針:

- タグ・ステージ・関連リンクのうち、見た目が `TagChip` と一致するものだけ置換する
- 関連リンクのようにクリック可能なものは、無理に `TagChip` へ寄せない
- クリック可能chipが必要なら Phase 4 で `TagLink` を設計する

完了条件:

- 表示専用のタグchip直書きが減っている
- click可能リンクを無理に `TagChip` 化していない

---

## 4. 実行順序

### Step 0: GitHub最新確認

実行:

```bash
git status --short --branch
git fetch origin main
git rev-list --left-right --count origin/main...HEAD
```

合格:

- `origin/main...HEAD = 0 0`
- working tree clean、または今回対象の差分だけ

### Step 1: 振る舞いの不具合を先に直す

対象:

- `components/UseCasesBrowser.tsx`
- `components/RobotsBrowser.tsx`

理由:

- ユーザー操作の意味がズレる問題なので、UI共通化より優先する

検証:

- 業種選択からタスクモードへ切り替える
- タスク選択から業種モードへ切り替える
- Robotsで active / pre-release を切り替える

### Step 2: 小型UI部品のアクセシビリティを補修する

対象:

- `components/FilterChipGroup.tsx`
- `components/RobotCard.tsx`
- `components/FavoriteCard.tsx`
- `components/CompareClient.tsx`

理由:

- Phase 4 以降でさらに使う前に、共通部品の最低品質を上げる

検証:

- `aria-pressed`
- `aria-label`
- build

### Step 3: 主要一覧のモバイル崩れリスクを下げる

対象:

- `components/RobotsBrowser.tsx`
- `components/ManufacturersBrowser.tsx`
- `src/app/page.tsx`

理由:

- ここまでの変更で増えたUIがスマホで破綻しないようにする
- Compare の大改修は Phase 7 へ残す

検証:

- className差分確認
- build
- 可能なら `npm run dev` で 375px / 768px / desktop を確認

### Step 4: TagChip適用残りの最小整理

対象:

- `src/app/page.tsx`
- `src/app/guides/[slug]/page.tsx`

理由:

- Phase 4 のタグ基盤前に表示専用タグの直書きを減らす

注意:

- クリック可能リンクはまだ共通化しない
- タグURL state は Phase 5 へ残す

### Step 5: 自己監査と検証

実行:

```bash
rg 'grid grid-cols-3|grid-cols-3' components src/app
rg '<button|aria-label|aria-pressed' components src/app
rg 'px-3 py-1 text-xs bg-white text-neutral-700 border' src/app components
npm run build
git diff --check
```

合格:

- 新規の見えないfilterがない
- release count 表示が意味的に正しい
- 主要一覧の固定3カラムが解消されている
- icon-only button が `aria-label` を持つ
- build成功

### Step 6: コミット・push

コミット例:

```bash
git commit -m "fix(ui): resolve refactor follow-up issues"
git push origin main
```

合格:

- 1コミットで Phase 3.5 の範囲に収まっている
- `origin/main...HEAD = 0 0`

---

## 5. この計画で解決できることのデモンストレーション

| 発見した問題 | 対応Step | 対応後の状態 | 元計画へ戻れる理由 |
|---|---:|---|---|
| UseCasesで見えないfilterが残る | Step 1 | mode切替時に反対側filterが消える | タグ基盤実装時に、既存filterの挙動が明確になる |
| Robotsのactive countがpre-release表示に引きずられる | Step 1 | releaseごとの件数表示が意味通りになる | タグ/検索改善前に既存filterの信頼性が戻る |
| SearchModalとSearchInputの混同 | Step 3.3の方針確認 | Phase 3.5では新規モーダルを作らない | Phase 6で検索改善として扱える |
| 固定3カラムのモバイル崩れ | Step 3 | Robots / Manufacturers / Home がレスポンシブになる | Phase 4でタグUIを増やしても画面が破綻しにくい |
| FilterChipGroupの選択状態が支援技術に伝わりにくい | Step 2 | `role="group"` と `aria-pressed` を持つ | タグfilterへ流用できる状態になる |
| icon-only buttonのラベル不足 | Step 2 | 主要icon buttonが `aria-label` を持つ | 後続UI追加時の品質基準になる |
| TagChip適用残り | Step 4 | 表示専用chipの直書きが減る | Phase 4で `lib/tags.ts` と表示UIを接続しやすい |

上記がすべて合格した場合、元の計画の Phase 4 に戻れる。

戻る先:

```text
refactor_search_tags_execution_plan_v1.md
Phase 4: タグ基盤
```

Phase 4で扱うもの:

- `lib/tags.ts`
- タグ正規化
- collection横断のタグ集約
- `Report.tags`
- `Guide.topics`
- `UseCase.industryTags`
- `UseCase.taskTags`

Phase 3.5で扱わないもの:

- タグURL state
- Fuse.js / Pagefind など検索ライブラリ
- Algoliaなど有料検索SaaS
- Compare全体のモバイル再設計
- 本格的な検索モーダル

---

## 6. 不合格時のフェイルセーフ

### buildが落ちた場合

- そのStepの差分だけ確認する
- 2回同じ原因で失敗したら、該当Stepを分割する
- Phase 4へ進まない

### UI変更が大きくなりすぎた場合

- TagChip適用残りを後回しにする
- レスポンシブ修正は Robots / Manufacturers に限定する
- Compare は触らない

### SearchModal要件がブロッカーになった場合

- Phase 3.5を止める
- `SearchInput` のままでよいか、実際の modal UI が必要かを決める
- modal が必要なら、Phase 6 の前に `Phase 5.5: SearchModal設計` を追加する

---

## 7. Phase 3.5 完了判定

以下を満たしたら完了。

- `npm run build` 成功
- `git diff --check` 成功
- UseCasesのmode切替で見えないfilterが残らない
- Robotsのrelease chip件数が意味通り
- Robots / Manufacturers / Home の主要gridがレスポンシブ
- `FilterChipGroup` が `aria-pressed` を出す
- icon-only button に `aria-label` がある
- 表示専用タグchipの直書きが減っている
- `git status --short --branch` が clean
- `origin/main...HEAD = 0 0`

この状態になれば、元計画の Phase 4 に復帰する。
