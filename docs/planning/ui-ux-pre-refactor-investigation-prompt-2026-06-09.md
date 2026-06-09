# UI/UX リファクタリング前調査プロンプト

**用途**: 計画書 `ui-ux-comprehensive-fix-plan-2026-06-09.md` の実装前に使うプロンプト。  
**目的**: 「何を直すか」より先に「何を直さないか」「すでにある道具で解決できるか」を調べる。  
このプロンプトの結果をもとに計画書を書き直す。

---

## プロンプト本文

```text
まず実装せず、既存コードを徹底的に調査して調査レポートだけ作成してください。

このプロジェクトは Next.js + Tailwind v4 + Radix UI + shadcn + framer-motion + embla-carousel + lucide-react + budoux 等が導入済みです。
UI/UX の問題を25件特定しており、これから修正計画を立てますが、計画を書く前に以下を調査してください。

---

## 調査 1: 意図的な実装の識別（触ってはいけない箇所）

以下を調べて、「意図的な設計」と「バグ・未完成」を分類してください。

確認対象:
- src/app/page.tsx のヒーローセクション（黒背景・白文字）
- src/app/page.tsx の世界地図セクション（メーカーマップ）
- src/app/globals.css の :root トークン定義（--slate-* / --jade-* / semantic tokens）
- src/app/globals.css の .site-container 定義
- src/app/globals.css の h1〜h4 のグローバルスタイル定義
- 各詳細ページ（robots/[slug], manufacturers/[slug], use-cases/[slug]）の h1 と h2 のクラス
- components/RobotCard.tsx / components/ManufacturerCard.tsx / components/NewsCard.tsx のホバーエフェクト
- CLAUDE.md の「デザイン方針（AI感回避）」セクション

出力形式:
| 箇所 | クラス/実装 | 意図的か | 理由 |
|------|-----------|---------|------|
| Hero h1 | text-5xl | 意図的 | CLAUDE.md の例外カテゴリに明記 |
（以下同様）

---

## 調査 2: 既存ライブラリで解決できる問題のマッピング

package.json には以下が導入済みです。これらを使えば解決できる問題を特定してください。

導入済みライブラリ（未活用または部分活用の可能性があるもの）:
- radix-ui（フルパッケージ）: Popover / Dialog / DropdownMenu / Tooltip / Separator 等
- @radix-ui/react-icons: アイコンセット
- framer-motion / motion: アニメーション
- embla-carousel-react + embla-carousel-autoplay + embla-carousel-class-names: カルーセル
- lucide-react: アイコン（すでに部分的に使用）
- budoux: 日本語テキストの自然な改行
- shadcn: コンポーネントライブラリ
- tailwind-merge: クラスのマージ
- tw-animate-css: アニメーション CSS
- next-themes: ダークモード

確認すること:
1. 現在どのページ・コンポーネントで上記ライブラリを使っているか（grep で確認）
2. 使われていない or 使われているが機能を活かしきれていない箇所
3. 対応する UI/UX 問題（下記25件）をどのライブラリ機能で解決できるか

対象の25件の問題:
1. 検索バー・ドロップダウンが大画面で引き伸ばされる
2. スペック表の大画面での余白問題
3. プレースホルダー画像が縦長
4. 縦余白が一律
5. コンテナ幅 1680px が広すぎ
6. カードと背景のコントラスト不足
7. 見出しのジャンプ率不足（グローバルCSS）
8. EmptyState がテキストのみ
9. TagChip が枠線のみ
10. ManufacturerCard/NewsCard のホバー効果が弱い
11. アイコン活用不足
12. 日本語 line-height が 1.5 固定
13. カルーセル高さ固定（h-[420px]）
14. RobotCard の sm ブレークポイント欠落
15. 見出しのレスポンシブサイズなし
16. スペック表のモバイル横スクロール保護なし
17. EmptyState にバリアントなし（8と同じ）
18. ManufacturerCard の ml-4 がモバイルで過剰
19. コンテナパディング比率が崩れ
20. フッターのモバイル折り返し
21. NewsCard 画像の遷移が唐突
22. ドロップダウンの focus trap・Escape key なし
23. Breadcrumbs の gap がモバイルで詰まる
24. ActiveFilterChips モバイルで乱れる
25. z-index 競合

出力形式:
| 問題# | ライブラリ | 使える機能 | 現在の使用状況 | 活用方針 |
|-------|----------|----------|-------------|--------|
| #22 | radix-ui | Popover | ManufacturerCard で未使用 | Popover に置き換え |
（以下同様）

---

## 調査 3: コンポーネント間の実装パターンの一貫性確認

以下のコンポーネントを読んで、「同じ目的なのに実装が違う」パターンを列挙してください。

確認対象:
- components/RobotCard.tsx
- components/ManufacturerCard.tsx  
- components/NewsCard.tsx
- components/RobotsBrowser.tsx（またはそれに相当するブラウザコンポーネント）
- components/EmptyState.tsx
- components/TagChip.tsx（またはそれに相当するコンポーネント）
- components/Breadcrumbs.tsx
- components/ActiveFilterChips.tsx（またはそれに相当するコンポーネント）
- src/app/robots/[slug]/page.tsx
- src/app/manufacturers/[slug]/page.tsx

特に注意すること:
- カードのホバーエフェクトの実装が統一されているか
- 「セクション見出し」の h タグ + className が統一されているか
- スペック表・ファクトシートの grid パターンが統一されているか
- フィルター・検索 UI のパターンが統一されているか
- 空状態の表示パターンが統一されているか
- 余白クラス（py-*/mb-*/gap-*）の使い方が統一されているか

出力形式:
| パターン | ばらつきの内容 | 統一の方向性 |
|---------|-------------|-----------|
（具体的なファイル:行番号を含めること）

---

## 調査 4: 変更によるリスクの高い共通部品の特定

以下を調べて、「1箇所変えると多くの場所に波及する」共通部品を列挙してください。

確認対象:
- globals.css の各トークン・クラスの利用箇所数
- TagChip の利用箇所数と利用側のコンテキスト
- EmptyState の利用箇所数
- RobotCard の利用箇所数
- ManufacturerCard の利用箇所数
- site-container クラスの利用箇所数

```bash
# 各確認コマンド例
grep -rn "site-container" src/ --include="*.tsx" | wc -l
grep -rn "TagChip" src/ --include="*.tsx"
grep -rn "EmptyState" src/ --include="*.tsx"
grep -rn "RobotCard" src/ --include="*.tsx"
grep -rn "ManufacturerCard" src/ --include="*.tsx"
```

出力形式:
| 部品 | 利用箇所数 | 変更リスク | 注意点 |
|-----|---------|---------|-------|

---

## 調査 5: 型定義と既存パターンの確認

以下を確認して、UI 修正が型定義に影響するか調べてください。

確認対象:
- data/types.ts または lib/types.ts の型定義
- EmptyState, TagChip, RobotCard, ManufacturerCard の props 型定義
- lib/visualSemantics.ts の tone → class マッピング
- lib/labels.ts のラベル定義

特に確認すること:
- EmptyState に icon prop を追加するとき、既存の型を壊さないか
- TagChip に背景色を追加するとき、visualSemantics.ts の tone を使えるか
- カードのホバー効果を追加するとき、className を props で受け取っているか（cn/tw-merge 対応か）

---

## 調査 6: 検証コマンドの確認

このプロジェクトで実行可能な検証コマンドを特定してください。

確認対象:
- package.json の scripts セクション
- tsconfig.json の設定（strict モード等）
- .eslintrc や eslint.config.* の存在
- next.config.* の設定

```bash
cat package.json | grep -A 20 '"scripts"'
cat tsconfig.json
ls -la | grep -E "eslint|prettier|lint"
```

出力形式:
| コマンド | 実行可否 | 用途 |
|---------|--------|-----|
| npm run build | ✅ | ビルド確認 |
| npx tsc --noEmit | ✅/❌ | 型チェック |
| next lint | ✅/❌ | lint |
（実際に存在するコマンドのみ記載）

---

## 出力の形式と制約

- 調査1〜6 の順番で出力する
- 各調査の結果に「調査に使ったコマンド」を含める
- ファイルを読んだ場合はファイルパスと行番号を明記する
- 「〜のはず」「〜と思われる」で済ませない。コードを実際に読んで事実を書く
- 実装の提案はしない。調査レポートのみ
- まだ実装は開始しないこと
```
