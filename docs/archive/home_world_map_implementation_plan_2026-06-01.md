# Homeページ ワールドマップ実装計画（実装者向け・逐語実装可能版）

作成日: 2026-06-01 / 対象ブランチ: `gemini/refactor-ui-structure`

> この計画は `ai_implementation_workflow_prompt.md` の「1. 計画作成」「1.5. 監査」「修正後の計画」フォーマットに従う。
> **実装AIへ: この計画に書かれていない大きな変更・リファクタ・restyleを勝手にしないこと。コード片はそのまま貼ってよい。**

---

## 0. 目的（確定仕様）

Homeページの目玉UIとして、**モノクロの点描ワールドマップ**を置き、**メーカー本社をポイント（点）で配置**する。
- **ホバー（または focus）でアニメーション変化**：点が拡大＋アクセント色（`#0d7c66`）に変わり、メーカー名等の簡易情報をツールチップ表示。
- **クリックでメーカー詳細ページ `/manufacturers/[slug]` に遷移。**
- 座標が登録されているメーカーだけ描画（部分導入OK）。

### デザイン憲法との整合（厳守）
CLAUDE.md / build_notes §5 の禁止事項を持ち込まない：
- **グラデ禁止**（Aceternity原本の `linearGradient` の光る弧は使わない）。
- **無限脈動アニメ禁止**（原本の `<animate ... repeatCount="indefinite">` は使わない）。アニメは hover トリガの一回限り。
- 背景・点はモノクロ（neutral系）。色は**hover時のアクセント1色のみ**。

---

## 1. 調査した既存ファイル（事実）

| ファイル | 事実 |
|---|---|
| `src/components/ui/world-map.tsx` | Aceternity "World Map" を素コピー。`"use client"`。`start→end` の**弧を描く**用途。SVGは `pointer-events-none` で**ホバー/クリック不可**。`useTheme()`（next-themes）を使うが、下記の通りProviderが無い。**どこからも import されていない（未使用）**。 |
| `data/types.ts` | `interface Manufacturer extends BaseRecord`（106行〜）。`country: string` `hqCity?: string` はあるが **`lat/lng` は無い**。 |
| `data/manufacturers.ts` | 17社。各社 `slug` / `country` / `hqCity` あり。 |
| `lib/data.ts` | `getManufacturers()` が `publishStatus: published` のみ返す。ページからは必ずこれ経由。 |
| `lib/labels.ts` | `japanPresenceLabels: Record<JapanPresence,string>`（109行）。`unknown: '要確認'`。 |
| `src/app/page.tsx` | Server Component。ヒーローは31〜55行の `<section className="py-16 border-b border-neutral-200">`。 |
| `src/app/globals.css` | `--accent` は `oklch(0.97 0 0)`（**near-white、色ではない**）。ブランドのアクセント緑は **`#0d7c66`**（`opengraph-image.tsx:31` で使用）。 |
| next-themes | **ThemeProvider は未設置**。`useTheme()` は undefined を返す＝ライト固定。新コンポーネントでは next-themes を使わない。 |
| `package.json` | `dotted-map@^3.1.0` / `motion@^12` / `framer-motion@^12` 導入済み。 |
| `src/app/manufacturers/[slug]/page.tsx` | 詳細ページ存在（SSG）。リンク先として有効。 |

### 重要な技術判断（なぜそうするか）
1. **`world-map.tsx` は改造せず、新規コンポーネントを作る。**
   - 理由：原本は「弧」用途で、`pointer-events-none`・脈動・グラデ・next-themes依存。今回必要なのは「単独マーカー＋hover＋リンク」で、原本のロジックの大半が不要・有害。改造より新規の方が KISS かつ差分が読める。再利用するのは `dotted-map` パッケージだけ。
   - **原本 `world-map.tsx` は未使用なので削除する**（デッドコード除去）。
