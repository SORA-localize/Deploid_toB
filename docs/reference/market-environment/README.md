---
status: reference
updated: 2026-07-20
---

# market-environment — 市場環境ドキュメント

Deploid を取り巻く市場環境（競合・類似メディア・市場動向）の調査結果を蓄積するフォルダ。
サイト構築フェーズから運営フェーズへ移る中で、「何を参考にし、どう差別化するか」の判断材料をここに集める。

## 構造

```
docs/reference/market-environment/
├── README.md                          ← このファイル
├── competitors/                       ← 競合・類似メディアの調査
│   ├── _template-competitor-profile.md   ← 新規調査用テンプレート
│   └── <company-slug>/                ← 1社1フォルダ（例: korthos/）
│       ├── <slug>-profile-YYYY-MM-DD.md  ← 調査レポート本体（日付付き）
│       └── （スクリーンショット等の補助資料があればここに）
└── （将来: market-trends/, regulation/ など市場環境系のテーマを並列に追加）
```

## 運用ルール

- **1社1フォルダ**。再調査したら同フォルダに新しい日付のプロファイルを追加する（上書きしない — 競合の変化自体が情報）。
- 新規調査は `competitors/_template-competitor-profile.md` をコピーして始める。
- レポートには必ず「Deploidへの適用（真似する / しない）」セクションを入れる。事実の羅列で終わらせない。
- 出典URLと調査日を残す。競合サイトは変わるため、記述はすべて調査時点のスナップショットとして扱う。

## 調査済み一覧

| 会社/メディア | 種別 | 最終調査日 | 一言 |
|---|---|---|---|
| [Korthos](competitors/korthos/korthos-profile-2026-07-16.md) | 類似メディア（英語圏・全ロボティクス） | 2026-07-16 | market intelligence。読者が違う（投資家側）。運営手法と信頼性設計が参考になる |
