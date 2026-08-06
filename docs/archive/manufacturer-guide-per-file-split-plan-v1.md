# メーカー解説の記事別ファイル分割 計画 v1

Status: completed / archived
Created: 2026-07-22
Completed: 2026-07-23（コミット `b925535`）
Branch: main（直接実装。専用branchなし）

3記事とも `data/articles/manufacturer-guide/<id>.ts` に分割済み。§7の4検証（tsc / validate:data / build / check-source-links）すべてパス。news系31記事・robot-guide・robots/manufacturers本体は対象外のまま（§1, §10参照、後続の段階として残す）。

`data-architecture-redesign-v1.md` §12 の段階E（個別ファイル化）を、まずメーカー解説3記事に限定して適用する。呼び出し形（`lib/data.ts` 経由）は不変。

---

## 1. 目的

`data/articles.ts`（現在3366行の単一配列）に全34記事が直書きされている。記事が増えると編集衝突・可読性・レビュー粒度で破綻する。段階Eの実行として、まず `type: 'manufacturer-guide'` の3記事を1記事1ファイルに切り出し、`data/articles.ts` は各ファイルを import して配列に組み込むだけにする。

対象は3記事のみ:

| 記事 | id | 現在の位置 |
|---|---|---|
| Unitree | `unitree-manufacturer-guide` | data/articles.ts:2727〜 |
| Agility Robotics | `agility-robotics-manufacturer-guide` | data/articles.ts:2938〜 |
| AgiBot | `agibot-manufacturer-guide` | data/articles.ts:3103〜 |

行番号は目安。実装時は `grep -n "id: '.*-manufacturer-guide'" data/articles.ts` で再取得する。

**対象外**（このv1では触らない）:
- ロボット解説（`robot-guide`）— 記事0本のため対象なし
- 他の記事タイプ（news系31記事）— 段階的に進める。まずメーカー解説で型を確立
- `data/robots.ts` / `data/manufacturers.ts` — オーナーのスプレッドシート整理待ち

---

## 2. 自己監査で検出した破綻と、それを踏まえた設計

実装前に、切り出しファイルを実際に作って `node`（validate の実行路）で解決可否を実測した。当初案（`@/content/...` エイリアス、拡張子なし）は **`npm run validate:data` で確実に落ちる**ことが判明したため、以下に修正済み。

### 破綻1: `@/` エイリアスは node スクリプト経由で解決不能

`validate:data` と `check:source-links` は `node scripts/*.mjs` が `.ts` を直接実行する構成（Node 24 のネイティブ型ストリップ）。この実行路は **tsconfig の `@/` パスエイリアスを変換しない**。実測で `@/content/...` の値 import は `ERR_MODULE_NOT_FOUND`。

- tsc と next build は `@/` を解決できるので通ってしまう → **ローカルで tsc だけ見て「OK」と誤判定する罠**（前回の Vercel ビルド失敗と同型）。
- → **対策**: 切り出しファイルの参照は相対パスにする。`@/` は使わない。

### 破綻2: 拡張子なし相対 import も実行時に解決不能

`node` の `.ts` 直接実行では、値 import は `.ts` 拡張子必須。実測で `./x` は FAIL、`./x.ts` は OK。

- `data/articles.ts` の既存 import が拡張子なしで動いているのは、それらが **すべて `import type`（実行時に消える型のみ）** だから。値 import には適用できない。
- `data/` 配下で1ファイルが別ファイルを **値** import する実例は現在ゼロ（全て type-only）。この意味では今回が初。
- ただし「相対パス＋`.ts`拡張子」という書き方自体は実験で発見した特殊ルールではなく、**`lib/` では既に本番稼働中の標準パターン**。`lib/validate.ts:6-9`（`from '../data/deployments.ts'` 等）、`lib/useCaseEvidence.ts`（`from '../data/types.ts'`）が同じ規約で値・型の両方を import している。今回はこの既存規約を `data/` 内部の相互参照にも適用するだけで、プロジェクトとして新しい書き方を持ち込むわけではない。
- lint による足切りの心配も無し：本プロジェクトに ESLint 設定・`lint` スクリプトは存在しない（`.eslintrc*` / `eslint.config.*` とも無し）ため、`import/extensions` 等のルールで拡張子明記が弾かれることもない。
- → **対策**: import は相対パス＋`.ts` 拡張子を明記する（＝ `lib/` の既存規約に合わせるだけ）。

