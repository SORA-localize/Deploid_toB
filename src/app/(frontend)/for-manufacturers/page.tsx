import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { DefinitionList } from '@/components/DefinitionList';
import { getManufacturers, getRobots } from '@/lib/data';
import { createPageMetadata } from '@/lib/metadata';
import { siteMeta } from '@/lib/site';

export const metadata = createPageMetadata({
  title: 'メーカー・代理店の方へ',
  description:
    'Deploidへの掲載情報の確認・提供・修正依頼について。掲載は無料で、修正・削除依頼にも対応します。公開情報をもとに作成した掲載ページの確認をお願いしています。',
  path: '/for-manufacturers',
});

export default function ForManufacturersPage() {
  const robotCount = getRobots().length;
  const manufacturerCount = getManufacturers().length;

  return (
    <div className="site-container py-8">
      <Breadcrumbs items={[{ label: 'メーカー・代理店の方へ' }]} />

      <div className="content-col">
        <section className="py-8 border-b border-border">
          <p className="text-xs text-muted-foreground mb-4">メーカー・代理店の方へ</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-4 leading-tight">
            掲載情報の確認・提供について
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Deploidは国内企業のヒューマノイド情報収集・導入検討に必要な、正確な情報を提供することを目的としています。掲載は無料で、修正・削除依頼にも随時対応いたします。公開情報をもとに作成した各社の掲載ページについて、内容の確認・補足をお願いしております。
          </p>
        </section>

        <section className="py-8 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground mb-6">サイト概要</h2>
          <DefinitionList
            ddTone="foreground"
            rows={[
              { label: '掲載数', value: `ロボット ${robotCount}件・メーカー ${manufacturerCount}社（${siteMeta.dataAsOf}現在）` },
              { label: '公開開始', value: siteMeta.launchedAt },
              { label: '運営', value: '慶應義塾大学の学生による個人運営。中立的な情報整理を目的とし、特定製品の推奨・販売を目的とするものではありません。' },
              { label: '目的', value: '日本企業がヒューマノイドの導入可否を判断するための情報を整備、導入の支援をすること。国内市場のヒューマノイドの情報ハブとなることを目指しております。' },
              { label: '情報方針', value: '公式発表・報道・取材情報等に基づいた正確な情報を提供いたします。' },
            ]}
          />
        </section>

        <section className="py-8 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground mb-6">掲載できる情報</h2>
          <DefinitionList
            ddTone="muted"
            rows={[
              { label: '製品画像・ロゴ', value: '許諾条件に従って掲載。公式メディアキット等があればお知らせください。現状は許諾待ちとして表示しているページがあります。' },
              { label: 'スペック・仕様', value: '公式サイト・プレスリリース・展示会発表などの公開情報。未確認項目は「要確認」として明示。' },
              { label: '国内販売状況', value: '日本市場での販売状況・代理店・その他スペック等。' },
              { label: '代理店・問い合わせ先', value: '日本国内での相談・導入問い合わせ先として掲載できます。' },
              { label: '導入事例', value: '公開済みの事例・PoC実績。守秘義務のない範囲で。' },
            ]}
          />
        </section>

        <section className="py-8 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground mb-6">掲載できない情報</h2>
          <DefinitionList
            ddTone="muted"
            rows={[
              { label: '未公開情報', value: 'NDA対象・社外秘・未発表の仕様等' },
              { label: '誇張表現', value: '「世界最高」「唯一」など客観的根拠のない宣伝表現。' },
              { label: '未確認スペック', value: '出典の取れない数値、推定値を事実として断定する記載' },
            ]}
          />
        </section>

        <section className="py-8 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground mb-6">掲載・修正の流れ</h2>
          <ol className="space-y-4">
            {[
              '公開情報をもとに仮掲載',
              'メーカー・代理店の方に確認依頼',
              '修正・補足・公式素材の反映',
              '確認済み情報として表示',
            ].map((item, i) => (
              <li key={i} className="flex gap-4">
                <span className="font-mono text-xs text-muted-foreground mt-0.5 shrink-0">{i + 1}.</span>
                <span className="text-sm text-foreground leading-relaxed">{item}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="py-8 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground mb-6">ご提供いただいた素材の利用範囲</h2>
          <DefinitionList
            ddTone="muted"
            rows={[
              { label: '利用範囲', value: 'Deploid内の製品紹介ページ・関連記事・SNS告知に限って使用します。第三者への再配布・再ホストは行いません。' },
              { label: '権利表記', value: 'ご指定いただいたクレジット（出典）を画像の近くに表示します。' },
              { label: '提携表現', value: '「公式」「提携」「推奨」等、関係性を誤認させる表現は使用しません。' },
              { label: '削除対応', value: '削除・差し替えのご依頼があれば速やかに対応します。' },
            ]}
          />
        </section>

        <section className="py-8 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground mb-3">ご確認していただきたい3点</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            誤情報を防ぐため、掲載内容について以下の3点だけご確認いただけると助かります。初回のご連絡はこの3点のご共有をお願いしております。
          </p>
          <ol className="space-y-4">
            {[
              '掲載可能な公式画像、またはメディアキット等',
              '日本市場向けに公開してよいスペック・仕様',
              '日本市場向けの問い合わせ先・導入相談窓口（メール、フォームURL、代理店ページなど）',
            ].map((item, i) => (
              <li key={i} className="flex gap-4">
                <span className="font-mono text-xs text-muted-foreground mt-0.5 shrink-0">{i + 1}.</span>
                <span className="text-sm text-foreground leading-relaxed">{item}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="py-8 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground mb-6">対応できる修正</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            製品名・会社名の表記修正、掲載画像の差し替え、問い合わせ先の変更、掲載停止、公式情報へのリンク追加に対応します。
          </p>
        </section>

        <section className="py-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">お問い合わせ</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            掲載内容の確認・補足、修正・削除依頼、メディアキット提供、掲載相談等は
            <Link
              href="/contact"
              className="text-signal hover:text-signal/80 underline underline-offset-2 transition-colors mx-0.5"
            >
              お問い合わせフォーム
            </Link>
            からしていただけます。
          </p>
        </section>
      </div>
    </div>
  );
}
