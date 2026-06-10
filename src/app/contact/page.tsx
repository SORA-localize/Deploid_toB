import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContactForm } from '@/components/ContactForm';

export const metadata = {
  title: 'お問い合わせ',
  description:
    'ロボット情報の修正、メーカー・代理店の掲載相談、取材相談、導入検討の相談を受け付けています。',
};

export default function ContactPage() {
  return (
    <div className="site-container py-8">
      <Breadcrumbs items={[{ label: 'お問い合わせ' }]} />

      <section className="py-8 border-b border-border">
        <p className="text-xs text-muted-foreground mb-4">お問い合わせ</p>
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-4 max-w-3xl leading-tight">
          情報提供・掲載相談・導入相談
        </h1>
        <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
          ロボット情報の修正、メーカー・代理店の掲載相談、取材相談、導入検討に関する相談を受け付けています。
        </p>
      </section>

      <section className="py-8">
        <ContactForm />
      </section>
    </div>
  );
}
