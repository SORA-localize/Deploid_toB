# Home メーカー地図 MapLibre 移行計画（2026-06-01）

## 目的

Home のメーカー所在地マップを、現行の `dotted-map` + CSS transform 方式から MapLibre GL JS ベースの地理座標マップへ移行する。

狙いは「Google Earth 風の3D地球儀」ではなく、ユーザーが世界全体を俯瞰し、気になるメーカー所在地へ自然に寄って、周辺・他地域へ移動できる地図体験を作ること。

## 現状調査

### 関連ファイル

| ファイル | 現状 |
| --- | --- |
| `src/app/page.tsx` | Home hero 下に `ManufacturerWorldMap` を表示。`headquarters` 付きメーカーから `mapPoints` を作成。 |
| `components/ManufacturerWorldMap.tsx` | Server Component。`dotted-map` でSVGと `getPin()` のパーセント座標を生成。 |
| `components/InteractiveWorldMap.tsx` | Client Component。SVG全体を `translate3d + scale` で拡大縮小している。 |
| `src/app/globals.css` | `.world-map-*` の scan / pulse animation を追加済み。 |
| `data/types.ts` | `Manufacturer.headquarters?: { lat: number; lng: number }` を追加済み。 |
| `data/manufacturers.ts` | 17社に本社座標を追加済み。 |
| `package.json` | `dotted-map` が追加済み。`maplibre-gl` は未導入。 |

### 現行実装の問題

1. `InteractiveWorldMap` は地図画像全体をCSS transformで拡大しているだけで、地理座標ベースのズームではない。
2. ズームしても地図の情報密度が変わらず、点群の解像感・ドット間隔・ラベル表示が変化しない。
3. marker は初期計算済みの `%` 座標を拡大しているだけなので、地図viewportに応じた再配置・クラスタ・表示密度制御ができない。
4. tooltip も地図と一緒にスケールするため、ズーム時にUIとしての読みやすさを維持しづらい。
5. wheel / trackpad 操作を自前実装しているため、ズーム限界後にページ側スクロールやブラウザ挙動と衝突しやすい。
6. Home のファーストビュー体験として、地理的に「寄って見る」期待に対して実装モデルが合っていない。

## 採用方針

### MapLibre GL JS に移行する

MapLibre GL JS を採用する。理由は次の通り。

- 緯度経度を本物の地図座標として扱える。
- pan / zoom / inertia / touch / wheel / keyboard などの地図操作をライブラリに任せられる。
- GeoJSON source + layer により、ズームレベルに応じて marker の半径・opacity・label 表示を制御できる。
- `cooperativeGestures` や `scrollZoom` 設定で、ページスクロールとの衝突を制御しやすい。
- 3D地球儀ではなく、2D/疑似3Dの地図体験として十分リッチにできる。

参考:
- MapLibre GL JS docs: https://maplibre.org/maplibre-gl-js/docs
- MapLibre cooperative gestures: https://maplibre.org/maplibre-gl-js/docs/examples/cooperative-gestures/
- MapLibre MapOptions: https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/

### Three.js は採用しない

今回は Three.js は採用しない。

理由:
- 目的は3D地球儀ではなく、地理座標上でメーカー地点を探索すること。
- Three.js で地図操作・投影・ラベル衝突・tooltip・タッチ操作を作ると、地図エンジンを自作する範囲が大きくなる。
- MapLibre の方が「ズームしてmarkerが分離する」「地図操作が自然」「レイヤー表示をズームに連動する」という要件に近い。

### marker は DOM marker ではなく GeoJSON layer を基本にする

メーカー地点は GeoJSON source として MapLibre に渡し、`circle` layer / `symbol` layer で描画する。

理由:
- DOM marker はhover cardなどには便利だが、zoom/pan中の追従・密度制御・cluster表示では layer の方が自然。
- `circle-radius` や `text-size` を zoom expression で変えられる。
- 低ズームではcluster、一定ズーム以上で個別地点を表示できる。