2. **マーカー座標は手書き投影せず `dotted-map` の `map.getPin({ lat, lng })` を使う。【最重要・v1からの修正】**
   - 理由：Aceternity原本の `projectPoint` は手書きの**等距円筒**式だが、`dotted-map` の背景点は **proj4 の Mercator 投影**（デフォルト）で配置される。投影方式も地図範囲（`X_MIN`/`X_RANGE`）も無視しているため、点が背景と**数px〜十数pxズレる**（v1の残リスクの正体）。
   - `getPin()`（`without-countries.mjs` の公開メソッド）は**背景点と同一の proj4 変換**を通し、`getSVG()` の viewBox（`0 0 width height`）と**同じ座標系**の `{ x, y }` を返す。さらに**最寄りのドットにスナップ**するため、マーカーが実際の点の上に正確に乗る。→ **ズレは原理的にゼロ**。手書き投影関数は作らない。
   - 正規化：`map.image = { width, height }` を使い `left% = x / width * 100` / `top% = y / height * 100`。
   - 代替案として react-simple-maps（d3-geo＋TopoJSON）も検討したが、出力が国境ポリゴンマップになり「モノクロ点描」という今回の意匠と合わず、投影正確性は getPin で足りるため不採用。
3. **マーカーは SVG内ではなく HTMLオーバーレイ（`<a>`）で描く。**
   - 理由：本物の `<a>` にすることで、キーボード操作・`aria-label`・モバイルのタップ領域・SEO（リンク文脈）がすべて成立する。SVG内 `<circle>` ではこれらが弱い。
4. **このコンポーネントは Server Component にする（`"use client"` を付けない）。【v1からの修正】**
   - 理由：`dotted-map`（`getSVG`/`getPin`）はビルド時(SSG)に一度実行され、クライアントへは**静的なHTML＋SVG文字列だけ**が送られる。hover演出は CSS（`group-hover`/`group-focus-visible` + `transition`）のみで JS不要。→ **クライアントJSゼロ・`dotted-map` はクライアントバンドルに入らない（LCP/バンドル削減）・ハイドレーション不一致は構造的に発生しない**。next-themes・motion・useMemo・useState はいずれも不要。
5. **マーカー色は `var(--accent)` を使わない。** `--accent` は near-white。idleは neutral、hoverは `#0d7c66`（ブランド緑、`opengraph-image.tsx` と同値）をリテラルで使う。

---

## 2. 再利用する既存コード

- `lib/data.ts` の `getManufacturers()`（Homeページで呼ぶ。`data/*` を直接読まない）。
- `lib/labels.ts` の `japanPresenceLabels`（ツールチップの日本語化）。
- `dotted-map` パッケージ（背景生成＋`getPin` による座標投影。手書き投影は使わない）。
- 既存のTailwind neutralトークン（`text-neutral-900` 等）。

## 3. 新規作成するファイル

- `src/components/ManufacturerWorldMap.tsx`（**Server Component**。`"use client"` を付けない。マップ本体）。

## 4. 変更するファイル

- `data/types.ts`：`Manufacturer` に `headquarters?` を追加。
- `data/manufacturers.ts`：17社に `headquarters: { lat, lng }` を追加。
- `src/app/page.tsx`：ヒーロー直後にマップsectionを追加し、`getManufacturers()` を import。
- `src/app/globals.css`：hover用のキーフレーム1つ追加（任意。CSS transitionで足りるなら不要 — §実装手順5参照）。

## 5. 変更しないファイル

- `lib/data.ts` / `lib/labels.ts`（読むだけ。署名変更なし）。
- `src/app/manufacturers/**`（リンク先。変更不要）。
- `src/components/ui/world-map.tsx` は**削除**（変更ではなく削除）。

---

## 6. 実装手順（順番通り・逐語）

### 手順1. 型を追加：`data/types.ts`

`interface Manufacturer extends BaseRecord {` の中、`hqCity?: string;` の直後に1行追加する：

```ts
  hqCity?: string;
  /** 本社のおおよその座標。Homeのワールドマップ描画用（任意・装飾用途）。 */
  headquarters?: { lat: number; lng: number };
```

> 型は **optional**。座標未登録のメーカーがいてもビルドは壊れない。

