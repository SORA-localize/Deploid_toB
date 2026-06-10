import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata = {
  title: '会社概要',
  description:
    'Deploidは、ヒューマノイドロボットの導入を検討する企業のために、分かりやすく、正確な情報を提供いたします。製品の基本情報から、調達・保守・安全性・実務への適用など、導入判断に必要な情報を体系的に提供しております。',
};

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

const roadmap = [
  { step: '01', title: '情報の体系化', body: 'ロボット・メーカー・用途・ガイド・記事を掲載。' },
  { step: '02', title: '用途から探す', body: '業種・タスクなど実務起点で成立条件と候補を探せるように。' },
  { step: '03', title: '一次取材・ハンズオン', body: '代理店デモや実機検証など、一次情報を記事として提供。' },
  { step: '04', title: '相談・選定支援', body: 'PoC設計や選定支援など、実務側の導線へ拡張。※2026年6月現在は未対応' },
];

export default function AboutPage() {
  return (
    <div className="site-container py-8">
      <Breadcrumbs items={[{ label: '会社概要' }]} />

      <section className="py-8 border-b border-border">
        <p className="text-xs text-muted-foreground mb-4">Deploidについて</p>
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-4 max-w-3xl leading-tight">
          国内ヒューマノイド導入の支援ポータルサイト
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
          Deploidは、ヒューマノイドロボットの導入を検討する企業のために、分かりやすく、正確な情報を提供いたします。製品の基本情報から、調達・保守・安全性・実務への適用など、導入判断に必要な情報を体系的に提供しております。
        </p>
      </section>

      <section className="py-8 border-b border-border">
        <dl className="divide-y divide-border">
          {values.map((v) => (
            <div key={v.label} className="grid grid-cols-1 md:grid-cols-[8rem_1fr] gap-2 md:gap-8 py-5 first:pt-0 last:pb-0">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:pt-0.5">
                {v.label}
              </dt>
              <dd>
                <p className="font-semibold text-foreground mb-1">{v.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.body}</p>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="py-8 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground mb-6">ロードマップ</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {roadmap.map((r) => (
            <div key={r.step} className="flex gap-4 border border-border bg-card p-5">
              <div className="flex-shrink-0 w-12 h-12 border-2 border-foreground flex items-center justify-center">
                <span className="text-xs font-semibold text-foreground">{r.step}</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{r.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-8 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground mb-6">運営者情報</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-3xl leading-relaxed">
          当サイトは個人（学生）による運営です。運営者の氏名・直通メールアドレスは公開しておらず、お問い合わせはサイトの問い合わせフォームをご利用ください。
        </p>
        <dl className="divide-y divide-border">
          {[
            { label: '運営', value: 'Deploid（個人運営・学生）' },
            { label: '連絡先', value: 'お問い合わせフォーム（https://deploid.net/contact）' },
            { label: '公開開始', value: '2026年6月' },
          ].map(({ label, value }) => (
            <div key={label} className="grid grid-cols-1 md:grid-cols-[8rem_1fr] gap-2 md:gap-8 py-4 first:pt-0 last:pb-0">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:pt-0.5">{label}</dt>
              <dd className="text-sm text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="py-8 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground mb-6">出典・信頼度ポリシー</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-3xl leading-relaxed">
          各ロボット・メーカーのデータには、情報源の種別と確認日を記録しています。AIによる推測値をそのまま事実として掲載しません。
        </p>
        <dl className="divide-y divide-border">
          {[
            { label: 'official', title: '公式発表', body: 'メーカー公式サイト・プレスリリース・製品仕様書など一次資料に基づく情報。' },
            { label: 'press', title: '報道・発表', body: '信頼性の高いメディア報道や展示会発表に基づく情報。公式確認は取れていないものを含む。' },
            { label: 'estimated', title: '推計', body: '公開データからの計算・推計値。根拠を明示した上で掲載。' },
            { label: '要確認', title: '未確認', body: '出典が取れておらず、正確性を保証できない項目。確認でき次第更新します。' },
          ].map(({ label, title, body }) => (
            <div key={label} className="grid grid-cols-1 md:grid-cols-[8rem_1fr] gap-2 md:gap-8 py-4 first:pt-0 last:pb-0">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:pt-0.5">{label}</dt>
              <dd>
                <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="py-8 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground mb-6">掲載・画像方針</h2>
        <dl className="divide-y divide-border">
          {[
            {
              label: '掲載基準',
              body: '公開情報をもとに導入判断に有用と判断したロボット・メーカーを掲載しています。',
            },
            {
              label: '中立性',
              body: '事業者がPoC判断をするのに必要な変数を整理することを目的としています。メーカーからの情報提供や掲載依頼は歓迎しますが、掲載内容は編集基準に基づき客観性を担保します。必要に応じて出典や確認日を明示します。',
            },
            {
              label: '画像・ロゴ',
              body: '掲載している製品画像・ロゴの著作権・商標権は各メーカーに帰属します。情報提供・報道目的の参照用途として使用しており、出典を明記しています。修正・削除依頼はお問い合わせよりご連絡ください。',
            },
          ].map(({ label, body }) => (
            <div key={label} className="grid grid-cols-1 md:grid-cols-[8rem_1fr] gap-2 md:gap-8 py-4 first:pt-0 last:pb-0">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:pt-0.5">{label}</dt>
              <dd className="text-sm text-muted-foreground leading-relaxed">{body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="py-8">
        <h2 className="text-xl font-semibold text-foreground mb-3">お問い合わせ</h2>
        <p className="text-muted-foreground max-w-3xl leading-relaxed">
          掲載相談、情報提供・修正、取材相談、導入相談を随時受け付けております。お問い合わせは
          <Link
            href="/contact"
            className="text-tone-brand-text hover:text-tone-brand-solid underline underline-offset-2 transition-colors mx-0.5"
          >
            こちら
          </Link>
          から。
        </p>
      </section>
    </div>
  );
}
