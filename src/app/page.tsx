import Link from 'next/link';
import { GuideCard, ReportCard, RobotCard, UseCaseCard } from '@/components/Cards';
import {
  getGuides,
  getManufacturerForRobot,
  getReports,
  getRobots,
  getUseCases,
} from '@/lib/data';

const hubLinks = [
  { href: '/robots', title: 'ロボット', text: '機種を導入判断軸で見る。' },
  { href: '/manufacturers', title: 'メーカー', text: '供給元、代理店、サポート体制を確認する。' },
  { href: '/compare', title: '比較', text: '候補機種を同じ軸で並べる。' },
  { href: '/guides', title: 'ガイド', text: '調達、PoC、安全、TCOを理解する。' },
  { href: '/use-cases', title: '用途から探す', text: '業界ではなく作業起点で候補を探す。' },
  { href: '/reports', title: '記事', text: '市場動向と導入レポートを読む。' },
];

export default function HomePage() {
  const robots = getRobots();
  const useCases = getUseCases();
  const guides = getGuides();
  const reports = getReports();

  return (
    <>
      <section className="hero">
        <div className="container">
          <span className="eyebrow">Humanoid Robot Buyer Portal</span>
          <h1>日本企業のためのヒューマノイド導入判断ポータル。</h1>
          <p className="lead">
            ロボット、メーカー、用途、導入ガイド、記事を、スペック表ではなく「買い手が判断するための変数」で整理します。
          </p>
          <div className="actions">
            <Link className="button" href="/robots">
              ロボットを見る
            </Link>
            <Link className="button secondary" href="/guides/decision-variables">
              判断軸を読む
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid">
            {hubLinks.map((link) => (
              <Link className="card" href={link.href} key={link.href}>
                <span className="eyebrow">{link.href}</span>
                <h3>{link.title}</h3>
                <p>{link.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>注目ロボット</h2>
            <Link className="muted" href="/robots">
              すべて見る
            </Link>
          </div>
          <div className="grid two">
            {robots.slice(0, 2).map((robot) => (
              <RobotCard
                key={robot.slug}
                robot={robot}
                manufacturerName={getManufacturerForRobot(robot.manufacturerSlug)?.name}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>用途から探す</h2>
            <Link className="muted" href="/use-cases">
              一覧へ
            </Link>
          </div>
          <div className="grid">
            {useCases.slice(0, 3).map((useCase) => (
              <UseCaseCard key={useCase.slug} useCase={useCase} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid two">
            <div>
              <div className="section-head">
                <h2>ガイド</h2>
              </div>
              <div className="grid">
                {guides.slice(0, 2).map((guide) => (
                  <GuideCard key={guide.slug} guide={guide} />
                ))}
              </div>
            </div>
            <div>
              <div className="section-head">
                <h2>最新記事</h2>
              </div>
              <div className="grid">
                {reports.slice(0, 2).map((report) => (
                  <ReportCard key={report.slug} report={report} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
