import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import {
  getManufacturerForRobot,
  getReportsForRobot,
  getRobotBySlug,
  getRobots,
  getUseCasesForRobot,
} from '@/lib/data';
import {
  buyerReadinessLabels,
  deploymentStageLabels,
  japanAvailabilityLabels,
  mobilityLabels,
  procurementLabels,
  reliabilityLabels,
} from '@/lib/labels';
import type { RobotCategory } from '@/data/types';

const TBD = '要確認';

const categoryLabels: Record<RobotCategory, string> = {
  humanoid: 'ヒューマノイド',
  'general-purpose-robot': '汎用ロボット',
  'upper-body-humanoid': '上半身型',
  'mobile-manipulator': '移動マニピュレータ',
  other: 'その他',
};

const sections = [
  { label: 'Overview', href: '#overview' },
  { label: 'Specifications', href: '#specs' },
  { label: 'Decision', href: '#decision' },
  { label: 'Applications', href: '#applications' },
  { label: 'Resources', href: '#sources' },
];

export function generateStaticParams() {
  return getRobots().map((robot) => ({ slug: robot.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const robot = getRobotBySlug(slug);
  const seo = robot?.seo;
  return {
    title: seo?.metaTitle ?? (robot ? (robot.nameJa ?? robot.name) : 'Robot'),
    description: seo?.metaDescription ?? robot?.summary,
    robots: seo?.noindex ? { index: false, follow: false } : undefined,
  };
}

export default async function RobotDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const robot = getRobotBySlug(slug);
  if (!robot) notFound();

  const manufacturer = getManufacturerForRobot(robot.manufacturerSlug);
  const useCases = getUseCasesForRobot(robot.slug);
  const reports = getReportsForRobot(robot.slug);
  const { specs } = robot;

  const all = getRobots();
  const idx = all.findIndex((r) => r.slug === robot.slug);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;

  const num = (v: number | undefined, unit = '') => (v != null ? `${v}${unit}` : TBD);

  const specRows: Array<[string, string]> = [
    ['メーカー', manufacturer?.name ?? robot.manufacturerSlug],
    ['カテゴリ', categoryLabels[robot.category]],
    ['移動方式', specs.mobility ? mobilityLabels[specs.mobility] : TBD],
    ['身長', num(specs.heightCm, ' cm')],
    ['重量', num(specs.weightKg, ' kg')],
    ['ペイロード', num(specs.payloadKg, ' kg')],
    ['稼働時間', specs.runtimeMin != null ? `約${specs.runtimeMin} 分` : TBD],
    ['速度', num(specs.speedMps, ' m/s')],
    ['自由度', num(specs.dof, ' DoF')],
    ['防塵防水', specs.ipRating ?? TBD],
  ];

  const decisionRows: Array<[string, string]> = [
    ['導入段階', deploymentStageLabels[robot.deploymentStage]],
    ['実務ラベル', buyerReadinessLabels[robot.buyerReadiness]],
    ['日本での入手性', japanAvailabilityLabels[robot.japanAvailability]],
    ['調達形態', robot.procurementModels.map((m) => procurementLabels[m]).join(' / ') || TBD],
    ['参考価格', robot.priceNote ?? TBD],
    ['安全性', robot.safetyNote ?? TBD],
    ['継続性リスク', robot.vendorRiskNote ?? TBD],
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-neutral-300">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center gap-6 py-4 text-xs uppercase tracking-wide overflow-x-auto">
            {sections.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="whitespace-nowrap pb-4 border-b-2 border-transparent text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12">
        <Breadcrumbs
          items={[
            { label: 'Robots', path: '/robots' },
            ...(manufacturer
              ? [{ label: manufacturer.name, path: `/manufacturers/${manufacturer.slug}` }]
              : []),
            { label: robot.nameJa ?? robot.name },
          ]}
        />

        <div id="overview" className="mb-8 scroll-mt-6">
          <h1 className="text-3xl font-semibold text-neutral-900 mb-3">{robot.nameJa ?? robot.name}</h1>
          <p className="text-sm text-neutral-600 leading-relaxed max-w-3xl">{robot.description}</p>
        </div>

        <div className="mb-12 border border-neutral-300">
          {robot.heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={robot.heroImage.src}
              alt={robot.heroImage.alt}
              className="w-full aspect-[16/9] object-cover"
            />
          ) : (
            <div className="aspect-[16/9] bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center text-xs text-neutral-500">
              [ ROBOT IMAGE ]
            </div>
          )}
        </div>

        <div id="specs" className="border border-neutral-300 bg-neutral-50 mb-12 scroll-mt-6">
          <div className="px-6 py-4 border-b border-neutral-300 bg-white">
            <h2 className="text-sm font-semibold text-neutral-900">Technical Specifications</h2>
          </div>
          <div className="p-6">
            <table className="w-full text-xs">
              <tbody className="divide-y divide-neutral-300">
                {specRows.map(([k, v]) => (
                  <tr key={k}>
                    <td className="py-3 text-neutral-500 w-1/3">{k}</td>
                    <td className="py-3 text-neutral-900 font-medium">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div id="decision" className="border border-neutral-300 bg-neutral-50 mb-12 scroll-mt-6">
          <div className="px-6 py-4 border-b border-neutral-300 bg-white">
            <h2 className="text-sm font-semibold text-neutral-900">導入判断</h2>
          </div>
          <div className="p-6">
            <table className="w-full text-xs">
              <tbody className="divide-y divide-neutral-300">
                {decisionRows.map(([k, v]) => (
                  <tr key={k}>
                    <td className="py-3 text-neutral-500 w-1/3">{k}</td>
                    <td className="py-3 text-neutral-900 font-medium">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div id="applications" className="border border-neutral-300 bg-neutral-50 mb-12 scroll-mt-6">
          <div className="px-6 py-4 border-b border-neutral-300 bg-white">
            <h2 className="text-sm font-semibold text-neutral-900">Application Notes</h2>
          </div>
          <div className="p-6">
            <p className="text-xs text-neutral-700 leading-relaxed mb-4">{robot.summary}</p>
            {robot.comparison.bestFit.length > 0 && (
              <div className="space-y-2 mb-4">
                <h3 className="text-xs font-semibold text-neutral-900">向く用途</h3>
                <ul className="text-xs text-neutral-700 space-y-1">
                  {robot.comparison.bestFit.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-neutral-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {robot.comparison.constraints.length > 0 && (
              <div className="space-y-2 mb-4">
                <h3 className="text-xs font-semibold text-neutral-900">制約</h3>
                <ul className="text-xs text-neutral-700 space-y-1">
                  {robot.comparison.constraints.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-neutral-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(useCases.length > 0 || reports.length > 0) && (
              <div className="flex flex-wrap gap-2 pt-2">
                {useCases.map((useCase) => (
                  <Link
                    key={useCase.slug}
                    href={`/use-cases/${useCase.slug}`}
                    className="text-xs px-3 py-1 bg-white border border-neutral-300 hover:border-neutral-500 transition-colors text-neutral-700"
                  >
                    {useCase.titleJa ?? useCase.title}
                  </Link>
                ))}
                {reports.map((report) => (
                  <Link
                    key={report.slug}
                    href={`/reports/${report.slug}`}
                    className="text-xs px-3 py-1 bg-white border border-neutral-300 hover:border-neutral-500 transition-colors text-neutral-700"
                  >
                    {report.titleJa ?? report.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div id="sources" className="border border-neutral-300 bg-neutral-50 scroll-mt-6">
          <div className="px-6 py-4 border-b border-neutral-300 bg-white">
            <h2 className="text-sm font-semibold text-neutral-900">Resources / 出典</h2>
          </div>
          <div className="p-6">
            {robot.sources.length === 0 ? (
              <p className="text-xs text-neutral-500">出典は本文作成時に追加予定です。</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {robot.sources.map((source) => (
                  <li key={source.url}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-neutral-900 hover:text-neutral-600 underline"
                    >
                      {source.title}
                    </a>
                    <span className="text-neutral-500">
                      {source.publisher ? ` / ${source.publisher}` : ''} / 確認 {source.checkedAt} /{' '}
                      {reliabilityLabels[source.reliability]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-12 pt-6 border-t border-neutral-300">
          {prev ? (
            <Link
              href={`/robots/${prev.slug}`}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-neutral-500 hover:text-neutral-900"
            >
              <ChevronLeft className="w-4 h-4" />
              {prev.nameJa ?? prev.name}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/robots/${next.slug}`}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-neutral-500 hover:text-neutral-900"
            >
              {next.nameJa ?? next.name}
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  );
}
