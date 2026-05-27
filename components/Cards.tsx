import Link from 'next/link';
import type { Guide, Manufacturer, Report, Robot, Source, UseCase } from '@/data/types';
import {
  buyerReadinessLabels,
  companyTypeLabels,
  deploymentStageLabels,
  guideStageLabels,
  japanAvailabilityLabels,
  maturityLabels,
  reliabilityLabels,
  reportTypeLabels,
} from '@/lib/labels';

export function RobotCard({ robot, manufacturerName }: { robot: Robot; manufacturerName?: string }) {
  return (
    <Link className="card" href={`/robots/${robot.slug}`}>
      <span className="eyebrow">{manufacturerName ?? robot.manufacturerSlug}</span>
      <h3>{robot.nameJa ?? robot.name}</h3>
      <p>{robot.summary}</p>
      <div className="meta">
        <span className="pill">{deploymentStageLabels[robot.deploymentStage]}</span>
        <span className="pill">{buyerReadinessLabels[robot.buyerReadiness]}</span>
        <span className="pill">{japanAvailabilityLabels[robot.japanAvailability]}</span>
      </div>
    </Link>
  );
}

export function ManufacturerCard({ manufacturer }: { manufacturer: Manufacturer }) {
  return (
    <Link className="card" href={`/manufacturers/${manufacturer.slug}`}>
      <span className="eyebrow">{manufacturer.country}</span>
      <h3>{manufacturer.nameJa ?? manufacturer.name}</h3>
      <p>{manufacturer.summary}</p>
      <div className="meta">
        <span className="pill">{companyTypeLabels[manufacturer.companyType]}</span>
        <span className="pill">{manufacturer.robotSlugs.length} robots</span>
      </div>
    </Link>
  );
}

export function GuideCard({ guide }: { guide: Guide }) {
  return (
    <Link className="card" href={`/guides/${guide.slug}`}>
      <span className="eyebrow">{guideStageLabels[guide.stage]}</span>
      <h3>{guide.titleJa ?? guide.title}</h3>
      <p>{guide.summary}</p>
      <div className="meta">
        {guide.topics.slice(0, 3).map((topic) => (
          <span className="pill" key={topic}>
            {topic}
          </span>
        ))}
      </div>
    </Link>
  );
}

export function UseCaseCard({ useCase }: { useCase: UseCase }) {
  return (
    <Link className="card" href={`/use-cases/${useCase.slug}`}>
      <span className="eyebrow">{maturityLabels[useCase.maturityLevel]}</span>
      <h3>{useCase.titleJa ?? useCase.title}</h3>
      <p>{useCase.summary}</p>
      <div className="meta">
        <span className="pill">{buyerReadinessLabels[useCase.buyerReadiness]}</span>
        <span className="pill">{useCase.candidateRobotSlugs.length} candidates</span>
      </div>
    </Link>
  );
}

export function ReportCard({ report }: { report: Report }) {
  return (
    <Link className="card" href={`/reports/${report.slug}`}>
      <span className="eyebrow">{reportTypeLabels[report.type]}</span>
      <h3>{report.titleJa ?? report.title}</h3>
      <p>{report.summary}</p>
      <div className="meta">
        <span className="pill">{report.publishedAt}</span>
        {report.tags.slice(0, 2).map((tag) => (
          <span className="pill" key={tag}>
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}

export function SourceList({ sources }: { sources: Source[] }) {
  if (sources.length === 0) {
    return <p className="muted">出典は本文作成時に追加予定です。</p>;
  }

  return (
    <ul>
      {sources.map((source) => (
        <li key={source.url}>
          <a href={source.url} rel="noreferrer" target="_blank">
            {source.title}
          </a>{' '}
          <span className="muted">
            {source.publisher ? ` / ${source.publisher}` : ''} / checked {source.checkedAt} /{' '}
            {reliabilityLabels[source.reliability]}
          </span>
        </li>
      ))}
    </ul>
  );
}
