import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContactForm } from '@/components/ContactForm';

export const metadata = {
  title: 'お問い合わせ',
  description:
    'ロボット情報の修正、メーカー・代理店の掲載相談、取材相談、導入検討の相談を受け付けています。',
};

const inquiries = [
  {
    label: '情報修正',
    title: '情報提供・修正',
    body: '価格、代理店、サポート、導入状況、掲載画像・ロゴの修正や削除依頼があれば共有してください。出典付きだと助かります。',
  },
  {
    label: '掲載',
    title: '掲載相談',
    body: 'メーカー、代理店、SIer、関連サービスの掲載相談はこちら。',
  },
  {
    label: '取材',
    title: '取材相談',
    body: '導入事例・ハンズオン・デモなど、一次情報の取材に関するご相談。',
  },
  {
    label: '導入',
    title: '導入相談',
    body: 'どの用途から検討すべきか、PoC前に何を整理すべきかを相談できます。',
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 md:px-8 py-12">
      <Breadcrumbs items={[{ label: 'お問い合わせ' }]} />

      <section className="py-12 border-b border-neutral-200">
        <p className="text-xs text-neutral-500 mb-4">お問い合わせ</p>
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
              <p className="text-xs text-neutral-500 mb-3">{q.label}</p>
              <h3 className="font-semibold text-neutral-900 mb-2">{q.title}</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">{q.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12">
        <div className="border border-neutral-200 bg-white p-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">お問い合わせフォーム</h2>
          <p className="text-neutral-600 mb-8 max-w-3xl leading-relaxed">
            現時点では販売している製品はありません。導入判断の整理や情報の正確性向上のための窓口です。
            下記フォームよりご連絡ください。
          </p>
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
