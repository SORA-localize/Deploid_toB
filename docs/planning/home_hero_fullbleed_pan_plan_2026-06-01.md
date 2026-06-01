# Homeヒーロー：フル幅ワールドマップ＋横パン（回転）実装計画

作成日: 2026-06-01 / ブランチ: `gemini/refactor-ui-structure`
方式: `ai_implementation_workflow_prompt.md`（計画 → §1.5 監査 → 修正版）

> 実装AI/自分への注意：計画外の大改造・restyleをしない。コード片は貼ってよい。各フェーズで `npm run build` を通し、`git diff --stat` を確認してから次へ。

---

## 0. 目的（確定仕様）

ワールドマップを **Homeの本体（ヒーロー）** にする。
- マップを**フル幅（左右余白なし）**で表示。
- **左右にパン＝経度方向に回転**できる（ラップアラウンドで無限ループ）。無操作時はゆっくり自動回転。
- **CTA（導入ガイドを読む／ロボット一覧）を右下**、**情報カードを左下**に配置（対角でUI衝突しない）。
- 見出し＋サブコピーは**左上にオーバーレイ**（toBの価値訴求は残す）。
- 既存の対話（ホバー/フォーカスでカード＋導入事例の弧）と**データ層（getPin投影）は維持**。

### この計画で“やらない”こと（スコープ外）
- 3Dグローブ（three.js/cobe）。今回は2D横パンのみ（WebGL不要）。
- データ構造の変更（`data/*` は不変。パンは表示変換のみ）。
- ヘッダー/フッター/他ページの改変。フル幅化は**ヒーロー1ブロックのみ**。

---

## 1. 調査した既存コード（事実）

| ファイル | 役割・現状 |
|---|---|
| `src/app/page.tsx`(server) | ヒーロー(テキスト)＋`max-w-7xl mx-auto px-6` 内に `<ManufacturerWorldMap manufacturers={mapPoints}>` を別セクションで配置。`mapPoints` を `lib/data` から組み立て（slug/name/country/lat/lng/foundedYear/logoSrc/deployments）。 |
| `components/ManufacturerWorldMap.tsx`(server) | `new DottedMap({height:100,grid:'diagonal'})` → `getSVG`(背景) + `getPin`(HQ/導入先) → `deOverlap`/`pushAway` → `markers:[{slug,name,country,foundedYear,logoSrc,leftPct,topPct,arcs}]`。`div.relative.aspect-[2/1].bg-neutral-950` に bg `<img object-contain mask>` ＋ `<ManufacturerMapOverlay>` を描画。 |
| `components/ManufacturerMapOverlay.tsx`(client) | `activeSlug`/`paused` state、自動デモ(巡回)、ホバー/フォーカス、弧SVG(`viewBox 0 0 100 100` `preserveAspectRatio=none`)、端点ドット、マーカー(`<Link>` を `left/top%`)、左下カード。 |
| `src/app/globals.css` | `.manufacturer-dot-enter`/`.manufacturer-card-enter`/`.manufacturer-arc-flow` キーフレーム＋ `prefers-reduced-motion` ガード。 |
| 投影の事実 | マーカーは **0–100%（2:1の1世界）座標**で配置。背景imgが `object-contain`（コンテナも2:1）なので「コンテナ% = 画像%」で一致している。**これが崩れると点と背景がズレる**（重要）。 |

### 重要な技術判断（なぜ）
1. **パンは“2:1コピーをタイル状に並べて track を translateX”** で実現（ピクセル実測に依存しない）。
   - 各コピー＝ `h-full aspect-[2/1]`（→幅=高さ×2）。複数コピーを横に並べ、track 全体を `translateX(panX)`。1コピー幅を超えたら mod で戻す＝**シームレス無限ループ**。
   - 各コピー内のマーカーは**現状の `left/top%` をそのまま流用**できる（コピーは2:1なので座標系不変）＝DRY。
   - 背景とマーカーが**同じ track の子**なので常に一致（投影整合を壊さない）。
2. **状態（panX/activeSlug）は client、データ/投影は server のまま**（SoC維持）。`getPin` 投影は server で完了し、client はビュー変換のみ。
3. **マーカーのクローン重複は a11y で 1コピーだけ可視化**（後述・監査#1）。
4. パンは `transform: translateX` の**1要素更新のみ**（rAF）＝レイアウト再計算なしで軽量（KISS/性能）。

