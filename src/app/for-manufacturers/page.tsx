import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata = {
  title: 'メーカー・代理店の方へ',
  description:
    'Deploidへの掲載情報の確認・提供・修正依頼について。掲載は無料で、修正・削除依頼にも対応します。公開情報をもとに作成した掲載ページの確認をお願いしています。',
};

export default function ForManufacturersPage() {
  return (
    <div className="site-container py-8">
      <Breadcrumbs items={[{ label: 'メーカー・代理店の方へ' }]} />

      <section className="py-8 border-b border-border">
        <p className="text-xs text-muted-foreground mb-4">メーカー・代理店の方へ</p>
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-4 max-w-3xl leading-tight">
          掲載情報の確認・提供について
        </h1>
        <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
          Deploidは日本のtoB事業者向けに、ヒューマノイドロボットの導入判断に必要な情報を整理する中立ポータルです。掲載は無料で、修正・削除依頼にも随時対応します。公開情報をもとに作成した各社の掲載ページについて、内容の確認・補足をお願いしています。
        </p>
      </section>

      <section className="py-8 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground mb-6">サイト概要</h2>
        <dl className="divide-y divide-border">
          {[
            { label: '掲載数', body: 'ロボット 51件・メーカー 23社（2026年6月現在）' },
            { label: '公開開始', body: '2026年6月' },
            { label: '運営', body: '個人運営（慶應義塾大学）。特定メーカーとの資本・業務提携なし。販売促進目的ではない。' },
            { label: '目的', body: '日本企業がヒューマノイドの導入可否を判断するための情報基盤を整備すること。スペック表ではなく、調達・コスト・安全・実運用の観点で情報を整理している。' },
            { label: '情報方針', body: '公式発表・報道・推計・未確認を区別して表示。AIによる推測値をそのまま事実として掲載しない。出典と確認日を明示。' },
          ].map(({ label, body }) => (
            <div key={label} className="grid grid-cols-1 md:grid-cols-[8rem_1fr] gap-2 md:gap-8 py-4 first:pt-0 last:pb-0">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:pt-0.5">{label}</dt>
              <dd className="text-sm text-foreground leading-relaxed">{body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="py-8 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground mb-6">掲載できる情報</h2>
        <dl className="divide-y divide-border">
          {[
            { label: '製品画像・ロゴ', body: '許諾条件に従って掲載。公式press kitがあればURLをお知らせください。現状は許諾待ちとして表示しているページがあります。' },
            { label: 'スペック・仕様', body: '公式サイト・プレスリリース・展示会発表などの公開情報。未確認項目は「要確認」として明示。' },
            { label: '国内販売状況', body: '日本市場での販売可否・時期・販路。' },
            { label: '代理店・問い合わせ先', body: '日本国内での相談・導入問い合わせ先として掲載可能。問い合わせ増加の可能性があります。' },
            { label: '導入事例', body: '公開済みの事例・PoC実績。守秘義務のない範囲で。' },
          ].map(({ label, body }) => (
            <div key={label} className="grid grid-cols-1 md:grid-cols-[8rem_1fr] gap-2 md:gap-8 py-4 first:pt-0 last:pb-0">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:pt-0.5">{label}</dt>
              <dd className="text-sm text-muted-foreground leading-relaxed">{body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="py-8 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground mb-6">掲載できない情報</h2>
        <dl className="divide-y divide-border">
          {[
            { label: '未公開情報', body: 'NDA対象・社外秘・未発表の仕様・価格。' },
            { label: '誇張表現', body: '「世界最高」「唯一」など客観的根拠のない宣伝表現。' },
            { label: '未確認スペック', body: '出典の取れない数値。AI生成値をそのまま転記したもの。' },
          ].map(({ label, body }) => (
            <div key={label} className="grid grid-cols-1 md:grid-cols-[8rem_1fr] gap-2 md:gap-8 py-4 first:pt-0 last:pb-0">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:pt-0.5">{label}</dt>
              <dd className="text-sm text-muted-foreground leading-relaxed">{body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="py-8 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground mb-3">確認をお願いする3点</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-3xl leading-relaxed">
          誤情報を防ぐため、掲載内容について以下の3点だけご確認いただけると助かります。初回のご連絡はこの3点のみで結構です。
        </p>
        <ol className="space-y-4 max-w-2xl">
          {[
            '掲載可能な公式画像、またはpress kit のURL',
            '日本市場向けに公開してよい主要スペック・仕様',
            '日本企業からの導入・問い合わせ窓口（メール・フォームURL など）',
          ].map((item, i) => (
            <li key={i} className="flex gap-4">
              <span className="font-mono text-xs text-muted-foreground mt-0.5 shrink-0">{i + 1}.</span>
              <span className="text-sm text-foreground leading-relaxed">{item}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="py-8">
        <h2 className="text-lg font-semibold text-foreground mb-3">お問い合わせ</h2>
        <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
          掲載内容の確認・補足、修正・削除依頼、press kit の提供、掲載相談は
          <Link
            href="/contact"
            className="text-signal hover:text-signal/80 underline underline-offset-2 transition-colors mx-0.5"
          >
            お問い合わせフォーム
          </Link>
          からどうぞ。件名に「掲載確認」または社名を入れていただけるとスムーズです。
        </p>
      </section>
    </div>
  );
}