tooltip / popup は React state で選択中featureを保持し、地図コンテナ上の固定サイズUIとして出す。地図と一緒に拡大縮小しない。

## 既存コードの再利用

### 再利用する

- `data/types.ts` の `Manufacturer.headquarters`
- `data/manufacturers.ts` の座標データ
- `src/app/page.tsx` の `getManufacturers()` / `japanPresenceLabels` による表示用データ生成
- 既存の `@/lib/data` / `@/lib/labels`
- Home のセクション位置（hero 下）

### 再利用しない / 削除する

- `components/ManufacturerWorldMap.tsx`
- `components/InteractiveWorldMap.tsx`
- `src/app/globals.css` の `.world-map-*` CSS
- `dotted-map` 依存
- `docs/planning/home_world_map_implementation_plan_2026-06-01.md` は過去計画として残すが、実装対象としては無効化扱いにする。

## 新規作成するコード

### `components/ManufacturerMap.tsx`

Client Component。

責務:
- MapLibre map の初期化・破棄
- GeoJSON source / layer の追加
- zoom / move / hover / click のイベント購読
- hover tooltip / selected card の表示
- zoom controls / reset / fit points のUI

このコンポーネントは `maplibre-gl` と CSS import の都合上 client component にする。

### `lib/manufacturer-map.ts`

地図用の純粋関数・定数を配置する。

候補:
- `ManufacturerMapPoint` 型
- `toManufacturerFeatureCollection(points)`
- `manufacturerMapInitialView`
- `manufacturerMapBounds`
- MapLibre style object または style URL
- layer id / source id 定数

UI component 内に source id や layer id を散らさず、Single Source of Truth に寄せる。

## 変更するファイル

| ファイル | 変更内容 |
| --- | --- |
| `package.json` | `maplibre-gl` を追加。`dotted-map` は削除候補。 |
| `package-lock.json` | 依存更新。 |
| `src/app/page.tsx` | `ManufacturerWorldMap` import を `ManufacturerMap` に差し替え。地図用propsを `lat/lng` 付きで渡す。 |
| `components/ManufacturerMap.tsx` | 新規作成。 |
| `lib/manufacturer-map.ts` | 新規作成。 |
| `src/app/globals.css` | `.world-map-*` の旧CSSを削除。MapLibre CSS import方針に合わせる。 |
| `components/ManufacturerWorldMap.tsx` | 削除。 |
| `components/InteractiveWorldMap.tsx` | 削除。 |

## 変更しないファイル

| ファイル | 理由 |
| --- | --- |
| `data/types.ts` | `headquarters` はMapLibreでも必要なので維持。 |
| `data/manufacturers.ts` | 座標データは維持。必要なら後続で精度調整。 |
| `src/app/layout.tsx` | 地図導入だけでは変更不要。 |
| `src/app/robots/*`, `src/app/manufacturers/*`, `src/app/compare/*` | Home map の導入範囲外。 |
| `docs/planning/home_world_map_implementation_plan_2026-06-01.md` | 履歴として残す。 |

## MapLibre 実装仕様

### 初期表示

- center: 日本・アジア太平洋寄り
  - 候補: `[135, 32]`
- zoom: 全17メーカーが俯瞰できる値
  - desktop: `1.2` から `1.8` 程度
  - mobile: `0.6` から `1.0` 程度
- minZoom: 全体俯瞰を維持できる下限
- maxZoom: 都市周辺まで寄れるが過剰に詳細化しすぎない上限
- maxBounds: 世界全体から大きく外れない範囲

### 操作

- drag pan 有効
- double click zoom 有効
- touch pinch zoom 有効
- scroll wheel は以下のどちらかを採用
  1. `cooperativeGestures: true`
  2. `scrollZoom: false` にして、UIボタンと pinch を主導線にする

推奨は `cooperativeGestures: true`。理由は、Homeページ内のセクションとして埋め込むため、通常スクロールと地図ズームが衝突しやすいから。