---

## 2. 再利用する既存コード
- `lib/data.ts`（`getManufacturers`/`getDeploymentsForManufacturer`）、`mapPoints` 組み立て（page.tsx・現状維持）。
- `ManufacturerWorldMap`(server) の **svgMap生成・getPin・deOverlap・pushAway・markers生成ロジックは丸ごと再利用**（出力先だけ変更）。
- マーカー/弧/カードのJSX（`ManufacturerMapOverlay`）を**分割して再利用**（下記）。
- 既存キーフレーム（dot-enter/card-enter/arc-flow）。

## 3. 新規作成
- `components/ManufacturerMapStage.tsx`(client)：フル幅ステージの所有者。state（panX, activeSlug, dragging）、パン track（Nコピー）、左下カード、右下CTA、左上見出しオーバーレイ、ドラッグ／自動回転／reduced-motion。
- `components/ManufacturerMapCopy.tsx`(client・表示専用)：1コピー（背景img＋マーカー群＋アクティブ時の弧）。`ariaHidden` で a11y制御。

## 4. 変更
- `src/app/page.tsx`：ヒーローを `max-w` の外に出してフル幅セクション化。テキストヒーロー＋既存マップセクションを**統合**（見出し/サブコピー/CTAはステージに渡す）。
- `components/ManufacturerWorldMap.tsx`：自前の box/img/overlay 描画をやめ、`svgMap`＋`markers`＋`heading`/`subcopy`/`ctas` を `<ManufacturerMapStage>` に渡すだけにする（server の計算は維持）。
- `components/ManufacturerMapOverlay.tsx`：**`ManufacturerMapCopy` ＋ `ManufacturerMapStage` に分割して置換**（カードはStageへ、マーカー/弧はCopyへ）。役目を終えたら削除 or リネーム。

## 5. 変更しない
- `data/*`、`lib/data.ts`、`lib/labels.ts`、`lib/media.ts`、他ページ、Header/Footer、`generateStaticParams`。
- マーカーの `left/top%` 計算規約（コピー内では不変）。

---

## 6. 幾何・パンの設計（実装の肝）

### レイアウト
```
<section class="relative w-full">                 // フル幅。w-full（w-screenは横スクロールバー誘発のため不可）
  <div ref=stage class="relative h-[clamp(440px,82vh,880px)] w-full overflow-hidden bg-neutral-950">
    <div ref=track class="flex h-full will-change-transform" style="transform:translateX(panX)">
      {copies.map(k => <ManufacturerMapCopy key=k primary={k===0} .../>)}  // 各: h-full aspect-[2/1] shrink-0
    </div>
    <Scrim/>                       // 左上＆下部の可読性スクリム（機能的・装飾グラデではない）
    <HeadingOverlay/>              // 左上：見出し＋サブコピー（light text）
    <Card/>                        // 左下：アクティブ社の情報（既存カードを移設）
    <CTAs/>                        // 右下：導入ガイド/ロボット一覧（dark向けに配色）
  </div>
</section>
```

### サイズとコピー枚数
- 1コピー幅 `copyW = stageHeight * 2`（aspect 2:1）。`stage` を ref で測り `copyW` 算出。
- コピー枚数 `N = max(3, ceil(viewportW / copyW) + 1)`（常にビューポートを覆う）。`ResizeObserver` で再計算。
- 縦は当面フル（極地含む）。空の極地が気になれば `track` を `scaleY(1.2) translateY(-…)` で人口帯にフレーミング（**任意・後調整**、マスクのフェードと併用）。

### パン
- `panX`(px) を rAF で更新。`translateX(panX)`。ラップ：`panX = ((panX % copyW) + copyW) % copyW - copyW`（常に `(-copyW, 0]`、Nコピーで継ぎ目を覆う）。
- ドラッグ：`pointerdown`→ `dragging=true,startX,startPan`、`pointermove`→ `panX=startPan+(x-startX)`、`pointerup`→ 終了。移動量 >6px なら**クリック抑止**（リンク誤遷移防止）。
- タッチ：`stage` に `touch-action: pan-y`（縦ページスクロールは生かし、横は自前処理）。
- 自動回転：`dragging`/ホバー中/`reduced-motion` 以外で rAF が `panX -= ~0.35px/frame`（≈20px/s）。操作で停止、無操作 `RESUME_DELAY` 後に再開。
- `reduced-motion`：自動回転と弧フローを無効、ドラッグのみ可。

