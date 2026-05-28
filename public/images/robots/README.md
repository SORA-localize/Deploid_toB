# ロボット写真の置き場所

ヒューマノイド機種の写真をここに置きます。詳細ページには **6スロットのカルーセル** があり、写真が無いスロットは役割名のラベル（`[ MAIN IMAGE ]` 等）が表示されます。

## 6つのスロット

| キー | 役割 | placeholder ラベル | 撮影/収集の目安 |
|---|---|---|---|
| `hero` | 全身正面 | `MAIN IMAGE` | 機体の第一印象。一覧カードにもこれが出る |
| `side` | 側面 | `SIDE VIEW` | 体格・関節配置の評価 |
| `inOperation` | 稼働中 | `IN OPERATION` | 実環境で動いている証拠（CGではなく） |
| `scale` | 人/物との比較 | `SCALE REFERENCE` | カタログ数値よりも実寸感が伝わる |
| `endEffector` | ハンド | `END EFFECTOR` | 把持・操作能力の判断 |
| `mobility` | 脚・足・車輪 | `MOBILITY DETAIL` | 床面/段差/環境制約の判断 |

## 命名規則

`<slug>-<role>.<ext>` の形にします。

```
unitree-g1-hero.jpg
unitree-g1-side.jpg
unitree-g1-inOperation.jpg
unitree-g1-scale.jpg
unitree-g1-endEffector.jpg
unitree-g1-mobility.jpg
```

拡張子は `.jpg` `.png` `.webp` どれでもOK（後述の `src` で一致させる）。役割キーは TypeScript で使う英字（キャメルケース）と一致させます。

## 推奨スペック

- カルーセル本体：アスペクト比 **16:9**（推奨 1600×900 以上）
- 一覧カードの hero 画像表示：アスペクト比 **4:3** に自動クロップ（`hero` は両用なので **中央被写体**で撮ると安全）
- ファイルサイズ目安：1枚 **400KB 以下**（[Squoosh](https://squoosh.app/) や [TinyPNG](https://tinypng.com/) で圧縮）

## サイトに反映する手順

`data/robots.ts` の該当ロボットに `images` フィールドを追加します。すべてのスロットを揃える必要はなく、用意できたものから入れていけばOK（未投入スロットは placeholder のまま）。

```ts
images: {
  hero: {
    src: '/images/robots/unitree-g1-hero.jpg',
    alt: 'Unitree G1 の全身正面',
    credit: 'Unitree Robotics',          // 任意
    sourceUrl: 'https://www.unitree.com/g1/', // 任意
  },
  side: {
    src: '/images/robots/unitree-g1-side.jpg',
    alt: 'Unitree G1 の側面',
  },
  // 他スロットは揃ったら順次追加
},
```

`heroImage`（旧フィールド）も後方互換で動作します：`images.hero` が無ければ `heroImage` を hero に昇格して使います。

## 著作権の注意

- メーカー公式の press / media kit に掲載された写真は、再配布条件を確認してから使う
- Wikimedia Commons / Flickr は **ライセンス条件（CC-BY 等）の表記義務** を必ず満たす（`credit` フィールドに表記する）
- 不明な場合は **placeholder のまま** にしておくほうが安全
- 自分（運営者）が撮影した写真が一番安全
