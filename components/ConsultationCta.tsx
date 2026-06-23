import Link from 'next/link';
import { SidebarBlock } from '@/components/SidebarSection';

interface ConsultationCtaProps {
  kicker: string;
  description: string;
  cta: string;
}

// use-cases/[slug] と guides/[slug] のサイドバー末尾で使う相談CTA。
// 文言（uiText）以外は完全一致していたため共通化する。
export function ConsultationCta({ kicker, description, cta }: ConsultationCtaProps) {
  return (
    <SidebarBlock kicker={kicker} kickerClassName="mb-2">
      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{description}</p>
      <Link
        href="/contact"
        className="flex items-center justify-center w-full px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-colors"
      >
        {cta}
      </Link>
    </SidebarBlock>
  );
}