### マーカー/弧（コピー内）
- 既存の `left/top%`・弧SVG（`viewBox 0 0 100 100` `preserveAspectRatio=none`）を**コピー単位でそのまま**描画。弧はアクティブ社のみ。
- 端点ドットのみ（顧客名はカード）。現状踏襲。

### 状態の共有
- `activeSlug` は Stage が保持。各 Copy に渡す。ホバー/フォーカスは `onActivate(slug)`。カードは Stage で1枚だけ描画（左下固定、コピー非依存）。

---

## 7. アクセシビリティ（重点）
- **クローン重複対策**：`primary`(index0) の Copy だけ `<a>` をフォーカス可能にし、他コピーは `aria-hidden tabIndex=-1`（視覚的複製は支援技術から隠す）。→ 同一社リンクが複数読み上げられるのを防ぐ。
- **キーボード**：primary の `<a>` にフォーカスが入ったら、その点が見えるよう `panX` をスナップ（中央寄せ）。Tab順は地域順（西→東）＝既存ソート。
- CTA/カードは実 `<a>`/`role=tooltip`。`aria-label` は既存（社名＋地域名）。
- ドラッグ領域には `aria-hidden` 背景imgのみ（既存）。
- マップは「主要メーカーの所在地」を表す。`/manufacturers` 一覧が等価な非地図導線として既に存在（a11yフォールバック）。

## 8. 影響範囲
- ヒーローのDOM構造とフル幅化のみ。`max-w` の外に出す範囲は**ヒーロー section だけ**。以降のセクション/フッター/ヘッダーは不変。
- データ層・投影・SSGは不変（`getPin` 契約維持）。
- 既存キーフレーム流用、新規CSSは最小（パンはJS transform）。

## 9. 将来のデータ修正・拡張への対応（明記）
- メーカー追加＝`headquarters` を足すだけ／導入事例追加＝`deployments` に1件で弧が出る。**ピクセル手調整ゼロ**。パンは表示変換なのでデータ層に無影響。
- スケール注意：`deOverlap` はビルド時 O(n²)（数百件まで余裕）、マーカーはHTMLノード（×Nコピー）なので数百社規模までは軽快。数千規模になったら canvas 化を別途検討（当面不要）。

## 10. 検証コマンド（存在するもののみ）
```bash
npm run build   # SSG・型・ハイドレーション前提の検証
npm run dev     # 目視
```
lint/test は未設定（CLAUDE.md）。型検証は build(tsc) で兼ねる。ヘッドレスChrome＋CDPで実機スクショ確認（パン/ドラッグ/ホバー/CTA/カード）。

## 11. 手動確認チェックリスト
- [ ] ヒーローがフル幅（左右余白なし・横スクロールバーが出ない）。
- [ ] ドラッグで左右に回転、継ぎ目でカクつかずシームレスにループ。
- [ ] 無操作でゆっくり自動回転、操作で停止→一定時間後に再開。
- [ ] ホバー/フォーカスで左下カード＋弧、CTAは右下で常時クリック可（マーカーと競合しない）。
- [ ] ドラッグ後の指離しでリンク遷移しない（6px閾値）。
- [ ] Tabでマーカーにフォーカス→画面内にスナップ→Enterで遷移。クローンは読み上げ重複しない。
- [ ] 320/768/1280/1920 幅で破綻なし。モバイルで縦スクロールは生きる（touch-action）。
- [ ] `prefers-reduced-motion` で自動回転/フロー停止、ドラッグとホバーは動く。
- [ ] 見出し/CTA/カードがマップ上で可読（スクリム）。
- [ ] `npm run build` 通過、`git diff --stat` が想定ファイルのみ。

---

## 12. 監査（10問題 / §1.5）

