import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'プライバシーポリシー',
  description: 'Deploidにおける個人情報の取り扱いについて説明します。',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <div className="site-container py-8">
      <Breadcrumbs items={[{ label: 'プライバシーポリシー' }]} />

      <div className="content-col">
        <section className="py-8 border-b border-border">
          <p className="text-xs text-muted-foreground mb-4">プライバシーポリシー</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-4 leading-tight">
            個人情報の取り扱いについて
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Deploidは、お問い合わせフォームを通じて取得した個人情報を以下の方針に従って取り扱います。
          </p>
        </section>

        <section className="py-8 border-b border-border">
          <dl className="divide-y divide-border">
            {[
              {
                label: '収集する情報',
                body: 'お問い合わせフォームから送信された、氏名（任意）・会社名・メールアドレス・問い合わせ種別・問い合わせ内容。',
              },
              {
                label: '利用目的',
                body: 'お問い合わせへの回答のみに使用します。マーケティング目的での利用や、ダイレクトメールの送付は行いません。',
              },
              {
                label: '外部サービス',
                body: 'フォームの送受信にFormspree（formspree.io）を使用しています。送信されたデータはFormspreeのサーバーを経由します。また、アクセス解析のためにGoogle Analytics 4、Vercel Analytics、Microsoft Clarityを使用する場合があります。各サービスのプライバシーポリシーは各社のウェブサイトをご参照ください。',
              },
              {
                label: 'Cookie等の利用',
                body: 'アクセス解析やサイト改善のため、Cookieまたはこれに類する技術を利用する場合があります。これらは閲覧ページ、流入元、端末・ブラウザ情報、操作状況などを計測するために使用します。',
              },
              {
                label: '録画・ヒートマップ',
                body: 'Microsoft Clarityを有効にしている場合、サイト改善のためにクリック、スクロール、ページ遷移などの操作状況がヒートマップやセッション録画として記録される場合があります。フォーム入力欄など個人情報を含み得る箇所の取り扱いには、外部サービス側のマスキング機能と設定を利用します。',
              },
              {
                label: '第三者提供',
                body: '法令に基づく場合を除き、取得した個人情報を第三者に提供・開示しません。',
              },
              {
                label: '保管・削除',
                body: 'お問い合わせへの対応が完了した後、速やかに削除します。',
              },
              {
                label: '開示・訂正・削除',
                body: '個人情報の開示・訂正・削除のご要望は、下記の連絡先までご連絡ください。',
              },
            ].map(({ label, body }) => (
              <div key={label} className="grid grid-cols-1 md:grid-cols-[10rem_1fr] gap-2 md:gap-8 py-4 first:pt-0 last:pb-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:pt-0.5 shrink-0">{label}</dt>
                <dd className="text-sm text-muted-foreground leading-relaxed">{body}</dd>
              </div>
            ))}
            <div className="grid grid-cols-1 md:grid-cols-[10rem_1fr] gap-2 md:gap-8 py-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:pt-0.5 shrink-0">連絡先</dt>
              <dd className="text-sm text-muted-foreground leading-relaxed">
                <Link
                  href="/contact"
                  className="text-signal hover:text-signal/80 underline underline-offset-2 transition-colors"
                >
                  お問い合わせフォーム
                </Link>
                よりご連絡ください。
              </dd>
            </div>
          </dl>
        </section>

        <section className="py-8">
          <p className="text-xs text-muted-foreground">最終更新：2026年6月</p>
        </section>
      </div>
    </div>
  );
}
