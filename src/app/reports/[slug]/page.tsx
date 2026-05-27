import { getReportBySlug, getReports } from '@/lib/data';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return getReports().map((report) => ({ slug: report.slug }));
}

export default async function ReportDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const report = getReportBySlug(slug);
  if (!report) notFound();

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-foreground">{report.titleJa ?? report.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Figma から復元予定。</p>
    </main>
  );
}
