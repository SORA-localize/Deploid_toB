# ロボット写真の置き場所

ヒューマノイド機種の写真をここに置きます。詳細ページは、`Robot.images` に登録され、権利gateを通った**実画像だけ**を表示します。未投入roleはslide化しません。

## 7つの画像role

| キー | 役割 | 表示ラベル | 撮影/収集の目安 |
|---|---|---|---|
| `hero` | 全身正面 | `MAIN IMAGE` | 機体の第一印象。一覧カードにもこれが出る |
| `transparent` | 背景透過 | `TRANSPARENT` | カード系で使う背景透過の全身画像。`hero` と同ポーズが望ましい |
| `side` | 側面 | `SIDE VIEW` | 体格・関節配置の評価 |
| `inOperation` | 稼働中 | `IN OPERATION` | 実環境で動いている証拠（CGではなく） |
| `scale` | 人/物との比較 | `SCALE REFERENCE` | カタログ数値よりも実寸感が伝わる |
| `endEffector` | ハンド | `END EFFECTOR` | 把持・操作能力の判断 |
| `mobility` | 脚・足・車輪 | `MOBILITY DETAIL` | 床面/段差/環境制約の判断 |

## 命名規則

`<robot-id>-<role>.<ext>` の形にします。

```
unitree-g1-hero.jpg
unitree-g1-transparent.png
unitree-g1-side.jpg
unitree-g1-inOperation.jpg
unitree-g1-scale.jpg
unitree-g1-endEffector.jpg
unitree-g1-mobility.jpg
```

拡張子は `.jpg` `.png` `.webp` どれでもOK（後述の `src` で一致させる）。役割キーは TypeScript で使う英字（キャメルケース）と一致させます。

## 推奨スペック

- カルーセル本体：アスペクト比 **16:9**（推奨 1600×900px）
- 一覧カード：表示可能な `transparent ?? hero` の順に使い、PC枠は **7:6**、画像は `object-contain` で全体を収める（余白は同画像の拡大ぼかし背景で埋める）
- `hero` は詳細・OGP・JSON-LDにも使うため、中央被写体で余白を持たせると安全
- ファイルサイズ上限：**300KB 以下**（超過するとホーム/一覧のローディングが遅くなる）
- 推奨フォーマット：**WebP**（同画質でJPGより30〜50%軽い）
- 最大解像度：**1920px 幅**（それ以上は不要）

### 圧縮ツール

| ツール | 用途 |
|---|---|
| [Squoosh](https://squoosh.app/) | ブラウザで WebP 変換・品質調整（推奨）|
| [TinyPNG](https://tinypng.com/) | PNG/JPG の手軽な圧縮 |
| `sips -Z 1920 <file>` | macOS 標準コマンド。リサイズのみ（フォーマット変換不可）|

### なぜ 300KB 以下か

Next.js の `<Image>` コンポーネントが自動で WebP/AVIF に変換・リサイズするが、**元ファイルが大きいほどサーバー処理が遅くなる**。元から小さいファイルを置くのが最速。

## サイトに反映する手順

`data/robots.ts` の該当ロボットに `images` フィールドを追加します。すべてのroleを揃える必要はなく、用意できたものから入れていけば構いません。表示可能画像が0枚なら単一placeholder、1枚なら静止表示、2枚以上なら実画像だけのカルーセルになります。
`ImageAsset.rights` は型上必須です。`reference-attributed` や `permission-requested` の画像は、validator が `credit` / `sourceUrl` / `rights.rightsHolder` も要求します。
背景除去やトリミングなど、配布時点から姿を変える加工をした画像は、公開用ではライセンスや許諾で改変可否を確認してください。未確認の背景透過画像は `prototype-only` としてローカル確認に限定します。

```ts
images: {
  hero: {
    src: '/images/robots/unitree-g1-hero.jpg',
    alt: 'Unitree G1 の全身正面',
    credit: 'Unitree Robotics',
    sourceUrl: 'https://www.unitree.com/g1/',
    rights: {
      status: 'reference-attributed',
      sourceType: 'manufacturer-official',
      rightsHolder: 'Unitree Robotics',
      checkedAt: '2026-07-09',
    },
  },
  transparent: {
    src: '/images/_local-prototype/robots/unitree-g1-transparent.png',
    alt: 'Unitree G1 の背景透過全身画像',
    credit: 'Unitree Robotics',
    sourceUrl: 'https://www.unitree.com/g1/',
    rights: {
      status: 'prototype-only',
      sourceType: 'manufacturer-official',
      rightsHolder: 'Unitree Robotics',
      checkedAt: '2026-07-09',
      permissionNote: 'ローカル確認専用。背景除去加工済みで、改変許諾は未確認。公開データには使わない。',
    },
  },
  side: {
    src: '/images/robots/unitree-g1-side.jpg',
    alt: 'Unitree G1 の側面',
    credit: 'Unitree Robotics',
    sourceUrl: 'https://www.unitree.com/g1/',
    rights: {
      status: 'reference-attributed',
      sourceType: 'manufacturer-official',
      rightsHolder: 'Unitree Robotics',
      checkedAt: '2026-07-09',
    },
  },
  // 他roleは揃ったら順次追加
},
```

Robot画像の正本は `images` です。`BaseRecord.heroImage` は記事・メーカー向けに残りますが、Robotへ新規登録しません。

## 著作権の注意

- メーカー公式の press / media kit に掲載された写真は、再配布条件を確認してから使う
- Wikimedia Commons / Flickr は **ライセンス条件（CC-BY 等）の表記義務** を必ず満たす（`credit` フィールドに表記する）
- 不明な場合は **placeholder のまま** にしておくほうが安全
- 自分（運営者）が撮影した写真が一番安全
