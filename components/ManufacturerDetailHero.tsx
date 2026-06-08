import Link from 'next/link';
import { ArrowRight, ExternalLink, Globe2, MessageSquare } from 'lucide-react';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import type { Manufacturer, Robot } from '@/data/types';
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
import { cn } from '@/lib/utils';
import {
  getCompanyStatusTone,
  getJapanPresenceTone,
  getVisualToneClassName,
} from '@/lib/visualSemantics';

interface ManufacturerDetailHeroProps {
  manufacturer: Manufacturer;
  robots: readonly Robot[];
}

export function ManufacturerDetailHero({ manufacturer, robots }: ManufacturerDetailHeroProps) {
  const name = manufacturer.nameJa ?? manufacturer.name;
  const domesticDistributor = getDomesticDistributorDisplay(manufacturer);
  const consultationRoute = getManufacturerConsultationRoute(manufacturer);
  const contactHref = manufacturer.contactUrl ?? '/contact';
  const hasOfficialContact = Boolean(manufacturer.contactUrl);

  const badges = [
    {
      label: companyTypeLabels[manufacturer.companyType],
      className: getVisualToneClassName('neutral'),
    },
    {
      label: companyStatusLabels[manufacturer.companyStatus],
      className: getVisualToneClassName(getCompanyStatusTone(manufacturer.companyStatus)),
    },
    {
      label: japanPresenceLabels[manufacturer.japanPresence],
      className: getVisualToneClassName(getJapanPresenceTone(manufacturer.japanPresence)),
    },
  ];

  return (
    <section id="overview" className="scroll-mt-site-header border-b border-border pb-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0">
          <p className="mb-3 text-xs font-medium text-muted-foreground">
            {uiText.manufacturers.profile}
          </p>
          <h1 className="mb-5 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            <ManufacturerLogoName
              name={name}
              logo={manufacturer.logo}
              frameClassName="h-12 w-12"
              imageClassName="h-9 w-9"
              textClassName="overflow-visible whitespace-normal text-clip"
            />
          </h1>
          <p className="max-w-4xl text-sm leading-relaxed text-foreground/80 sm:text-base">
            {manufacturer.description}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {badges.map((badge) => (
              <span
                key={badge.label}
                className={cn('inline-flex border px-3 py-1.5 text-xs font-medium', badge.className)}
              >
                {badge.label}
              </span>
            ))}
          </div>
        </div>

        <aside className="self-start border border-border bg-card p-5 lg:sticky lg:top-site-header-gap">
          <p className="mb-4 text-sm font-semibold text-foreground">
            {uiText.manufacturers.contactPanel}
          </p>
          <div className="grid gap-2">
            {hasOfficialContact ? (
              <a
                href={contactHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="min-w-0 truncate">{uiText.manufacturers.officialContact}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            ) : (
              <Link
                href={contactHref}
                className="inline-flex min-h-11 items-center justify-center gap-2 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="min-w-0 truncate">{uiText.manufacturers.consultDeploid}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0" />
              </Link>
            )}
            <a
              href={manufacturer.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Globe2 className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">{uiText.manufacturers.externalWebsite}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" />
            </a>
          </div>

          <dl className="mt-5 divide-y divide-border text-xs">
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-muted-foreground">{uiText.manufacturers.location}</dt>
              <dd className="text-right text-foreground">{getManufacturerLocationLabel(manufacturer)}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-muted-foreground">{uiText.manufacturers.founded}</dt>
              <dd className="text-right text-foreground">{manufacturer.foundedYear ?? TBD_LABEL}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-muted-foreground">{uiText.manufacturers.consultationRoute}</dt>
              <dd className="text-right text-foreground">
                {manufacturerConsultationRouteLabels[consultationRoute]}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-muted-foreground">{uiText.manufacturers.domesticDistributors}</dt>
              <dd className="text-right text-foreground">{domesticDistributor.label}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-muted-foreground">{uiText.manufacturers.handledRobots}</dt>
              <dd className="text-right text-foreground">{uiText.manufacturers.models(robots.length)}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-muted-foreground">{uiText.manufacturers.lastUpdated}</dt>
              <dd className="text-right text-foreground">{manufacturer.updatedAt}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
