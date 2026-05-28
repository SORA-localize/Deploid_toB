import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata = {
  title: 'お問い合わせ',
  description:
    'ロボット情報の修正、メーカー・代理店の掲載相談、取材相談、導入検討の相談を受け付けています。',
};

// TODO: 公開前に実際の連絡先（メールアドレス / Formspree 等）に差し替える。
const CONTACT_EMAIL = 'hello@example.com';

const inquiries = [
  {
    label: 'Data',
    title: '情報提供・修正',
    body: '価格、代理店、サポート、導入状況などの更新情報があれば共有してください。出典付きだと助かります。',
  },
  {
    label: 'Listing',
    title: '掲載相談',
    body: 'メーカー、代理店、SIer、関連サービスの掲載相談はこちら。',
  },
  {
    label: 'Interview',
    title: '取材相談',
    body: '導入事例・ハンズオン・デモなど、一次情報の取材に関するご相談。',
  },
  {
    label: 'Adoption',
    title: '導入相談',
    body: 'どの用途から検討すべきか、PoC前に何を整理すべきかを相談できます。',
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <Breadcrumbs items={[{ label: 'Contact' }]} />

      <section className="py-12 border-b border-neutral-200">
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-500 mb-4">Contact</p>
        <h1 className="text-3xl font-semibold text-neutral-900 mb-4 max-w-3xl leading-tight">
          情報提供・掲載相談・導入相談
        </h1>
        <p className="text-lg text-neutral-600 max-w-3xl leading-relaxed">
          ロボット情報の修正、メーカー・代理店の掲載相談、取材相談、導入検討に関する相談を受け付けています。
        </p>
      </section>

      <section className="py-12 border-b border-neutral-200">
        <div className="grid sm:grid-cols-2 gap-6">
          {inquiries.map((q) => (
            <div key={q.label} className="border border-neutral-200 bg-white p-6">
              <p className="font-mono text-xs uppercase tracking-widest text-neutral-500 mb-3">{q.label}</p>
              <h3 className="font-semibold text-neutral-900 mb-2">{q.title}</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">{q.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12">
        <div className="border border-neutral-200 bg-white p-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">連絡方法</h2>
          <p className="text-neutral-600 mb-6 max-w-3xl leading-relaxed">
            現時点では販売している製品はありません。導入判断の整理や情報の正確性向上のための窓口です。
            下記よりメールでご連絡ください。
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-700 transition-colors text-sm"
          >
            メールで連絡する
          </a>
        </div>
      </section>
    </div>
  );
}
