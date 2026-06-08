import Link from 'next/link';
import {
  Building2,
  ClipboardList,
  ExternalLink,
  LifeBuoy,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Manufacturer } from '@/data/types';
import {
  getDomesticDistributorDisplay,
  getManufacturerConsultationRoute,
  manufacturerConsultationRouteLabels,
} from '@/lib/manufacturerDisplay';
import { uiText } from '@/lib/uiText';

interface ManufacturerProcurementPanelProps {
  manufacturer: Manufacturer;
}

interface ProcurementNote {
  label: string;
  body: string;
  Icon: LucideIcon;
}

interface ProcurementNoteCandidate {
  label: string;
  body?: string;
  Icon: LucideIcon;
}

export function ManufacturerProcurementPanel({ manufacturer }: ManufacturerProcurementPanelProps) {
  const domesticDistributor = getDomesticDistributorDisplay(manufacturer);
  const consultationRoute = getManufacturerConsultationRoute(manufacturer);
  const contactHref = manufacturer.contactUrl ?? '/contact';
  const hasOfficialContact = Boolean(manufacturer.contactUrl);

  const noteCandidates: ProcurementNoteCandidate[] = [
    {
      label: uiText.manufacturers.distributorMemo,
      body: manufacturer.distributorNote,
      Icon: Building2,
    },
    {
      label: uiText.manufacturers.supportMemo,
      body: manufacturer.supportNote,
      Icon: LifeBuoy,
    },
    {
      label: uiText.manufacturers.procurementMemo,
      body: manufacturer.procurementNote,
      Icon: ClipboardList,
    },
    {
      label: uiText.manufacturers.vendorRiskMemo,
      body: manufacturer.vendorRiskNote,
      Icon: ShieldAlert,
    },
  ];
  const notes = noteCandidates.filter(
    (note): note is ProcurementNote => typeof note.body === 'string' && note.body.length > 0,
  );

  return (
    <section id="procurement" className="scroll-mt-site-header py-12 border-b border-border">
      <div className="mb-6 max-w-3xl">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          {uiText.manufacturers.procurementConsultation}
        </p>
        <h2 className="mb-3 text-2xl font-semibold text-foreground">
          {uiText.manufacturers.procurementConsultation}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {uiText.manufacturers.procurementLead}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-4 sm:grid-cols-2">
          {notes.length > 0 ? (
            notes.map(({ label, body, Icon }) => (
              <article key={label} className="border border-border bg-card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center border border-border bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">{label}</h3>
                </div>
                <p className="text-xs leading-relaxed text-foreground/80">{body}</p>
              </article>
            ))
          ) : (
            <article className="border border-border bg-card p-5 sm:col-span-2">
              <p className="text-sm font-semibold text-foreground">
                {uiText.manufacturers.procurementConsultation}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {uiText.manufacturers.noProcurementMemo}
              </p>
            </article>
          )}
        </div>

        <aside className="self-start border border-border bg-muted p-5">
          <p className="mb-4 text-sm font-semibold text-foreground">
            {uiText.manufacturers.consultationRoute}
          </p>
          <dl className="divide-y divide-border text-xs">
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-muted-foreground">{uiText.manufacturers.consultationRoute}</dt>
              <dd className="text-right text-foreground">
                {manufacturerConsultationRouteLabels[consultationRoute]}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-muted-foreground">{uiText.manufacturers.domesticDistributors}</dt>
              <dd className="text-right text-foreground">
                {domesticDistributor.hasDistributor ? (
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
                  domesticDistributor.label
                )}
              </dd>
            </div>
          </dl>

          {hasOfficialContact ? (
            <a
              href={contactHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">{uiText.manufacturers.officialContact}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          ) : (
            <Link
              href={contactHref}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">{uiText.manufacturers.consultDeploid}</span>
            </Link>
          )}
        </aside>
      </div>
    </section>
  );
}
