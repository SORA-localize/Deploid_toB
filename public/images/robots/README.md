# ロボット写真の置き場所

ヒューマノイド機種の写真をここに置きます。

## 命名規則

ファイル名は **ロボットの `slug` と一致** させてください。

- `unitree-g1.jpg`
- `figure-02.jpg`
- `unitree-h1.jpg`
- `apptronik-apollo.jpg`
- `agility-digit.jpg`
- `onex-neo.jpg`

拡張子は `.jpg` `.png` `.webp` どれでも可（後述の `src` で一致させる）。

## 推奨スペック

- アスペクト比 **4:3**（RobotCard の画像枠が `aspect-[4/3]`）
- 解像度の目安 **1200×900** 以上
- ファイルサイズ **300KB 以下**を目安に圧縮（[TinyPNG](https://tinypng.com/) 等）

## サイトに反映する手順

`data/robots.ts` の該当ロボットエントリに `heroImage` を追加します。

```ts
heroImage: {
  src: '/images/robots/unitree-h1.jpg',
  alt: 'Unitree H1 の正面写真',
  credit: 'Unitree Robotics',         // 任意：撮影元 / 出典の表記
  sourceUrl: 'https://www.unitree.com/h1/', // 任意：出典URL
},
```

設定すると、ロボット一覧の RobotCard と詳細ページ上部の画像枠に表示されます。`heroImage` が未設定のロボットは引き続き `[ ROBOT IMAGE ]` のプレースホルダになります。

## 著作権の注意

- メーカー公式サイトの press / media kit に掲載された写真は、再配布条件を確認してから使ってください
- Wikimedia Commons / Flickr 等は **ライセンス条件（CC-BY 等）の表記義務** を必ず満たす
- 不明な場合は `[ ROBOT IMAGE ]` プレースホルダのままで運用するほうが安全
- 自分で撮影した写真が一番安全
