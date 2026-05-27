import { getGuideBySlug, getGuides } from '@/lib/data';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return getGuides().map((guide) => ({ slug: guide.slug }));
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-foreground">{guide.titleJa ?? guide.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Figma から復元予定。</p>
    </main>
  );
}
