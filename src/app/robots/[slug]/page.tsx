import { getRobotBySlug, getRobots } from '@/lib/data';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return getRobots().map((robot) => ({ slug: robot.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const robot = getRobotBySlug(slug);
  return { title: robot ? (robot.nameJa ?? robot.name) : 'Robot' };
}

export default async function RobotDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const robot = getRobotBySlug(slug);
  if (!robot) notFound();

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-foreground">{robot.nameJa ?? robot.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Figma から復元予定（Robot詳細）。</p>
    </main>
  );
}