### 破綻3: 置き場所は `content/` でなく `data/articles/` にする

設計書 §12 は `content/robots/` を例示するが、それは Keystatic 接続（段階F）まで見据えた最終形。段階E だけなら、既存データ層 `data/` の内側に置く方が、既存の `data/*.ts` の相対 import 文化と一貫し、パスも素直（`./articles/...`）。

- `content/` への物理移動は段階F でまとめて行えばよく、今やる必然性がない。今は最小リスクを優先。

---

## 3. 新規作成するファイル

```
data/articles/manufacturer-guide/unitree-manufacturer-guide.ts
data/articles/manufacturer-guide/agility-robotics-manufacturer-guide.ts
data/articles/manufacturer-guide/agibot-manufacturer-guide.ts
```

各ファイルの形（**プロパティの値・キー・件数は1文字も変えない**。インデントは配列要素→トップレベルconstの値になる分だけ浅くなるのが正しい。「1文字も変わらない」のはインデントを除いた内容であって、生の行テキストではない——この区別は §6-2c の照合方法と対応させる）:

```ts
import type { ManufacturerGuideArticle } from '../../types';

export const unitreeManufacturerGuide: ManufacturerGuideArticle = {
  id: 'unitree-manufacturer-guide',
  // …既存オブジェクトをそのまま貼り付け…
};
```

- 型注釈 `: ManufacturerGuideArticle` を付ける（配列内では効いていなかった過剰プロパティチェックが新たに走るが、実測で3記事とも通過済み）。
- `../../types`（拡張子なし）: 型 import は実行時に消えるため拡張子の有無は動作に影響しないが、`data/*.ts` 同士の既存の型 import 慣習（`data/robots.ts` の `from './types'` 等）に合わせて拡張子なしで統一する。値 import（§4）とは扱いを分ける。
- `ManufacturerGuideArticle` は `data/types.ts` から export 済み（確認済み: types.ts:562）。

サブフォルダ `manufacturer-guide/` を切るのは、将来 news 等の他タイプを分割する際の置き場所を先に確保するため。

---

## 4. 変更するファイル

`data/articles.ts` のみ。

1. 先頭に3つの値 import を追加（相対＋`.ts` 拡張子、`@/` 不使用）:

```ts
import type { Article } from './types';
import { unitreeManufacturerGuide } from './articles/manufacturer-guide/unitree-manufacturer-guide.ts';
import { agilityRoboticsManufacturerGuide } from './articles/manufacturer-guide/agility-robotics-manufacturer-guide.ts';
import { agibotManufacturerGuide } from './articles/manufacturer-guide/agibot-manufacturer-guide.ts';
```

2. 配列内の3オブジェクトリテラルを、それぞれ識別子参照に置換（**元の配列位置は保持**。並び順に依存する処理はないが、diff とレビューを最小化するため）:

```ts
export const articles: Article[] = [
  // …既存news記事…
  unitreeManufacturerGuide,
  // …既存…
  agilityRoboticsManufacturerGuide,
  // …既存…
  agibotManufacturerGuide,
  // …既存…
];
```

---

## 5. 変更しないファイル（重要）

呼び出し側は今と同じ `articles` 配列を受け取るだけなので、以下は **すべてゼロ変更**:

- `lib/data.ts` — `import { articles } from '@/data/articles'` のまま（articles.ts 内部で集約するため）
- `lib/validate.ts` — `import { articles } from '../data/articles.ts'` のまま
- `scripts/check-source-links.mjs` — 同上
- `data/types.ts`, `components/**`, `src/app/**`

`articles` 配列の消費者は上記3ファイルのみ（`rg` で全消費者を確認済み）。影響範囲は `data/articles.ts` の内部構造に完全に閉じる。コードは無変更だが、`scripts/check-source-links.mjs` は3記事の `sources[]` を含む全記事のURL生存確認を行う実消費者なので、§7の検証には含める（挙動不変を消費者側からも裏取りする）。

---

## 6. 実装手順（1記事＝1コミット可能な粒度）

