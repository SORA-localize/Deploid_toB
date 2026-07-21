# 別AI向け 調査プロンプト：導入事例データ（data/deployments.ts）

このファイルの「プロンプト本文」をそのまま別AIに渡してください。
目的は、Homeワールドマップで「メーカー本社 → 導入先」の弧を描くための **実在の導入事例データ** を、出典付きで `data/deployments.ts` に追加すること。

---

## プロンプト本文（ここから下をコピーして別AIに渡す）

````text
あなたはヒューマノイドロボットの導入事例を調査するリサーチャーです。
実在する「メーカー → 顧客拠点」への導入事例を調べ、指定のTypeScript配列データとして出力してください。
**実装やリファクタは不要。出力は data/deployments.ts に入れる配列要素だけ。**

# 出力先ファイル
/data/deployments.ts （既存。現在は空配列 `export const deployments: DeploymentSite[] = [];`）
ここに DeploymentSite 要素を埋める。型・lib・他ファイルは変更しない。

# 型（すでに data/types.ts に定義済み。これに厳密に従う）
type DeploymentStatus = 'announced' | 'pilot' | 'production' | 'ended' | 'unknown';

interface Source {
  title: string;
  url: string;
  publisher?: string;
  publishedAt?: string;   // 'YYYY-MM-DD'
  checkedAt: string;      // 'YYYY-MM-DD' 実際に確認した日
  reliability: 'verified' | 'official' | 'reported' | 'estimated';
  note?: string;
}

interface DeploymentSite {
  // --- BaseRecord 由来（必須）---
  slug: string;                 // 一意。'<manufacturer>-<customer>-<site>' のkebab-case 例: 'figure-bmw-spartanburg'
  summary: string;              // 一文（日本語）。何を・どこに・どの段階で導入したか
  publishStatus: 'published';   // 公開するものは 'published'
  updatedAt: string;            // 'YYYY-MM-DD'
  reliability: 'verified' | 'official' | 'reported' | 'estimated'; // 事例全体の確度
  sources: Source[];            // 1件以上必須。一次出典(メーカー/顧客の公式)を最優先
  // --- 固有フィールド ---
  manufacturerId: string;       // 下の「許可リスト」のいずれか（arc 始点）
  robotId?: string;             // 下の「許可リスト」のいずれか。判明時のみ
  customer: string;             // 導入先の企業/組織名 例: 'BMW'
  siteName?: string;            // 拠点名 例: 'Spartanburg Plant'
  country: string;              // 導入先の国 例: 'USA'（英語表記、manufacturers.ts に合わせる）
  location: { lat: number; lng: number }; // 導入拠点のおおよその座標（arc 終点）
  status: DeploymentStatus;
  startedAt?: string;           // 'YYYY' か 'YYYY-MM'
}

# manufacturerId 許可リスト（これ以外は使わない）
unitree, figure-ai, apptronik, agility-robotics, onex, boston-dynamics, tesla,
sanctuary-ai, agibot, ubtech, fourier-intelligence, booster-robotics,
kawasaki-heavy-industries, neura-robotics, kepler-robotics, leju-robotics, pal-robotics

# robotId 許可リスト（判明時のみ。これ以外は使わない。不明なら robotId を省く）
unitree-g1, unitree-h1, unitree-h2, unitree-r1, figure-02, figure-03,
apptronik-apollo, agility-digit, onex-neo, boston-dynamics-atlas, tesla-optimus,
sanctuary-phoenix, agibot-a2, agibot-a2-max, ubtech-walker-s1, ubtech-walker-s2,
fourier-gr2, fourier-gr3, booster-t1, booster-k1, kawasaki-kaleido, neura-4ne-1,
kepler-k2, leju-kuavo, pal-talos, pal-kangaroo

# 厳守ルール
1. **実在し、公開ソースで確認できる事例のみ**。憶測・噂・未確認は載せない。曖昧なら除外。
2. **出典必須**。sources は最低1件、できれば一次出典（メーカー公式/顧客公式/規制当局）。
   報道二次情報しかない場合は reliability を 'reported' にする。url は実在する具体ページ。
3. **座標は拠点の実所在地**を公開情報から。番地は不要、市/工場レベルの概略でよい。
   座標が特定できない事例は load しない（弧の終点が作れないため）。
4. **値を捏造しない**。checkedAt は実際に確認した日付。分からない項目は省略可能なものだけ省く
   （省略不可の必須項目が埋まらない事例は丸ごと除外）。
5. slug は一意・kebab-case。country は英語表記で manufacturers.ts と統一（'USA','China','Japan' 等）。
6. status の目安：本番運用='production'、実証/PoC='pilot'、発表のみで稼働未確認='announced'、
   終了='ended'、段階不明='unknown'。
7. 1メーカーに複数事例があってよい。確実なものを優先し、件数より確度。
8. 日本国内（japanPresence 関連）の導入があれば優先的に拾う（このサイトの読者に重要）。

# やってほしいこと
- 上記メーカー各社について、公開されている導入/実証事例を調べる。
- 確認できたものを DeploymentSite 配列要素に変換する。
- 各要素について、なぜその status / reliability にしたかを sources で裏付ける。

# 出力フォーマット
data/deployments.ts の配列に貼れる形で、要素を列挙して出力する（前後の import 等は不要）。
各要素のあとに「// 根拠: <一言>」のコメントは付けてよい。
最後に、調べたが**確証が取れず除外した候補**を箇条書きで報告する（後追い調査のため）。

# サンプル（この粒度・形式で出力する。値は要検証の見本であり、必ず自分で裏取りすること）
{
  slug: 'figure-bmw-spartanburg',
  manufacturerId: 'figure-ai',
  robotId: 'figure-02',
  customer: 'BMW',
  siteName: 'Spartanburg Plant',
  country: 'USA',
  location: { lat: 34.93, lng: -82.0 },
  status: 'pilot',
  startedAt: '2024-08',
  summary: 'BMW スパルタンバーグ工場での Figure 02 の実証導入。車体製造ラインでの作業検証。',
  publishStatus: 'published',
  updatedAt: '2026-06-01',
  reliability: 'reported',
  sources: [
    {
      title: 'Figure announces BMW deployment',
      url: 'https://www.figure.ai/news/...',   // ← 実在ページに置換
      publisher: 'Figure AI',
      publishedAt: '2024-08-XX',               // ← 実日付に置換
      checkedAt: '2026-06-01',                 // ← 確認日に置換
      reliability: 'official',
    },
  ],
}, // 根拠: メーカー公式の発表ページ
````

---

## 受け取り後のこちら側の作業（参考・実装側メモ）
- 返ってきた配列を `data/deployments.ts` に貼る。
- `getDeploymentsForManufacturer()`（lib/data.ts 追加済み）で Home に渡し、Phase B で
  メーカーHQ→`location` への弧アニメ（クライアント・一度描いて静止 or hover連動）を実装する。
- 参照整合（manufacturerId / robotId が実在するか）を確認してからマージ。
