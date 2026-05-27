import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { RobotCard } from '@/components/RobotCard';
import {
  getManufacturerBySlug,
  getManufacturers,
  getReports,
  getRobotsByManufacturerSlug,
} from '@/lib/data';
import { companyTypeLabels, japanPresenceLabels } from '@/lib/labels';

const TBD = '要確認';

export function generateStaticParams() {
  return getManufacturers().map((manufacturer) => ({ slug: manufacturer.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const manufacturer = getManufacturerBySlug(slug);
  return {
    title: manufacturer ? (manufacturer.nameJa ?? manufacturer.name) : 'Manufacturer',
    description: manufacturer?.description,
  };
}

export default async function ManufacturerDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const manufacturer = getManufacturerBySlug(slug);
  if (!manufacturer) notFound();

  const robots = getRobotsByManufacturerSlug(manufacturer.slug);
  const reports = getReports().filter((r) =>
    r.relatedManufacturerSlugs.includes(manufacturer.slug),
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <Breadcrumbs
          items={[
            { label: 'Manufacturers', path: '/manufacturers' },
            { label: manufacturer.nameJa ?? manufacturer.name },
          ]}
        />

        <div className="grid grid-cols-3 gap-8 mb-12">
          <div className="col-span-2">
            <div className="mb-2 text-xs uppercase tracking-wide text-neutral-500 flex items-center gap-2">
              <span>[ MANUFACTURER PROFILE ]</span>
              <span className="px-2 py-0.5 border border-neutral-400 text-neutral-700">
                {companyTypeLabels[manufacturer.companyType]}
              </span>
            </div>
            <h1 className="text-3xl font-semibold text-neutral-900 mb-4">
              {manufacturer.nameJa ?? manufacturer.name}
            </h1>
            <p className="text-sm text-neutral-700 leading-relaxed mb-6">{manufacturer.description}</p>
            <div className="flex gap-4 text-xs flex-wrap">
              {manufacturer.distributorNote && (
                <div className="px-3 py-1.5 bg-neutral-100 border border-neutral-300 text-neutral-700">
                  代理店: {manufacturer.distributorNote}
                </div>
              )}
              {manufacturer.supportNote && (
                <div className="px-3 py-1.5 bg-neutral-100 border border-neutral-300 text-neutral-700">
                  サポート: {manufacturer.supportNote}
                </div>
              )}
              {manufacturer.vendorRiskNote && (
                <div className="px-3 py-1.5 bg-neutral-100 border border-neutral-300 text-neutral-700">
                  継続性: {manufacturer.vendorRiskNote}
                </div>
              )}
            </div>
          </div>

          <div className="border border-neutral-300 bg-neutral-50 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-4">Fact Sheet</h3>
            <dl className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-neutral-300">
                <dt className="text-neutral-500">所在地</dt>
                <dd className="text-neutral-900">
                  {manufacturer.hqCity ? `${manufacturer.hqCity}, ${manufacturer.country}` : manufacturer.country}
                </dd>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-300">
                <dt className="text-neutral-500">設立</dt>
                <dd className="text-neutral-900">{manufacturer.foundedYear ?? TBD}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-300">
                <dt className="text-neutral-500">取扱機種</dt>
                <dd className="text-neutral-900">{robots.length}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-neutral-500">日本での体制</dt>
                <dd className="text-neutral-900">{japanPresenceLabels[manufacturer.japanPresence]}</dd>
              </div>
            </dl>
            <div className="flex gap-2 mt-6">
              <a
                href={manufacturer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white border border-neutral-300 hover:bg-neutral-50 text-xs uppercase tracking-wide text-neutral-900"
              >
                <ExternalLink className="w-3 h-3" />
                WEBSITE
              </a>
              <Link
                href="/contact"
                className="flex-1 text-center px-3 py-2 bg-neutral-900 text-white hover:bg-neutral-700 text-xs uppercase tracking-wide"
              >
                CONTACT
              </Link>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-neutral-900">取扱機種</h2>
            <span className="px-3 py-1.5 bg-neutral-100 border border-neutral-300 text-neutral-700 text-xs uppercase tracking-wide">
              [ {robots.length} MODELS ]
            </span>
          </div>

          {robots.length > 0 ? (
            <div className="grid grid-cols-3 gap-6">
              {robots.map((robot) => (
                <RobotCard key={robot.slug} robot={robot} manufacturerName={manufacturer.name} />
              ))}
            </div>
          ) : (
            <div className="border border-neutral-200 bg-white p-8 text-center">
              <p className="text-neutral-500">このメーカーの機種情報は準備中です</p>
            </div>
          )}
        </div>

        {reports.length > 0 && (
          <div className="mt-12 border border-neutral-300 bg-neutral-50 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">関連レポート</h3>
            <div className="space-y-3">
              {reports.map((report) => (
                <Link
                  key={report.slug}
                  href={`/reports/${report.slug}`}
                  className="flex items-start gap-3 p-3 bg-white border border-neutral-300 hover:border-neutral-500 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-neutral-900 mb-1">
                      {report.titleJa ?? report.title}
                    </h4>
                    <p className="text-xs text-neutral-600">{report.summary}</p>
                  </div>
                  <div className="text-xs text-neutral-500 whitespace-nowrap">{report.publishedAt}</div>
                  <ChevronRight className="w-4 h-4 text-neutral-500 mt-1 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