### 手順2. 座標データを追加：`data/manufacturers.ts`

各メーカーオブジェクトの `hqCity:` 行の直後に、対応する `headquarters` を追加する。**slugで突き合わせて正確に**。値（都市の概略座標）：

| slug | 都市 | headquarters |
|---|---|---|
| `unitree` | Hangzhou | `{ lat: 30.27, lng: 120.15 }` |
| `figure-ai` | Sunnyvale | `{ lat: 37.37, lng: -122.04 }` |
| `apptronik` | Austin | `{ lat: 30.27, lng: -97.74 }` |
| `agility-robotics` | Salem, OR | `{ lat: 44.94, lng: -123.04 }` |
| `onex` | Moss | `{ lat: 59.43, lng: 10.66 }` |
| `boston-dynamics` | Waltham | `{ lat: 42.39, lng: -71.24 }` |
| `tesla` | Austin | `{ lat: 30.30, lng: -97.70 }` |
| `sanctuary-ai` | Vancouver | `{ lat: 49.28, lng: -123.12 }` |
| `agibot` | Shanghai | `{ lat: 31.23, lng: 121.47 }` |
| `ubtech` | Shenzhen | `{ lat: 22.54, lng: 114.06 }` |
| `fourier-intelligence` | Shanghai | `{ lat: 31.20, lng: 121.50 }` |
| `booster-robotics` | Beijing | `{ lat: 39.90, lng: 116.41 }` |
| `kawasaki-heavy-industries` | 神戸 | `{ lat: 34.69, lng: 135.20 }` |
| `neura-robotics` | Metzingen | `{ lat: 48.54, lng: 9.28 }` |
| `kepler-robotics` | Shanghai | `{ lat: 31.26, lng: 121.44 }` |
| `leju-robotics` | Shenzhen | `{ lat: 22.57, lng: 114.10 }` |
| `pal-robotics` | Barcelona | `{ lat: 41.39, lng: 2.17 }` |

記入例（`unitree`）：

```ts
    country: 'China',
    hqCity: 'Hangzhou',
    headquarters: { lat: 30.27, lng: 120.15 },
    foundedYear: 2016,
```

> 同一都市（Shanghai×3, Shenzhen×2, Austin×2）は座標を**わずかにずらして**ある（上表の通り）。重なりを完全には消さないが緩和する。
> これらは概略座標で導入判断には使わない装飾用途のため、`sources` への追記は不要（CLAUDE.msの一次出典ルールは仕様値・価格・スペックが対象。座標は装飾）。

### 手順3. マップコンポーネントを新規作成：`src/components/ManufacturerWorldMap.tsx`

**下記を丸ごと新規ファイルとして作成する。** これで完成形（追加実装不要）。
**注意：先頭に `'use client'` を書かないこと（Server Component）。** `dotted-map` はビルド時に実行され、hoverはCSSのみ。

