import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContactForm } from '@/components/ContactForm';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'お問い合わせ',
  description:
    'ロボット情報の修正、メーカー・代理店の掲載相談、取材相談、導入検討の相談を受け付けています。',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <div className="site-container py-8">
      <Breadcrumbs items={[{ label: 'お問い合わせ' }]} />

      <div className="content-col">
        <section className="py-8 border-b border-border">
          <p className="text-xs text-muted-foreground mb-4">お問い合わせ</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-4 leading-tight">
            情報提供・掲載相談・導入相談
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            ロボット情報の修正、メーカー・代理店の掲載相談、取材相談、導入検討に関する相談を受け付けています。
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            メーカー・代理店の方は
            <Link
              href="/for-manufacturers"
              className="text-signal hover:text-signal/80 underline underline-offset-2 transition-colors mx-0.5"
            >
              掲載情報の確認・提供について
            </Link>
            もご覧ください。
          </p>
        </section>

        <section className="py-8">
          <ContactForm />
        </section>
      </div>
    </div>
  );
}
