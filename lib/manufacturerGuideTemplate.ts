/**
 * メーカー解説（manufacturer-guide）の固定8見出し。
 * 見出し文字列と表示順の正本はここ1箇所のみ。ManufacturerGuideArticleBody（描画）と
 * TOC 生成の両方がこの配列を参照するため、見出しと目次のラベルが構造的に一致する。
 * 各見出しが担う役割は docs/planning/editorial_style_guide_v1.md §6-1 を参照。
 */
export const MANUFACTURER_GUIDE_SECTIONS = [
  { id: 'company-overview', label: '会社概要' },
  { id: 'history', label: '沿革' },
  { id: 'product-lineup', label: '製品ラインナップ' },
  { id: 'strengths-and-cautions', label: '強みと注意点' },
  { id: 'deployment-track-record', label: '導入実績' },
  { id: 'japan-procurement', label: '日本からの購入・相談窓口' },
  { id: 'faq', label: 'よくある質問' },
  { id: 'fit-summary', label: 'どんな検討者に向くか' },
] as const;

export type ManufacturerGuideSectionId = (typeof MANUFACTURER_GUIDE_SECTIONS)[number]['id'];