1. **A11y：マーカーのクローン重複読み上げ／フォーカス** — 高 — クローンを `aria-hidden tabIndex=-1`、primaryのみフォーカス可、focusで `panX` スナップ（§7）。
2. **モバイル：横ドラッグが縦スクロールを奪う** — 高 — `touch-action: pan-y`＋移動量で横/縦を判定。クリック抑止閾値。
3. **フル幅で横スクロールバー発生（`w-screen`/`100vw` の罠）** — 中 — `w-full`＋`overflow-hidden`、`100vw` 不使用。
4. **ハイドレーション不一致**（client stage の初期状態） — 中 — 初期 `panX=0/activeSlug=null` で SSR と一致。サイズ依存値は mount 後に `ResizeObserver` で算出（初期は3コピー固定で安全）。
5. **投影整合の破壊**（cover/scale で点と背景がズレ） — 高 — 背景とマーカーを**同一コピー（同一transform）の子**にして一致を保証。`object-contain` 相当を維持（aspectコピー）。縦scaleする場合は track 全体に掛けて両者同時に変形。
6. **性能：パンで再レイアウト/再描画** — 中 — `translateX` の単一要素更新＋`will-change-transform`。マーカーは静的（rAFで座標再計算しない）。自動回転は rAF 1本。
7. **SoC：client にデータ取得が漏れる** — 低 — `getPin`/`lib/data` は server のまま。client は `svgMap`/`markers`/`panX` のみ。
8. **ドラッグ vs クリック誤爆** — 中 — 移動量6px閾値で `preventDefault`/遷移抑止。
9. **可読性：見出し/CTAがマップ上で読めない** — 中 — 機能的スクリム（黒→透明、装飾グラデではない）＋固定コーナー。コントラスト確認。
10. **DRY/KISS：overlay 分割で重複や過剰抽象** — 中 — `ManufacturerMapCopy`（表示専用）と `ManufacturerMapStage`（状態）に責務分離。1コピーJSXをN回再利用。投影式は既存1箇所のまま。

### 反映しなかった/保留
- 縦の極地クロップ（scaleY）：必須でないので**任意・後調整**（v1はフル）。
- 自動デモの“ハイライト巡回”：自動回転と二重で賑やかになるため**v1では自動回転に一本化**（ホバー時のみカード）。将来「中央の点を自動ハイライト」へ拡張可（要確認）。
- 慣性（フリック）：v1は無し（KISS）。必要なら後追加。

### 残るリスク
- 縦長スマホでマップ高さが小さく点が密集 → タップ領域28pxで緩和済みだが、狭幅は要実機確認。
- ワードマークロゴのORBブロック（既知・別タスク）。
- 自動回転＋弧フロー＋ホバーの“動きの総量”が toB に対して過剰でないか＝実機で要感触（速度定数で調整）。

---

## 13. 実装順序（フェーズ・各フェーズで build＋スクショ）

- **Phase 1：フル幅レイアウト（パン無し）**
  page.tsx をフル幅化、Stage 雛形（1コピー＝現状の見た目）、左上見出し＋右下CTA＋左下カードのオーバーレイ配置、スクリム。`build`＋スクショで「全幅・対角UI」を確認。
- **Phase 2：横パン＋ラップアラウンド＋ドラッグ**
  Copy分割、Nコピーtrack、`ResizeObserver`でcopyW/N、ドラッグ＋クリック抑止＋`touch-action`、a11y（aria-hidden clones, focus-snap）。`build`＋スクショ（パン位置違いで継ぎ目確認）。
- **Phase 3：自動回転＋reduced-motion＋微調整**
  rAF自動回転、無操作再開、reduced-motionガード、速度/縦フレーミング調整。`build`＋スクショ。

各フェーズ後に `git diff --stat`。最終で全チェックリスト。

---

## 14. レビュー結論（§0原則チェック）
- DRY：1コピーJSXをN再利用・投影式1箇所・既存ロジック流用 ✓
- KISS：3Dや慣性を避け2D transform パンに限定 ✓
- SoT：座標は `data/*` の lat/lng のみ、投影は `getPin` 一本 ✓
- SoC：server=データ/投影、client=ビュー/操作 ✓
- Type Safety：`ManufacturerMarker` 型を Stage/Copy で共有 ✓
- A11y：clones非可視化・focusスナップ・実リンク・reduced-motion ✓
- Responsive：`w-full`/`clamp`高さ/`ResizeObserver`/`touch-action` ✓
- URL State：地図のパン位置はURL化しない（一時的ビュー状態。SEOはマーカーの`<a href>`が担保） ✓
- Operational Safety：外部キー/ID直書きなし、外部タイル無し（静的SVG） ✓
- 既存整合：命名/ディレクトリ/`@/`エイリアス/neutralトークン/既存キーフレーム踏襲 ✓

**判定：実装可能。重大な未決は「見出しを左上オーバーレイにする」前提のみ（妥当・必要なら後で配置変更可）。この計画で実装に入る。**