### marker / cluster

GeoJSON properties:

```ts
{
  slug: string;
  name: string;
  country: string;
  presenceLabel: string;
}
```

source:
- type: `geojson`
- cluster: `true`
- clusterRadius: 36〜48
- clusterMaxZoom: 3〜4

layers:
- `manufacturer-clusters`: 低ズーム時のcluster circle
- `manufacturer-cluster-count`: cluster内件数
- `manufacturer-points`: 個別メーカー地点
- `manufacturer-point-halo`: 発光/輪郭用
- `manufacturer-labels`: 一定ズーム以上で企業名表示

zoom expression:
- 低ズーム: marker小さめ、label非表示、cluster優先
- 中ズーム: markerを少し大きく、hoverしやすく
- 高ズーム: 個別地点を明確化、label表示

### hover / click

- hover:
  - feature state または hovered id state で対象を強調
  - 地図と一緒に拡大しない固定サイズtooltipを表示
  - tooltipはcursor近傍または地図右下/左下に固定
- click:
  - marker clickで `/manufacturers/[slug]` へ遷移
  - cluster clickで `getClusterExpansionZoom` を使い、clusterが分解されるズームへ移動

### HUD

現行の `17 Manufacturers / 7 Countries` は地図左上のHUDとして維持。

追加候補:
- 現在zoom level
- `Reset`
- `Fit all`

ただし、Homeの装飾が過剰にならないよう、初期実装では `17 / 7` と zoom controls のみに抑える。

## デザイン方針

- Home hero 下のリッチな地図セクションとして維持。
- 説明文は置かない。
- Map自体が主役になるよう、セクション内は地図1枚を大きく見せる。
- 背景は現行の dark panel を維持しつつ、MapLibre style も dark/minimal に寄せる。
- marker accent は既存アクセント `#0d7c66` または現行地図の `#2dd4bf` のどちらかに統一する。
  - 推奨: 地図上は `#2dd4bf`、通常UIは `#0d7c66`。ただし色数は増やしすぎない。

## URL State / SEO 判断

地図の pan / zoom / hover / selected marker はURLに保存しない。

理由:
- Homeの探索用インタラクションであり、共有・SEO対象ではない。
- URL state にすると、Homeの主目的から見てノイズが大きい。
- 共有すべき対象はメーカー詳細ページのURL。

## Operational Safety

- MapLibre 自体はAPI key不要。
- basemap style / tile provider はAPI key不要のものを選ぶ。
- 外部style URLを使う場合は、利用条件・可用性・商用利用の確認を実装前に行う。
- 本番運用を重視するなら、後続で Protomaps PMTiles / OpenMapTiles / 自前ホストを検討する。

参考:
- Protomaps PMTiles for MapLibre: https://docs.protomaps.com/pmtiles/maplibre

## 実装手順

1. 依存追加
   - `npm install maplibre-gl`
   - 必要なら `dotted-map` を削除
   - `@types/maplibre-gl` は不要の可能性が高い（MapLibre本体が型を含むため）。実装時にTypeScriptで確認する。

2. 旧実装撤去
   - `components/ManufacturerWorldMap.tsx` 削除
   - `components/InteractiveWorldMap.tsx` 削除
   - `src/app/globals.css` の `.world-map-*` CSS 削除
   - `package.json` / `package-lock.json` から `dotted-map` を削除

3. 地図用データ変換を追加
   - `lib/manufacturer-map.ts` を作成
   - `ManufacturerMapPoint` 型、GeoJSON変換、source/layer id、初期view定数を定義

4. MapLibreコンポーネント作成
   - `components/ManufacturerMap.tsx` を作成
   - `maplibre-gl/dist/maplibre-gl.css` を import
   - `useEffect` で map 初期化
   - source / layers 追加
   - hover / click / cluster click / cleanup を実装
   - HUD / controls を実装

