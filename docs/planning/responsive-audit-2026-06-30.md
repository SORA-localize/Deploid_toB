# レスポンシブ対応 調査レポート

作成: 2026-06-30

---

## 対応済み（この調査と同日に修正済み）

- **比較ページ お気に入り・メーカーリスト閾値** — `xl`(1280px)→`lg`(1024px)に引き下げ済み（`components/CompareClient.tsx`）

---

## HIGH：機能・表示に直接影響

### H-1 モバイルナビゲーションドロワー固定幅
- **ファイル**: `components/Header.tsx` L117
- **内容**: ドロワーの幅が `w-72`（288px）固定。320px未満の端末（古いAndroid等）で横スクロールが発生しうる
- **対象**: `< 640px`
- **修正案**: `w-[min(288px,90vw)]`

### H-2 ComparisonRobotPanel スペック値の切り捨て
- **ファイル**: `components/ComparisonRobotPanel.tsx` L165, L179
- **内容**: スペック値に `max-w-[65%] break-words` を使用。モバイルではスペック値が短く切り詰められて読めないケースがある
- **対象**: `< 640px`
- **修正案**: `max-w-[45%] sm:max-w-[65%]`

---

## MEDIUM：UXに影響するが致命的でない

### M-1 RobotImageCarousel 固定高さ
- **ファイル**: `components/RobotImageCarousel.tsx` L68, L83
- **内容**: `h-[280px] sm:h-[360px] md:h-[420px]` と固定値。lg以上でスケールしない。タブレット横向きで余白が多い
- **修正案**: `lg:h-[480px]` 追加、または `clamp()` で流体化

### M-2 ManufacturerMapStage モバイル固定高さ
- **ファイル**: `components/ManufacturerMapStage.tsx` L221
- **内容**: `md:h-[clamp(320px,65vh,880px)]` はmd以上のみ。モバイルは `h-[320px]` 固定でビューポートに関係なく一定
- **修正案**: `sm:h-[clamp(240px,60vh,320px)]` を追加

### M-3 FeaturedRobotsGrid モバイル表示
- **ファイル**: `components/FeaturedRobotsGrid.tsx` L28
- **内容**: `w-[44%]` ベースで2件/画面。モバイルでは1件フォーカス表示のほうが読みやすい可能性
- **修正案**: `w-[90%] sm:w-[35%]` など1件寄せを検討

### M-4 StickyHeader でモバイルにロボット名が非表示
- **ファイル**: `components/RobotDetailStickyHeader.tsx` L17, `components/ManufacturerDetailStickyHeader.tsx` L27
- **内容**: 名前表示が `sm:block` 以上でのみ有効。モバイルでは名前が一切表示されない
- **修正案**: ベースサイズにも `max-w-[10rem] truncate` を追加

### M-5 NewsHeroCarousel 大画面での行数制限
- **ファイル**: `components/NewsHeroCarousel.tsx` L108-112
- **内容**: 見出しが `line-clamp-2` 固定。`2xl`（1536px+）では文字サイズが4xlになるのに2行制限で短すぎる
- **修正案**: `2xl:line-clamp-3`

### M-6 HomeContentNavigator 固定 min-height
- **ファイル**: `components/HomeContentNavigator.tsx` L161, L191, L217
- **内容**: `min-h-[440px]` / `2xl:min-h-[520px]` のみ。モバイル・タブレットで余白が多い
- **修正案**: `sm:min-h-[300px] md:min-h-[380px]` を追加

### M-7 SelectControl / ドロップダウンのモバイル表示
- **ファイル**: `components/SelectControl.tsx`, `components/ui/searchable-dropdown.tsx` L210
- **内容**: ドロップダウンが `max-w-[calc(100vw-1rem)]` でほぼ全幅に広がりモバイルで閉じにくい。SelectControlの見た目がスマホで「キモい」（ユーザー指摘）
- **対象**: `< 768px`
- **修正案**: モバイル向けにボトムシートやネイティブ `<select>` へのフォールバックを検討

---

## LOW：ポリッシュ・将来対応

### L-1 2xl（1536px+）が全体的に未対応
- `2xl:` の使用は18箇所のみ。大画面モニターでレイアウトが間延びするページがある
- 特に `/robots`、`/use-cases` のグリッドは `xl:grid-cols-4` で止まっている

### L-2 gap のスケールが途中で止まる
- `gap-3 sm:gap-4` で止まっているコンポーネントが多い。`md:gap-5 lg:gap-6` まで伸ばすと画面サイズに応じた余白設計になる

### L-3 ManufacturerCard テキスト truncate
- **ファイル**: `components/ManufacturerCard.tsx` L103, L137, L173
- **内容**: `min-w-0 truncate` と `ml-2 sm:ml-4` の組み合わせ。280-320px端末でテキストが短すぎる

---

## 補足：現在のブレークポイント使用分布

| ブレークポイント | 使用箇所数 | 評価 |
|---|---|---|
| `sm:` (640px) | 89 | ✅ 十分 |
| `md:` (768px) | 75 | ✅ 十分 |
| `lg:` (1024px) | 68 | ✅ 十分 |
| `xl:` (1280px) | 42 | △ やや少ない |
| `2xl:` (1536px) | 18 | ⚠️ 未対応が多い |

---

## 優先対応順

1. **H-1** モバイルナビドロワー幅（overflow防止）
2. **H-2** ComparisonRobotPanel スペック切り捨て
3. **M-4** StickyHeader モバイル名前非表示
4. **M-7** SelectControl スマホ表示改善（UX改善要件として別計画化推奨）
5. その他は随時
