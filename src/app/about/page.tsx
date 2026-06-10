import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata = {
  title: '会社概要',
  description:
    'Deploidは、日本のtoB事業者がヒューマノイド導入を判断するための入口メディア。買い手目線の体系化と出典主義で、導入判断に必要な変数を整理します。',
};

const values = [
  {
    label: 'ミッション',
    title: '導入判断の最初の入口をつくる',
    body: 'ロボット名やニュースではなく、調達・保守・安全・用途適合・PoC設計まで、買い手が判断に使う変数で整理します。',
  },
  {
    label: '課題',
    title: '既存情報は買い手目線で体系化されていない',
    body: 'メーカー発表やスペック表は揃っても、「うちに要るか・国内で導入できるか・何から始めるか」に答える構造が不足しています。',
  },
  {
    label: '方針',
    title: '出典と確認日を残す',
    body: '公式情報・報道・推定を混ぜず、信頼度（reliability）と確認日をデータとして残します。AIの推測値を事実として扱いません。',
  },
];

const roadmap = [
  { step: '01', title: '公開情報の構造化', body: 'ロボット・メーカー・用途・ガイド・記事を導入判断軸で整理。' },
  { step: '02', title: '用途からの逆引き', body: '業種ではなく作業・タスク起点で成立条件と候補を探せるように。' },
  { step: '03', title: '一次取材・ハンズオン', body: '代理店デモや実機検証など、後発の一次情報で深さを出す。' },
  { step: '04', title: '相談・選定支援', body: 'PoC設計や選定支援など、実務側の導線へ拡張。' },
];

export default function AboutPage() {
  return (
    <div className="site-container py-8">
      <Breadcrumbs items={[{ label: '会社概要' }]} />

      <section className="py-8 border-b border-border">
        <p className="text-xs text-muted-foreground mb-4">Deploidについて</p>
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-4 max-w-3xl leading-tight">
          ヒューマノイド導入の、最初の判断材料をつくる。
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
          Deploidは、日本のtoB事業者がヒューマノイドロボットを検討するときに、ロボット名やニュースだけでなく、調達・保守・安全・用途適合・PoC設計まで見られる入口を目指す情報メディアです。
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
        <dl className="divide-y divide-border">
          {[
            { label: '運営者', value: '桑島壮平' },
            { label: '連絡先', value: 'sohei@deploid.net' },
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
              body: '公開情報をもとに導入判断に有用と判断したロボット・メーカーを掲載しています。特定メーカーとの商業的関係に基づく優遇掲載は行いません。',
            },
            {
              label: '中立性',
              body: '編集方針は「買い手がPoC判断をするのに必要な変数を整理すること」に置きます。メーカーからの掲載依頼は情報提供として扱い、内容の恣意的な変更は行いません。',
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
        <h2 className="text-xl font-semibold text-foreground mb-3">運営とお問い合わせ</h2>
        <p className="text-muted-foreground mb-6 max-w-3xl leading-relaxed">
          掲載相談、情報提供・修正、取材相談、導入相談を受け付けています。
          特定メーカーの販売促進を目的とせず、導入判断に必要な客観的な情報の整理を優先します。
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
        >
          お問い合わせ
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