5. Home差し替え
   - `src/app/page.tsx` の import を差し替え
   - `mapPoints` を `ManufacturerMap` へ渡す
   - セクション説明文は置かない

6. 操作調整
   - desktop / mobile の初期zoomを確認
   - `cooperativeGestures` の文言や挙動がHomeに合うか確認
   - 近接marker（Shanghai / Shenzhen / Austin など）がズームで分離するか確認

## 影響範囲

- Homeページのhero直下セクション
- client bundle に `maplibre-gl` が追加される
- 外部style/tile URLを使う場合、Home表示にネットワーク依存が増える
- `dotted-map` を削除するため、旧ドット地図は完全に消える

## リスク

| リスク | 重大度 | 内容 | 対策 |
| --- | --- | --- | --- |
| MapLibreのバンドル増 | 中 | Homeに地図エンジンを追加するためJSが増える。 | dynamic import / client component局所化。Home以外に広げない。 |
| 外部tile/style依存 | 中 | 無料style URLの可用性・利用条件に依存する。 | 実装前に候補を確認。将来的にPMTiles自前ホストへ移行可能な構成にする。 |
| SSR/hydration | 中 | MapLibreはwindow依存。 | `ManufacturerMap` を明示的に client component 化し、初期化は `useEffect` 内のみ。 |
| CSS import場所 | 低 | Next app routerでCSS import制約に当たる可能性。 | component importで不可なら `src/app/globals.css` または `layout` 側に移す。 |
| mobile操作 | 中 | map内スクロールとページスクロールが競合。 | `cooperativeGestures` / `scrollZoom` 調整、手動確認必須。 |
| markerクリックと地図dragの衝突 | 中 | drag後にclick扱いになる可能性。 | MapLibre layer clickイベントを使い、drag操作とは分離。 |
| 近接markerの見え方 | 中 | Austin / Shanghai / Shenzhen などが密集。 | cluster + zoom expression + label表示閾値で調整。 |

## 検証コマンド

```bash
npm run validate:data
npm run build
git diff --check
```

可能なら実装後に dev server で確認:

```bash
npm run dev -- -H 127.0.0.1
```

## 手動確認項目

### 表示

- Home hero 下に地図のみのリッチなセクションが表示される。
- `17 Manufacturers` / `7 Countries` が地図上HUDとして自然に見える。
- dark map と marker のコントラストが十分ある。
- Norway / Germany / Spain / Japan / China / USA / Canada が地図上で欠けない。

### 操作

- drag pan が自然に動く。
- wheel / trackpad / pinch zoom がページスクロールと不快に衝突しない。
- ズームインすると近接markerが分離する。
- ズームアウトするとcluster表示になり、密集が読める。
- zoom controls / reset が動く。
- cluster click で自然に寄れる。

### hover / click

- marker hover で読みやすいtooltip/cardが表示される。
- tooltip/cardはズームしても文字サイズが不自然に拡大縮小しない。
- marker click で該当メーカー詳細ページへ遷移する。
- cluster click は詳細ページ遷移ではなく、cluster分解ズームになる。

### レスポンシブ / アクセシビリティ

- desktop / tablet / mobile で地図が破綻しない。
- keyboard focus で map controls を操作できる。
- controls に `aria-label` がある。
- pointer操作できない環境でもメーカー詳細への導線が最低限残る。

## 実装しないこと

- 3D地球儀化
- Home map の状態をURLに保存
- メーカー詳細ページや比較ページのURL state変更
- 座標データの大規模再調査
- PMTilesの自前ホスト構築
- 地図以外のHome全面リデザイン

## 最終判断

現行の `dotted-map` 実装を改修し続けるより、MapLibre GL JS に移行する方が目的に合う。

理由は、今回必要なのが「画像の拡大」ではなく「地理座標に基づく探索体験」だから。MapLibreにより、ズーム・パン・クラスタ・marker表示密度・hover/clickの責務を地図エンジン側に寄せられ、Homeのメーカー所在地マップとして自然な操作感に近づけられる。
