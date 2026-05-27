import { getUseCaseBySlug, getUseCases } from '@/lib/data';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return getUseCases().map((useCase) => ({ slug: useCase.slug }));
}

export default async function UseCaseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const useCase = getUseCaseBySlug(slug);
  if (!useCase) notFound();

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-foreground">{useCase.titleJa ?? useCase.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Figma から復元予定。</p>
    </main>
  );
}
