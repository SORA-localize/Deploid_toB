import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Manufacturer } from '@/data/types';
import {
  companyStatusLabels,
  companyTypeLabels,
  japanPresenceLabels,
  TBD_LABEL,
} from '@/lib/labels';
import {
  getDomesticDistributorDisplay,
  getManufacturerConsultationRoute,
  getManufacturerLocationLabel,
  manufacturerConsultationRouteLabels,
} from '@/lib/manufacturerDisplay';
import { uiText } from '@/lib/uiText';

interface ManufacturerFactSheetProps {
  manufacturer: Manufacturer;
  robotCount: number;
}

interface FactRow {
  label: string;
  value: ReactNode;
}

export function ManufacturerFactSheet({ manufacturer, robotCount }: ManufacturerFactSheetProps) {
  const domesticDistributor = getDomesticDistributorDisplay(manufacturer);
  const consultationRoute = getManufacturerConsultationRoute(manufacturer);

  const rows: FactRow[] = [
    {
      label: uiText.manufacturers.location,
      value: getManufacturerLocationLabel(manufacturer),
    },
    {
      label: uiText.manufacturers.founded,
      value: manufacturer.foundedYear ?? TBD_LABEL,
    },
    {
      label: uiText.manufacturers.companyType,
      value: companyTypeLabels[manufacturer.companyType],
    },
    {
      label: uiText.manufacturers.companyStatus,
      value: companyStatusLabels[manufacturer.companyStatus],
    },
    {
      label: uiText.manufacturers.japanPresence,
      value: japanPresenceLabels[manufacturer.japanPresence],
    },
    {
      label: uiText.manufacturers.consultationRoute,
      value: manufacturerConsultationRouteLabels[consultationRoute],
    },
    {
      label: uiText.manufacturers.domesticDistributors,
      value: domesticDistributor.hasDistributor ? (
        <span className="inline-flex flex-col items-end gap-1">
          {domesticDistributor.distributors.map((distributor) =>
            distributor.website ? (
              <a
                key={distributor.name}
                href={distributor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-end gap-1 underline underline-offset-4 hover:text-muted-foreground"
              >
                <span>{distributor.name}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span key={distributor.name}>{distributor.name}</span>
            ),
          )}
        </span>
      ) : (
        <Link href="/contact" className="text-accent-blue-pale hover:text-accent-blue-pale-hover">
          {domesticDistributor.label}
        </Link>
      ),
    },
    {
      label: uiText.manufacturers.handledRobots,
      value: uiText.manufacturers.models(robotCount),
    },
    {
      label: uiText.manufacturers.lastUpdated,
      value: manufacturer.updatedAt,
    },
    {
      label: uiText.common.website,
      value: (
        <a
          href={manufacturer.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-end gap-1 underline underline-offset-4 hover:text-muted-foreground"
        >
          <span className="min-w-0 break-all">{manufacturer.website}</span>
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      ),
    },
  ];

  return (
    <section id="facts" className="scroll-mt-site-header py-12 border-b border-border">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {uiText.manufacturers.companySummary}
          </p>
          <h2 className="text-2xl font-semibold text-foreground">
            {uiText.manufacturers.factSheet}
          </h2>
        </div>
        <span className="w-fit border border-border bg-muted px-3 py-1.5 text-xs text-foreground/80">
          {uiText.manufacturers.models(robotCount)}
        </span>
      </div>

      <div className="border border-border bg-card">
        <dl className="grid grid-cols-1 md:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[8rem_minmax(0,1fr)] gap-4 border-b border-border p-4 text-xs last:border-b-0 md:[&:nth-last-child(-n+2)]:border-b-0 md:[&:nth-child(even)]:border-l"
            >
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="min-w-0 text-right font-medium text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