1. `data/articles/manufacturer-guide/` を作成。
2. 3記事を1件ずつ処理:
   a. `git mv` ではなく手作業のコピペで切り出すため、先に着手前の `data/articles.ts` を一時コピーしておく（例: `cp data/articles.ts /tmp/articles.ts.before`）。以降の照合はこの一時コピーを基準にする。
   b. 該当オブジェクトを新ファイルへ切り出し、`export const <name>: ManufacturerGuideArticle = { ... };` の形にする（型注釈と import を付与）。
   c. `data/articles.ts` の配列内オブジェクトを識別子参照に置換し、先頭に import を追加。
   d. **インデント差を無視した内容照合**を行う。単純な `git diff` は配列要素（4スペース起点）→トップレベルconst（0スペース起点）への移動で全行がインデント差の add/delete として出てしまい、値の同一性確認には使えない。代わりに両側の行頭空白を除去してから比較する:

      ```bash
      # <START>,<END> は /tmp/articles.ts.before 側での該当オブジェクトの内側の行範囲
      # （囲みの "  {" と "  }," 自体は除いた、プロパティが始まる行〜終わる行）
      diff \
        <(sed -n '<START>,<END>p' /tmp/articles.ts.before | sed 's/^[[:space:]]*//') \
        <(sed -n '/= {$/,/^};$/p' data/articles/manufacturer-guide/<file>.ts | sed '1d;$d' | sed 's/^[[:space:]]*//')
      ```

      左辺: 元ファイルの該当行範囲から先頭空白を全除去。右辺: 新ファイルの `= {` 行〜`};` 行を抜き出し、その最初と最後の行（`= {` と `};` そのもの）を落としてから先頭空白を全除去。**差分が0行であれば、キー・値・件数・順序が一致している**ことの機械的な証明になる（インデントの差はここで吸収済みなので出てこない）。
3. 3件完了後、まとめて検証（§7）。

---

## 7. 検証コマンド（tsc だけで満足しない）

```bash
npx tsc --noEmit -p .        # 型
npm run validate:data        # ★ node 実行路。@/エイリアス・拡張子問題はここでしか出ない
npm run build                # 静的生成（validate:data を内包）
npm run check:source-links   # 3消費者目。articles配列の中身は不変なので新規リンク切れは出ないはずだが、実消費者として一度緑を確認する
```

**完了条件は `npm run validate:data` と `npm run build` と `npm run check:source-links` の3つがパスすること。** tsc の通過だけを根拠に「OK」と言わない（破綻1・2はまさに tsc をすり抜ける）。

---

## 8. 手動確認チェックリスト

- `/reports/unitree-manufacturer-guide` — 本文・見出し・注目ポイント・製品ラインナップが変化なし
- `/reports/agility-robotics-manufacturer-guide` — 同上
- `/reports/agibot-manufacturer-guide` — 同上
- `/reports` 一覧のメーカー解説棚 — 並び順・カード内容が変化なし
- 製品ラインナップの表→カードのホバー連動（前回実装）が3記事とも正常動作
- 3記事の hero 画像が表示される

---

## 9. リスクと軽減策

| リスク | 軽減策 |
|---|---|
| 切り出し時にオブジェクトの括弧・カンマを崩す | 1件ごとに tsc を通す。末尾カンマ除去を忘れない |
| `@/` エイリアス・拡張子の罠で validate が落ちる | §2 で実測済み。相対＋`.ts` 拡張子で回避。完了条件を validate:data まで含める |
| 配列順序に依存する隠れ処理 | 確認済み: ソートは `byArticlePublishedDesc`（日付順）、`articlePlacements` は `articleId` 参照。配列順非依存。元位置保持でさらに安全側 |
| 内容を「移動」でなく「編集」してしまう | 手順2d の行頭空白除去 diff で、キー・値・件数・順序の一致を機械的に確認（差分0行が完了条件）。中身の文言変更はこの計画のスコープ外 |
| 将来のタイプ拡大時に命名がブレる | `data/articles/<type>/<id>.ts` 規約を本計画で確立。news 等の分割時も踏襲 |

---

## 10. スコープ外・将来

- **news系31記事の分割**: 同じ規約で段階的に。まずメーカー解説で型を確立してから。
- **`content/` への移動＋Keystatic 接続**（段階F）: このv1では行わない。段階F でまとめて物理移動する。`lib/data.ts` 経由の呼び出し形が不変なので、その時も上位は無改修。
- **robot-guide の分割**: 記事が生まれてから。
