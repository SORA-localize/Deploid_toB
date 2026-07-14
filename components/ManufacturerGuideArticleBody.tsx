import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  Check,
  FlaskConical,
  Factory,
  GraduationCap,
  Briefcase,
  Presentation,
  type LucideIcon,
} from 'lucide-react';
import type {
  ManufacturerGuideContent,
  ManufacturerGuideDeploymentCategory,
  ManufacturerGuideProcurementChannel,
  Robot,
  Source,
} from '@/data/types';
import type { ManufacturerGuideLineupDisplayRow } from '@/lib/data';
import {
  manufacturerGuideDeploymentCategoryLabels,
  manufacturerGuideProcurementChannelKindLabels,
} from '@/lib/labels';
import {
  manufacturerGuideDeploymentCategoryOrder,
  manufacturerGuideProcurementChannelKindOrder,
} from '@/lib/display';
import { MANUFACTURER_GUIDE_SECTIONS, type ManufacturerGuideSectionId } from '@/lib/manufacturerGuideTemplate';
import { Markdown, sectionHeadingClassName } from '@/components/Markdown';
import { FeaturedRobotCard } from '@/components/FeaturedRobotCard';
import { RobotCardRail } from '@/components/RobotCardRail';
import { YouTubeEmbed } from '@/components/YouTubeEmbed';
import { uiText } from '@/lib/uiText';

/** 導入実績の分類アイコン。段階の内容を直感的に示す（色は付けず、状態は evidence 側で表す）。 */
const DEPLOYMENT_CATEGORY_ICON: Record<ManufacturerGuideDeploymentCategory, LucideIcon> = {
  researchEducation: GraduationCap,
  exhibitionDemo: Presentation,
  poc: FlaskConical,
  internalTrial: Factory,
  commercial: Briefcase,
};

/**
 * 導入実績の簡素なリスト。囲い枠・ステータス文言は持たず
 * （design_system_v1.md「本文ブロックに矩形背景を貼らない」/ 商用実績が薄い段階で主役化させない）、
 * 確認状態は evidence からモノクロの濃淡で表す:
 * confirmed=チェックマーク付き強調 / limited=通常 / none=グレーアウト（新しい色は持ち込まない）。
 * 行の根拠は「参照:」として媒体名リンクで示す。sourceUrls と記事 sources[] の対応は validate が強制する。
 */
