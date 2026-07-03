import type { ReactNode } from 'react';
import Link from 'next/link';
import type { ManufacturerGuideContent } from '@/data/types';
import type { ManufacturerGuideLineupDisplayRow } from '@/lib/data';
import {
  manufacturerGuideDeploymentCategoryLabels,
  manufacturerGuideDeploymentEvidenceLabels,
  manufacturerGuideEvaluationAxisLabels,
  manufacturerGuideEvaluationLevelLabels,
} from '@/lib/labels';
import {
  manufacturerGuideDeploymentCategoryOrder,
  manufacturerGuideEvaluationAxisOrder,
} from '@/lib/display';
import {
  manufacturerGuideDeploymentEvidenceTones,
  manufacturerGuideEvaluationLevelTones,
} from '@/lib/visualSemantics';
import { MANUFACTURER_GUIDE_SECTIONS, type ManufacturerGuideSectionId } from '@/lib/manufacturerGuideTemplate';
import { Markdown, sectionHeadingClassName } from '@/components/Markdown';
import { JudgmentTable, type JudgmentRow } from '@/components/JudgmentTable';
import { YouTubeEmbed } from '@/components/YouTubeEmbed';
import { uiText } from '@/lib/uiText';

function toEvaluationRows(content: ManufacturerGuideContent): JudgmentRow[] {
  return manufacturerGuideEvaluationAxisOrder.map((axis) => {
    const item = content.evaluationAxes[axis];
    return {
      key: axis,
      label: manufacturerGuideEvaluationAxisLabels[axis],
      statusLabel: item.labelOverride ?? manufacturerGuideEvaluationLevelLabels[item.level],
      tone: manufacturerGuideEvaluationLevelTones[item.level],
      body: item.body,
    };
  });
}

function toDeploymentRows(content: ManufacturerGuideContent): JudgmentRow[] {
  return manufacturerGuideDeploymentCategoryOrder.map((category) => {
    const item = content.deploymentStatus[category];
    return {
      key: category,
      label: manufacturerGuideDeploymentCategoryLabels[category],
      statusLabel: item.labelOverride ?? manufacturerGuideDeploymentEvidenceLabels[item.evidence],
      tone: manufacturerGuideDeploymentEvidenceTones[item.evidence],
      body: item.body,
    };
  });
}

/** ラインナップ表。機体名・リンクはDB解決済みの行を受け取る（データ取得はページ側）。 */
function LineupTable({ rows }: { rows: ManufacturerGuideLineupDisplayRow[] }) {
  return (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border border-border text-sm">
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
              <td className="px-3 py-2.5 leading-relaxed text-foreground/80">{row.roleLabel}</td>
              <td className="px-3 py-2.5 whitespace-nowrap text-foreground/80">{row.priceLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
  lineupRows,
}: {
  content: ManufacturerGuideContent;
  lineupRows: ManufacturerGuideLineupDisplayRow[];
}) {
  const sectionContent = {
    'company-overview': <Markdown source={content.companyOverview} />,
    history: <Markdown source={content.history} />,
    'product-lineup': (
      <>
        <Markdown source={content.productLineup} />
        <LineupTable rows={lineupRows} />
        {content.videos?.map((video) => (
          <YouTubeEmbed key={video.videoId} video={video} />
        ))}
      </>
    ),
    'strengths-and-cautions': (
      <>
        <Markdown source={content.evaluationIntro} />
        <JudgmentTable rows={toEvaluationRows(content)} />
      </>
    ),
    'deployment-track-record': (
      <>
        <Markdown source={content.deploymentIntro} />
        <JudgmentTable rows={toDeploymentRows(content)} />
        <Markdown source={content.deploymentOutro} />
      </>
    ),
    'japan-procurement': <Markdown source={content.japanProcurement} />,
    faq: <FaqList content={content} />,
    'fit-summary': <Markdown source={content.fitSummary} />,
  } satisfies Record<ManufacturerGuideSectionId, ReactNode>;

  return (
    <>
      {MANUFACTURER_GUIDE_SECTIONS.map((section) => (
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
