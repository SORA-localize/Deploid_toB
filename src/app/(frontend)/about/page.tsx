import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { DefinitionList } from '@/components/DefinitionList';
import { createPageMetadata } from '@/lib/metadata';
import { siteMeta } from '@/lib/site';

export const metadata = createPageMetadata({
  title: '会社概要',
  description:
    'Deploidは、ヒューマノイドロボットの導入を検討する企業のために、分かりやすく、正確な情報を提供いたします。製品の基本情報から、調達・保守・安全性・実務への適用など、導入判断に必要な情報を体系的に提供しております。',
  path: '/about',
});

const values = [
  {
    label: 'ミッション',
    title: '誰でも導入判断ができるように',
    body: '欲しい情報を見つけやすく、比較しやすい形で整理し、導入の意思決定を誰もが出来るようにします。',
  },
  {
    label: '課題',
    title: '実務で使える情報が散在している',
    body: '1. 情報がメーカー発表・報道・仕様書に分散、2. 比較に必要な観点が統一されていない、3. 実運用や保守に関する現場視点が不足している、という点の整理をしています。',
  },
  {
    label: '方針',
    title: '出典・透明性・実務性を優先する',
    body: '出典と確認日を明示し、事実（公式情報）と推測（推計）を区別し、実務で使える比較軸と導線の提供を優先します。',
  },
];

export default function AboutPage() {
  return (
    <div className="site-container py-8">
      <Breadcrumbs items={[{ label: '会社概要' }]} />

      <div className="content-col">
        <section className="py-8 border-b border-border">
          <p className="text-xs text-muted-foreground mb-4">Deploidについて</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-4 leading-tight">
            国内ヒューマノイド導入の支援ポータルサイト
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Deploidは、ヒューマノイドロボットの導入を検討する企業のために、分かりやすく、正確な情報を提供いたします。製品の基本情報から、調達・保守・安全性・実務への適用など、導入判断に必要な情報を体系的に提供しております。
          </p>
        </section>

        <section className="py-8 border-b border-border">
          <DefinitionList
            py="5"
            rows={values.map((v) => ({
              label: v.label,
              value: (
                <>
                  <p className="font-semibold text-foreground mb-1">{v.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.body}</p>
                </>
              ),
              valueClassName: '',
            }))}
          />
        </section>

        <section className="py-8 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground mb-6">運営者情報</h2>
          <DefinitionList
            rows={[
              { label: '運営', value: 'Deploid（個人運営）', valueClassName: 'text-sm text-foreground' },
              {
                label: '連絡先',
                value: (
                  <Link
                    href="/contact"
                    className="text-signal hover:text-signal/80 underline underline-offset-2 transition-colors"
                  >
                    お問い合わせフォーム
                  </Link>
                ),
                valueClassName: 'text-sm text-foreground',
              },
              { label: '公開開始', value: siteMeta.launchedAt, valueClassName: 'text-sm text-foreground' },
            ]}
          />
        </section>

        <section className="py-8 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground mb-6">出典・信頼度ポリシー</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            各ロボット・メーカーのデータには、情報源の種別と確認日を記録しています。AIによる推測値をそのまま事実として掲載しません。
          </p>
          <DefinitionList
            rows={[
              { label: 'official', title: '公式発表', body: 'メーカー公式サイト・プレスリリース・製品仕様書など一次資料に基づく情報。' },
              { label: 'press', title: '報道・発表', body: '信頼性の高いメディア報道や展示会発表に基づく情報。公式確認は取れていないものを含む。' },
              { label: 'estimated', title: '推計', body: '公開データからの計算・推計値。根拠を明示した上で掲載。' },
              { label: '要確認', title: '未確認', body: '出典が取れておらず、正確性を保証できない項目。確認でき次第更新します。' },
            ].map(({ label, title, body }) => ({
              label,
              value: (
                <>
                  <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </>
              ),
              valueClassName: '',
            }))}
          />
        </section>

        <section className="py-8 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground mb-6">掲載・画像方針</h2>
          <DefinitionList
            ddTone="muted"
            rows={[
              {
                label: '掲載基準',
                value: '公開情報をもとに導入判断に有用と判断したロボット・メーカーを掲載しています。',
              },
              {
                label: '中立性',
                value: '事業者がPoC判断をするのに必要な変数を整理することを目的としています。メーカーからの情報提供や掲載依頼は歓迎しますが、掲載内容は編集基準に基づき客観性を担保します。必要に応じて出典や確認日を明示します。',
              },
              {
                label: '画像・ロゴ',
                value: '掲載している製品画像・ロゴの著作権・商標権は各メーカーに帰属します。情報提供・報道目的の参照用途として使用しており、出典を明記しています。修正・削除依頼はお問い合わせよりご連絡ください。',
              },
            ]}
          />
        </section>

        <section className="py-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">お問い合わせ</h2>
          <p className="text-muted-foreground leading-relaxed">
            掲載相談、情報提供・修正、取材相談、導入相談を随時受け付けております。お問い合わせは
            <Link
              href="/contact"
              className="text-signal hover:text-signal/80 underline underline-offset-2 transition-colors mx-0.5"
            >
              こちら
            </Link>
            から。
          </p>
        </section>
      </div>
    </div>
  );
}
