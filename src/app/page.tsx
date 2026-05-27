import Link from 'next/link';
import { ArrowRight, BookOpen, Bot, Boxes, Building2, Columns3, Newspaper } from 'lucide-react';
import { GuideCard, ReportCard, RobotCard, UseCaseCard } from '@/components/Cards';
import {
  getGuides,
  getManufacturerForRobot,
  getReports,
  getRobots,
  getUseCases,
} from '@/lib/data';

const hubLinks = [
  { href: '/robots', title: 'ロボット', text: '機種を価格・調達・国内可否・PoC適性・保守・安全の観点で整理。', Icon: Bot },
  { href: '/manufacturers', title: 'メーカー', text: '供給元・代理店・SIer・国内サポート体制を確認。', Icon: Building2 },
  { href: '/compare', title: '比較', text: '候補機種を同じ導入判断軸で横並びに比較。', Icon: Columns3 },
  { href: '/guides', title: 'ガイド', text: '調達・PoC・TCO・安全・法規を体系的に理解。', Icon: BookOpen },
  { href: '/use-cases', title: '用途から探す', text: '業界ではなく作業・タスク起点で候補を探す。', Icon: Boxes },
  { href: '/reports', title: '記事', text: '市場動向と導入レポートを買い手目線で読む。', Icon: Newspaper },
];

export default function HomePage() {
  const robots = getRobots();
  const useCases = getUseCases();
  const guides = getGuides();
  const reports = getReports();

  return (
    <div className="container py-12">
      <section className="border-b border-border py-16">
        <div className="max-w-3xl">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Humanoid Robot Buyer Portal
          </p>
          <h1 className="mb-4 text-4xl font-semibold tracking-tight text-foreground">
            日本企業のためのヒューマノイド導入判断ポータル
          </h1>
          <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
            ロボット、メーカー、用途、導入ガイド、記事を、スペック表ではなく「買い手が導入を判断するための変数」で整理します。
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/robots"
              className="inline-flex items-center gap-2 bg-primary px-6 py-3 text-primary-foreground transition-opacity hover:opacity-90"
            >
              ロボットを見る
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/guides/decision-variables"
              className="inline-flex items-center gap-2 border border-border px-6 py-3 text-foreground transition-colors hover:bg-secondary"
            >
              判断軸を読む
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border py-16">
        <h2 className="mb-8 text-2xl font-semibold text-foreground">コンテンツ</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hubLinks.map(({ href, title, text, Icon }) => (
            <Link
              key={href}
              href={href}
              className="border border-border bg-card p-6 transition-colors hover:border-foreground"
            >
              <Icon className="mb-4 h-8 w-8 text-foreground" />
              <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{text}</p>
              <span className="inline-flex items-center gap-1 text-sm text-foreground">
                詳しく見る
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-b border-border py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold text-foreground">注目ロボット</h2>
          <Link
            href="/robots"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            すべて見る
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {robots.slice(0, 2).map((robot) => (
            <RobotCard
              key={robot.slug}
              robot={robot}
              manufacturerName={getManufacturerForRobot(robot.manufacturerSlug)?.name}
            />
          ))}
        </div>
      </section>

      <section className="border-b border-border py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold text-foreground">用途から探す</h2>
          <Link
            href="/use-cases"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            一覧へ
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {useCases.slice(0, 3).map((useCase) => (
            <UseCaseCard key={useCase.slug} useCase={useCase} />
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="mb-6 text-2xl font-semibold text-foreground">ガイド</h2>
            <div className="grid gap-6">
              {guides.slice(0, 2).map((guide) => (
                <GuideCard key={guide.slug} guide={guide} />
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-6 text-2xl font-semibold text-foreground">最新記事</h2>
            <div className="grid gap-6">
              {reports.slice(0, 2).map((report) => (
                <ReportCard key={report.slug} report={report} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
