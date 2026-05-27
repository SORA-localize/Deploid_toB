import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SourceList } from '@/components/Cards';
import {
  getManufacturerBySlug,
  getManufacturers,
  getRobotsByManufacturerSlug,
} from '@/lib/data';
import { companyTypeLabels, japanPresenceLabels } from '@/lib/labels';

export function generateStaticParams() {
  return getManufacturers().map((manufacturer) => ({ slug: manufacturer.slug }));
}

export default async function ManufacturerDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const manufacturer = getManufacturerBySlug(slug);

  if (!manufacturer) {
    notFound();
  }

  const robots = getRobotsByManufacturerSlug(manufacturer.slug);

  return (
    <section className="hero">
      <div className="container">
        <span className="eyebrow">{companyTypeLabels[manufacturer.companyType]}</span>
        <h1 className="page-title">{manufacturer.nameJa ?? manufacturer.name}</h1>
        <p className="lead">{manufacturer.description}</p>
        <div className="detail-grid section">
          <article className="panel">
            <h2>供給体制</h2>
            <table className="table">
              <tbody>
                <tr>
                  <th>国</th>
                  <td>{manufacturer.country}</td>
                </tr>
                <tr>
                  <th>日本での体制</th>
                  <td>{japanPresenceLabels[manufacturer.japanPresence]}</td>
                </tr>
                <tr>
                  <th>代理店メモ</th>
                  <td>{manufacturer.distributorNote ?? '要確認'}</td>
                </tr>
                <tr>
                  <th>サポート</th>
                  <td>{manufacturer.supportNote ?? '要確認'}</td>
                </tr>
              </tbody>
            </table>
            <h2>出典</h2>
            <SourceList sources={manufacturer.sources} />
          </article>
          <aside className="panel">
            <h2>関連ロボット</h2>
            <div className="meta">
              {robots.map((robot) => (
                <Link className="pill" href={`/robots/${robot.slug}`} key={robot.slug}>
                  {robot.nameJa ?? robot.name}
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
