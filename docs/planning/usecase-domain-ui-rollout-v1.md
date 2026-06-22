# primaryDomain をUIに繋ぎ込む計画

Last reviewed: 2026-06-22

## Context

前回のセッションで`UseCase.primaryDomain`/`secondaryDomains`（タスク起点のMECE分類、`lib/tagRegistry.ts`の`use-case-domain`kind）をデータ層に追加したが、`grep`で確認した結果、`lib/tagRegistry.ts`と`lib/validate.ts`にしか存在せず、UIには一切出ていなかった。一覧のフィルタにも、カードのバッジにも、詳細ページにも出てこない。当初の提案の目的（業界紹介ではなくタスク起点で探せるようにする、`humanoid_media_IA_v1.md` §7）は、データだけ整備してUIに繋がってない状態では実現できていない。

`featuredRank`と`candidateRobots`（fit/reason）は既にUIに反映済み（一覧の並び順、詳細ページのサイドバーバッジ）なので対象外。今回は`primaryDomain`/`secondaryDomains`のみを対象にする。

既存の`industryTags`/`taskTags`は検索ファセットとして`/use-cases`の2つのドロップダウン（業種・タスク）で既に機能しており、これは変更しない（前回決めた通り、削除・格下げはしない）。`primaryDomain`はこれらに**追加する3つ目の軸**として導入する。

## 採用するアプローチ

### 1. 一覧ページに「分類」ドロップダウンを追加

`lib/tags.ts`に`getUseCaseDomainOptions(useCases)`を新設する。既存の`getUseCaseIndustryTagOptions`と同じ`toTagOptions`パターンを使うが、`primaryDomain`と`secondaryDomains`を両方フラット化したものを渡す（`useCases.flatMap(uc => [uc.primaryDomain, ...(uc.secondaryDomains ?? [])])`）。これにより、絞り込み結果の件数表示が実際にフィルタする件数と一致する。

`lib/useCaseFilters.ts`の`UseCaseFilters`に`domain: string | null`を追加し、`normalizeUseCaseFilters`で`domainValues`に対して検証する（既存の`industry`/`task`と同じ形）。マッチ判定は新しい関数を書かず、既存の`matchesTag(values, selected)`をそのまま再利用する：`matchesTag([useCase.primaryDomain, ...(useCase.secondaryDomains ?? [])], filters.domain)`。これにより、`secondaryDomains`に含まれるユースケース（例：`factory-assembly-support`を`move-goods`で検索した場合）も正しくヒットする。

`src/app/use-cases/page.tsx`の`pickSearchParams`に`'domain'`を追加し、`resolveFilters`内で`domainValues`を渡す。

`components/UseCasesBrowser.tsx`の業種・タスクの2つの`SelectControl`に、3つ目として「分類」を追加する（`grid-cols-2`→`grid-cols-3`に変更）。`uiText.filters`に新しいラベルキー（例：`domain: '分類'`）を追加する。`UseCasesHeader`に渡す`activeChips`の計算にも`domain`を追加する。

### 2. カードのバッジを`industryTags[0]`から`primaryDomain`に置き換え

`components/UseCaseCard.tsx`は現在`industryTags[0]`をTagChipとして表示している（タスクタグのチップ行は、カードを小さくする際に既に削除済み）。`industryTags`は引き続きフィルタとして機能するが、カード上の一目で分かる分類表示は`primaryDomain`の方が「このユースケースが何をする話か」をより正確に伝えるため、`<TagChip kind="industry" value={u.industryTags[0]} />`を`<TagChip kind="use-case-domain" value={u.primaryDomain} />`に置き換える。`TagKind`はすでに`use-case-domain`を含んでおり、`tagKindTones`にも色（brand）が設定済みなので追加実装は不要。

### 3. 詳細ページのサイドバーに「分類」行を追加

`src/app/use-cases/[slug]/page.tsx`の右カラム「判断軸」テーブル（`overviewRows`）に、既存の成熟度・実務ラベル・環境・必要能力と並んで「分類」の行を追加する。値は`primaryDomain`のラベル（`secondaryDomains`がある場合は「、」区切りで括弧内に併記。例：「物を加工・組立・操作する（＋物を動かす、状態を見て記録する）」）。新しいUIチップ列を発明せず、既存の構造化データ表示パターンに1行追加するだけにする。

## 今回のスコープ外

- `industryTags`/`taskTags`ドロップダウンの削除・統合はしない
- `lib/tags.ts`の`getAllTagOptions`（サイトマップ等横断用）への`use-case-domain`追加はしない（今回は`/use-cases`一覧専用の対応）

## 検証

```bash
npm run validate:data
npm run build
```
`/use-cases`で3つ目のドロップダウンから分類を選び、`primaryDomain`一致と`secondaryDomains`一致の両方が結果に出ることを確認する。カードのバッジが`primaryDomain`ラベルになっていること、詳細ページのサイドバーに分類行が出ることをPlaywrightで確認する。