```tsx
import Link from 'next/link';
import DottedMap from 'dotted-map';

export interface ManufacturerMapInput {
  slug: string;
  name: string;
  country: string;
  presenceLabel: string;
  lat: number;
  lng: number;
}

interface ManufacturerWorldMapProps {
  manufacturers: ManufacturerMapInput[];
}

export function ManufacturerWorldMap({ manufacturers }: ManufacturerWorldMapProps) {
  // ビルド時(SSG)に一度だけ実行される。クライアントへは静的なHTML/SVGのみ送られる。
  const map = new DottedMap({ height: 100, grid: 'diagonal' });
  const { width, height } = map.image;

  const svgMap = map.getSVG({
    radius: 0.22,
    color: '#00000026', // モノクロ・約15%不透明の点
    shape: 'circle',
    backgroundColor: 'transparent',
  });

  // ライブラリ自身の投影(getPin)で lat/lng → 背景と完全一致するピクセル座標へ。
  // getPin は最寄りのドットにスナップし、getSVG の viewBox(0 0 width height) と同じ座標系を返す。
  const markers = manufacturers
    .map((m) => {
      const pin = map.getPin({ lat: m.lat, lng: m.lng });
      if (!pin) return null;
      return {
        ...m,
        leftPct: (pin.x / width) * 100,
        topPct: (pin.y / height) * 100,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  return (
    <div className="relative w-full aspect-[2/1] select-none">
      {/* 背景：点描世界地図（モノクロ）。装飾なので操作対象外・スクリーンリーダー対象外 */}
      <img
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none h-full w-full object-contain opacity-80 [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]"
      />

      {/* マーカー：HTMLオーバーレイ。本物の <a> でリンク／キーボード操作／aria を成立させる */}
      {markers.map((m) => (
        <Link
          key={m.slug}
          href={`/manufacturers/${m.slug}`}
          aria-label={`${m.name}（${m.country}・${m.presenceLabel}）の詳細を見る`}
          className="group absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${m.leftPct}%`, top: `${m.topPct}%` }}
        >
          {/* タップ/フォーカス領域を広めに確保（モバイル配慮）。見た目は透明 */}
          <span className="relative flex h-7 w-7 items-center justify-center">
            {/* hoverで広がるリング（一回きり・脈動しない） */}
            <span
              aria-hidden="true"
              className="absolute h-2.5 w-2.5 rounded-full border border-[#0d7c66] opacity-0 transition-all duration-300 ease-out group-hover:h-6 group-hover:w-6 group-hover:opacity-60 group-focus-visible:h-6 group-focus-visible:w-6 group-focus-visible:opacity-60"
            />
            {/* 本体の点。idle=neutral、hover/フォーカスでアクセント色＋拡大 */}
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-neutral-500 transition-all duration-200 ease-out group-hover:scale-150 group-hover:bg-[#0d7c66] group-focus-visible:scale-150 group-focus-visible:bg-[#0d7c66]"
            />
          </span>

          {/* ツールチップ（hover/フォーカスで表示）。モノクロ */}
          <span
            role="tooltip"
            className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 opacity-0 shadow-sm transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            <span className="font-medium">{m.name}</span>
            <span className="ml-1 text-neutral-500">{m.country}・{m.presenceLabel}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
```

> **このコンポーネントは「データを受け取って描画するだけ」**（Separation of Concerns）。投影(`getPin`)はライブラリ任せ、データ整形は呼び出し側（page.tsx）で行う。

### 手順4. Homeページに組み込む：`src/app/page.tsx`

(a) import セクションに追加：

```ts
import { getManufacturers, getGuideBySlug, getGuides, getManufacturerForRobot, getReports, getRobots } from '@/lib/data';
import { japanPresenceLabels } from '@/lib/labels';
import { ManufacturerWorldMap } from '@/components/ManufacturerWorldMap';
```
※既存の `import { ... } from '@/lib/data';` に `getManufacturers` を**追記**するだけでよい（重複importを作らない）。`reportTypeLabels` の既存import行に `japanPresenceLabels` を**追記**する。

(b) `export default function HomePage() {` の冒頭、`const featured = ...` の近くに、座標があるメーカーだけ整形する処理を追加：

```ts
  // ワールドマップ用：座標が登録されたメーカーのみ
  const mapPoints = getManufacturers()
    .filter((m) => m.headquarters)
    .map((m) => ({
      slug: m.slug,
      name: m.nameJa ?? m.name,
      country: m.country,
      presenceLabel: japanPresenceLabels[m.japanPresence],
      lat: m.headquarters!.lat,
      lng: m.headquarters!.lng,
    }));
```

(c) ヒーロー `<section>`（31〜55行）の**閉じ `</section>` の直後**に、マップsectionを追加：

```tsx
      {mapPoints.length > 0 && (
        <section className="py-16 border-b border-neutral-200">
          <p className="font-mono text-xs uppercase tracking-wider text-neutral-500 mb-2">
            Global Manufacturers
          </p>
          <h2 className="text-2xl font-semibold text-neutral-900 mb-2">主要メーカーの所在地</h2>
          <p className="text-sm text-neutral-600 mb-8 max-w-2xl">
            掲載中のヒューマノイド開発企業の本社所在地。地点にカーソルを合わせると企業名と日本市場での対応状況を表示します。
          </p>
          <ManufacturerWorldMap manufacturers={mapPoints} />
        </section>
      )}
```
> prop名は `manufacturers`（コンポーネント側の型 `ManufacturerWorldMapProps` と一致させる）。`mapPoints` の各要素は `ManufacturerMapInput` 型に一致している。

> セクションラベルは方針通り **モノスペース＋大文字**（`font-mono uppercase tracking-wider`）。

### 手順5. （任意）`globals.css`

CSSキーフレームは**不要**。hoverアニメは Tailwind の `transition-all` + `group-hover:` で完結している。
**この手順はスキップしてよい。** 追加するな（不要な抽象化を避ける）。

### 手順6. デッドコード削除

`src/components/ui/world-map.tsx` を**削除**する（未使用・今回の新コンポーネントで置換）。
- `git rm src/components/ui/world-map.tsx`
- 削除後に `dotted-map` 以外（`motion` / `framer-motion`）が他で未使用なら本来は依存削除候補だが、**今回はスコープ外**。`package.json` は触らない（他コンポーネントの利用有無の全調査は別タスク）。

---

## 7. 影響範囲

- 追加されるUIはHomeページの1セクションのみ。他ページ・他コンポーネントに副作用なし（`lib/*` の署名を変えない）。
- `data/types.ts` の変更は **optional フィールド追加**のみ → 既存データ・既存ページの型は壊れない。
- `world-map.tsx` 削除の影響：import元ゼロ（調査済み）→ 影響なし。

## 8. リスクと残課題

| リスク | 重大度 | 対応 |
|---|---|---|
| ~~投影ズレ~~ | — | **解消済み**。手書き投影をやめ `map.getPin()`（背景点と同一 proj4 変換）を使うため、マーカーは背景ドットに原理的に一致する。微調整不要。 |
| 同一都市のメーカーが重なる（Shanghai×3, Shenzhen×2, Austin×2） | 中 | `getPin` は最寄りドットにスナップするため、近接座標は**同一ドットに重なりリンクが上下に積まれる**（上にあるものだけがhover/クリックされやすい）。座標を微小にずらして緩和済みだが、grid密度次第で完全分離しない。実験段階では許容。気になる場合の対応案：(a) `DottedMap({ height: 150 })` 等でグリッドを細かくする、(b) 同一ドットの複数社をツールチップ内にまとめて列挙する小実装を足す。**今回はしない（KISS）。** |
| モバイルで点が密集しタップしづらい | 中 | タップ領域を `h-7 w-7`（28px）に拡大済み。狭幅で破綻するなら将来 `sm:` 以上のみ表示に。 |
| ツールチップが画面端で見切れる | 低 | 端のメーカー（Norway等）でhover確認。問題あれば配置を `top-full` 固定から条件分岐に（今回はしない）。 |
| `dotted-map` を Server Component で import | 低 | ビルド時(SSG)実行。Node環境で動くため問題なし。万一 `npm run build` で「Module not found / window is not defined」等が出たら、その時だけ別対応を相談（現状その兆候はなし）。 |

## 9. 検証コマンド（package.jsonに存在するもののみ）

```bash
npm run build   # SSG・型エラー・ハイドレーション前提の検証
npm run dev     # 目視確認
```
> lint / typecheck / test スクリプトは**未設定**（CLAUDE.md記載）。存在しないコマンドを実行しない。型検証は `npm run build`（tsc）で兼ねる。

## 10. 手動確認チェックリスト

- [ ] Homeでヒーロー直後にモノクロ点描マップが表示される。
- [ ] 17社（座標登録分）の点が地理的に妥当な位置に出る（米国・中国・日本・欧州）。
- [ ] 点に**ホバーすると拡大＋アクセント緑＋リング拡大（一回）**、ツールチップに「企業名／国・対応状況」が出る。
- [ ] 点クリックで `/manufacturers/[slug]` に遷移する。
- [ ] **Tabキー**で点にフォーカスでき、同じhover演出が出て、Enterで遷移する（`group-focus-visible`）。
- [ ] リロード後にコンソールへ **hydration mismatch 警告が出ない**。
- [ ] ヘッダーのドロップダウンがマップより前面（z-index競合なし。マップsectionに高いz-indexを付けていないこと）。
- [ ] 320px / 768px / 1280px幅で横スクロールが出ない。
- [ ] グラデ・無限脈動アニメが画面上に存在しない（方針順守）。

---

## 11. 監査（10問題 / `ai_implementation_workflow_prompt.md` §1.5）

1. **投影ズレ（v1最大の残リスク）** — 高 — 手書き等距円筒投影は背景(Mercator)と不一致。→ ライブラリの `map.getPin()` に置換し背景と同一変換に統一（判断2）。**ズレ解消。**
2. **KISS: 原本コンポーネントの魔改造** — 中 — 弧/グラデ/脈動を無理に流用するとデッドロジックが残る。→ 新規作成＋原本削除で回避（手順1判断1）。
3. **SoC: page.tsxにデータ整形とUIが混在** — 中 — マップ用整形は `mapPoints` として page 側に隔離、投影はライブラリ、描画はコンポーネントに分離（手順3・4）。
4. **Type Safety: 自由文字列の座標** — 中 — `headquarters?: { lat:number; lng:number }` と型付け、`ManufacturerMapInput` で受け渡しも型付け（手順1・3）。
5. **Accessibility: SVG点はキーボード/SR非対応** — 高 — HTML `<a>`＋`aria-label`＋`group-focus-visible`＋`role="tooltip"`、タップ領域28pxで解消（手順3）。
6. **Hydration: 環境依存レンダリング** — 高 — **Server Component化**しクライアントJSをゼロに（判断4）。`dotted-map` はビルド時実行、`useTheme()`（next-themes・Provider無し）は不使用。→ ハイドレーション不一致は構造的に発生しない。
7. **色のハードコード/トークン誤用** — 中 — `--accent` は near-white で誤用源。意図的にブランド緑 `#0d7c66`（既存 `opengraph-image.tsx` と同値）をリテラル使用、idleは neutral トークン（判断5）。
8. **境界座標** — 低 — `getPin` は背景生成と同じ proj4 を通し、`avoidOuterPins` 既定 false なので有効座標は必ず viewBox 内 `{x,y}` を返す（非有限値は `if (!pin) return null` で除外済み）。
9. **z-index競合（既存バグ再発）** — 中 — マップsectionに高z-indexを付けない。ツールチップは section内 `z-10` 止まり。ヘッダーDOMより前に出さない（手順4・チェックリスト）。
10. **デザイン憲法違反（グラデ/脈動/AI感）** — 高 — 原本のグラデ弧・無限 `<animate>` を**不採用**。hover一回のtransitionのみ。モノクロ＋アクセント1色（§0・判断1）。

### 反映しなかった指摘と理由
- 「同一ドット重なりの完全解決（クラスタリングUI）」：実験段階では過剰。grid密度up or 列挙表示は将来対応（§8）。
- 「`framer-motion`/`motion` の依存削除」：Server Component化で当コンポーネントは motion を使わないが、`package.json` からの依存削除は他コンポーネントの利用調査が必要でスコープ外。`package.json` は触らない。

---

## 12. 実装順序（最終）

1. `data/types.ts` に `headquarters?` 追加。
2. `data/manufacturers.ts` 17社に座標追加。
3. `src/components/ManufacturerWorldMap.tsx` 新規作成（手順3のコード丸ごと）。
4. `src/app/page.tsx` に import・`mapPoints`・section 追加。
5. `src/components/ui/world-map.tsx` 削除。
6. `npm run build` 通過確認 → `npm run dev` で手動チェックリスト。
7. `git diff --stat` を見て、想定5ファイル（types/manufacturers/page/新規component/削除）以外が変わっていないか確認。

**まだ実装は開始しない。この計画でよいか確認すること。**