function DeploymentList({ content, sources }: { content: ManufacturerGuideContent; sources: readonly Source[] }) {
  const sourceByUrl = new Map(sources.map((s) => [s.url, s]));
  return (
    <dl className="my-6 divide-y divide-border text-sm">
      {manufacturerGuideDeploymentCategoryOrder.map((category) => {
        const item = content.deploymentStatus[category];
        const Icon = DEPLOYMENT_CATEGORY_ICON[category];
        const isNone = item.evidence === 'none';
        const refs = (item.sourceUrls ?? []).map((url) => {
          const source = sourceByUrl.get(url);
          return { href: url, name: source?.publisher ?? source?.title ?? url };
        });
        return (
          <div key={category} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
            <dt className="flex items-start gap-2">
              <Icon
                aria-hidden="true"
                className={`mt-0.5 h-4 w-4 shrink-0 ${isNone ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}
              />
              <span className={`font-medium ${isNone ? 'text-muted-foreground' : 'text-foreground'}`}>
                {manufacturerGuideDeploymentCategoryLabels[category]}
              </span>
              {item.evidence === 'confirmed' && (
                <Check aria-label="確認済み" className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
              )}
            </dt>
            <dd
              className={`break-words leading-relaxed [overflow-wrap:anywhere] ${isNone ? 'text-muted-foreground' : 'text-foreground/80'}`}
            >
              {item.body}
              {refs.length > 0 && (
                <span className="mt-1 block text-xs text-muted-foreground">
                  {uiText.reports.guideDeploymentSourcePrefix}
                  {refs.map((ref, i) => (
                    <span key={ref.href}>
                      {i > 0 && ' / '}
                      <a
                        href={ref.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:text-foreground"
                      >
                        {ref.name}
                      </a>
                    </span>
                  ))}
                </span>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/** ラインナップ表。機体名・リンクはDB解決済みの行を受け取る（データ取得はページ側）。 */
function LineupTable({ rows }: { rows: ManufacturerGuideLineupDisplayRow[] }) {
  return (
    <div className="-mx-4 my-6 overflow-x-auto overscroll-x-contain px-4 sm:mx-0 sm:px-0">
      <table className="min-w-[34rem] w-full border border-border text-sm">
        <thead>
          <tr className="bg-muted/60 text-left text-xs text-muted-foreground">
            <th scope="col" className="px-3 py-2 font-medium">{uiText.reports.guideLineupRobot}</th>
            <th scope="col" className="px-3 py-2 font-medium">{uiText.reports.guideLineupRole}</th>
            <th scope="col" className="px-3 py-2 font-medium whitespace-nowrap">{uiText.reports.guideLineupPrice}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.href}>
              <td className="px-3 py-2.5 whitespace-nowrap">
                <Link href={row.href} className="font-medium text-foreground underline-offset-4 hover:underline">
                  {row.name}
                </Link>
              </td>
              <td className="px-3 py-2.5 leading-relaxed text-foreground/80 break-words [overflow-wrap:anywhere]">{row.roleLabel}</td>
              <td className="px-3 py-2.5 whitespace-nowrap text-foreground/80">
                {row.price.kind === 'contact' && row.price.href ? (
                  <Link href={row.price.href} className="underline underline-offset-4 hover:text-foreground">
                    {row.price.label}
                  </Link>
                ) : row.price.sourceUrl ? (
                  <a
                    href={row.price.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4 hover:text-foreground"
                  >
                    {row.price.label}
                  </a>
                ) : (
                  row.price.label
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** ラインナップ機体のカード横スクロール（関連ロボットと同じ FeaturedRobotCard パターン）。 */
function LineupRobotCards({ robots, manufacturerName }: { robots: Robot[]; manufacturerName?: string }) {
  if (robots.length === 0) return null;
  return (
    <RobotCardRail className="mt-6">
      {robots.map((robot) => (
        <FeaturedRobotCard key={robot.id} robot={robot} manufacturerName={manufacturerName} />
      ))}
    </RobotCardRail>
  );
}

/**
 * 日本からの調達のチャネルリスト。窓口は文章でなく必ずこのリストで示す（§6-1）。
 * 囲い枠・背景は付けない（design_system_v1.md）。Deploid の問い合わせ窓口は記事データに
 * 持たせず、ここで導入支援・相談グループの末尾に固定追加する。
 */
function ProcurementChannelList({ channels }: { channels: ManufacturerGuideProcurementChannel[] }) {
  return (
    <div className="my-6 space-y-5">
      {manufacturerGuideProcurementChannelKindOrder.map((kind) => {
        const group = channels.filter((channel) => channel.kind === kind);
        const isConsultation = kind === 'consultation';
        if (group.length === 0 && !isConsultation) return null;
        return (
          <div key={kind}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {manufacturerGuideProcurementChannelKindLabels[kind]}
            </p>
            <ul className="divide-y divide-border text-sm">
              {group.map((channel) => (
                <li key={channel.url} className="grid grid-cols-1 gap-1 py-2.5 sm:grid-cols-[14rem_1fr] sm:gap-4">
                  <a
                    href={channel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground break-words [overflow-wrap:anywhere]"
                  >
                    {channel.name}
                  </a>
                  <span className="leading-relaxed text-foreground/80">{channel.role}</span>
                </li>
              ))}
              {isConsultation && (
                <li className="grid grid-cols-1 gap-1 py-2.5 sm:grid-cols-[14rem_1fr] sm:gap-4">
                  <Link
                    href="/contact"
                    className="font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground"
                  >
                    {uiText.reports.guideProcurementDeploidName}
                  </Link>
                  <span className="leading-relaxed text-foreground/80">
                    {uiText.reports.guideProcurementDeploidRole}
                  </span>
                </li>
              )}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function FaqList({ content }: { content: ManufacturerGuideContent }) {
  return (
    <div className="space-y-5">
      {content.faq.map((item) => (
        <div key={item.question}>
          <h3 className="mb-1.5 font-semibold text-foreground">{uiText.reports.guideFaqPrefix}{item.question}</h3>
          <Markdown source={item.answer} />
        </div>
      ))}
    </div>
  );
}

/**
 * メーカー解説専用の本文レンダラー。MANUFACTURER_GUIDE_SECTIONS の並びをそのまま map して描画するため、
 * テンプレート配列の順序変更・挿入は sectionContent の型（Record 完全性）で追従が強制される。
 * TOCは同じ MANUFACTURER_GUIDE_SECTIONS から生成すること（呼び出し側 page.tsx）。
 */
export function ManufacturerGuideArticleBody({
  content,
  sources,
  lineupRows,
  lineupRobots,
  manufacturerName,
}: {
  content: ManufacturerGuideContent;
  sources: readonly Source[];
  lineupRows: ManufacturerGuideLineupDisplayRow[];
  /** lineup の robotId をDB解決した機体（カード横スクロール用）。取得はページ側。 */
  lineupRobots: Robot[];
  manufacturerName?: string;
}) {
  const sectionContent = {
    'company-overview': <Markdown source={content.companyOverview} />,
    'product-lineup': (
      <>
        <Markdown source={content.productLineup} />
        <LineupRobotCards robots={lineupRobots} manufacturerName={manufacturerName} />
        <LineupTable rows={lineupRows} />
        {content.videos?.map((video) => (
          <YouTubeEmbed key={video.videoId} video={video} />
        ))}
      </>
    ),
    history: <Markdown source={content.history} />,
    'deployment-track-record': (
      <>
        <Markdown source={content.deploymentIntro} />
        <DeploymentList content={content} sources={sources} />
      </>
    ),
    'japan-procurement': (
      <>
        <ProcurementChannelList channels={content.procurementChannels} />
        <Markdown source={content.japanProcurement} />
      </>
    ),
    faq: <FaqList content={content} />,
  } satisfies Record<ManufacturerGuideSectionId, ReactNode>;

  return (
    <>
      {MANUFACTURER_GUIDE_SECTIONS.filter((section) => section.id !== 'faq' || content.faq.length > 0).map((section) => (
        <section key={section.id} aria-labelledby={section.id}>
          <h2 id={section.id} className={sectionHeadingClassName}>
            {section.label}
          </h2>
          {sectionContent[section.id]}
        </section>
      ))}
    </>
  );
}
