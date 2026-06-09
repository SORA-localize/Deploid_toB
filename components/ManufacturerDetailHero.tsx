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

  const statusItems = [
    companyTypeLabels[manufacturer.companyType],
    companyStatusLabels[manufacturer.companyStatus],
    japanPresenceLabels[manufacturer.japanPresence],
  ];

  return (
    <section id="overview" className="scroll-mt-site-header border-b border-border pb-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem] items-start">
        <div className="min-w-0">
          <p className="mb-3 text-xs font-medium text-muted-foreground">
            {uiText.manufacturers.profile}
          </p>
          <h1 className="mb-5 text-2xl font-semibold leading-tight text-foreground md:text-3xl">
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

          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {statusItems.map((item, index) => (
              <span key={item} className="inline-flex items-center gap-3">
                <span>{item}</span>
                {index < statusItems.length - 1 && <span aria-hidden="true">/</span>}
              </span>
            ))}
          </div>
        </div>

        <aside className="mt-6 border-t border-border pt-6 self-start lg:mt-0 lg:border-t-0 lg:pt-0 lg:sticky lg:top-site-header-gap lg:border-l lg:border-border lg:pl-6">
          <p className="mb-4 text-sm font-semibold text-foreground">
            {uiText.manufacturers.contactPanel}
          </p>
          <div className="grid gap-3">
            {hasOfficialContact ? (
              <a
                href={contactHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-8 items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="min-w-0 border-b border-foreground pb-0.5">
                  {uiText.manufacturers.officialContact}
                </span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            ) : (
              <Link
                href={contactHref}
                className="inline-flex min-h-8 items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="min-w-0 border-b border-foreground pb-0.5">
                  {uiText.manufacturers.consultDeploid}
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0" />
              </Link>
            )}
            <a
              href={manufacturer.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-8 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Globe2 className="h-4 w-4 shrink-0" />
              <span className="min-w-0 border-b border-border pb-0.5">
                {uiText.manufacturers.externalWebsite}
              </span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" />
            </a>
          </div>

          <dl className="mt-5 divide-y divide-border text-xs">
            <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-3">
              <dt className="text-muted-foreground">{uiText.manufacturers.location}:</dt>
              <dd className="min-w-0 text-foreground">{getManufacturerLocationLabel(manufacturer)}</dd>
            </div>
            <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-3">
              <dt className="text-muted-foreground">{uiText.manufacturers.founded}:</dt>
              <dd className="min-w-0 text-foreground">{manufacturer.foundedYear ?? TBD_LABEL}</dd>
            </div>
            <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-3">
              <dt className="text-muted-foreground">{uiText.manufacturers.consultationRoute}:</dt>
              <dd className="min-w-0 text-foreground">
                {manufacturerConsultationRouteLabels[consultationRoute]}
              </dd>
            </div>
            <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-3">
              <dt className="text-muted-foreground">{uiText.manufacturers.domesticDistributors}:</dt>
              <dd className="min-w-0 text-foreground">{domesticDistributor.label}</dd>
            </div>
            <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-3">
              <dt className="text-muted-foreground">{uiText.manufacturers.handledRobots}:</dt>
              <dd className="min-w-0 text-foreground">{uiText.manufacturers.models(robots.length)}</dd>
            </div>
            <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-3">
              <dt className="text-muted-foreground">{uiText.manufacturers.lastUpdated}:</dt>
              <dd className="min-w-0 text-foreground">{manufacturer.updatedAt}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
