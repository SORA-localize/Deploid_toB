import type { ReactNode } from 'react';
import type { ManufacturerGuideContent } from '@/data/types';
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

/**
 * メーカー解説専用の本文レンダラー。MANUFACTURER_GUIDE_SECTIONS の並びをそのまま map して描画するため、
 * テンプレート配列の順序変更・挿入は sectionContent の型（Record 完全性）で追従が強制される。
 * TOCは同じ MANUFACTURER_GUIDE_SECTIONS から生成すること（呼び出し側 page.tsx）。
 */
export function ManufacturerGuideArticleBody({ content }: { content: ManufacturerGuideContent }) {
  const sectionContent = {
    'company-overview': <Markdown source={content.companyOverview} />,
    history: <Markdown source={content.history} />,
    'product-lineup': <Markdown source={content.productLineup} />,
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
