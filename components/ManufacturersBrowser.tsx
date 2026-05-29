'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, MapPin } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { EmptyState } from '@/components/EmptyState';
import { FilterSelect } from '@/components/FilterSelect';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import { SearchInput } from '@/components/SearchInput';
import { TagChip } from '@/components/TagChip';
import type { Manufacturer, Robot } from '@/data/types';
import { companyStatusLabels, companyTypeLabels, japanPresenceLabels, TBD_LABEL } from '@/lib/labels';
import { createManufacturerSearchDocument, matchesSearchDocument } from '@/lib/search';

interface ManufacturersBrowserProps {
  manufacturers: Manufacturer[];
  robots: Robot[];
}

export function ManufacturersBrowser({ manufacturers, robots }: ManufacturersBrowserProps) {
  const [country, setCountry] = useState('all');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');

  const robotsByManufacturer = useMemo(() => {
    const byManufacturer = new Map<string, Robot[]>();

    robots.forEach((robot) => {
      const existing = byManufacturer.get(robot.manufacturerSlug) ?? [];
      existing.push(robot);
      byManufacturer.set(robot.manufacturerSlug, existing);
    });

    return byManufacturer;
  }, [robots]);
  const searchDocuments = useMemo(
    () =>
      new Map(
        manufacturers.map((manufacturer) => [
          manufacturer.slug,
          createManufacturerSearchDocument(
            manufacturer,
            robotsByManufacturer.get(manufacturer.slug) ?? [],
          ),
        ]),
      ),
    [manufacturers, robotsByManufacturer],
  );

  const countries = useMemo(
    () => Array.from(new Set(manufacturers.map((m) => m.country))),
    [manufacturers],
  );
  const types = useMemo(
    () => Array.from(new Set(manufacturers.map((m) => m.companyType))),
    [manufacturers],
  );
  const statuses = useMemo(
    () => Array.from(new Set(manufacturers.map((m) => m.companyStatus))),
    [manufacturers],
  );
  const countryOptions = useMemo(
    () => [{ value: 'all', label: 'All Regions' }, ...countries.map((value) => ({ value, label: value }))],
    [countries],
  );
  const typeOptions = useMemo(
    () => [
      { value: 'all', label: 'All Types' },
      ...types.map((value) => ({ value, label: companyTypeLabels[value] })),
    ],
    [types],
  );
  const statusOptions = useMemo(
    () => [
      { value: 'all', label: 'All Status' },
      ...statuses.map((value) => ({ value, label: companyStatusLabels[value] })),
    ],
    [statuses],
  );

  const robotCount = (slug: string) => robotsByManufacturer.get(slug)?.length ?? 0;

  const filtered = manufacturers.filter(
    (m) =>
      (country === 'all' || m.country === country) &&
      (type === 'all' || m.companyType === type) &&
      (status === 'all' || m.companyStatus === status) &&
      matchesSearchDocument(query, searchDocuments.get(m.slug)),
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <Breadcrumbs items={[{ label: 'Manufacturers' }]} />

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Manufacturers</h1>
          <p className="text-sm text-neutral-600 max-w-3xl">
            ヒューマノイドの開発企業・代理店のディレクトリ。国・区分・ステータスで絞り込み、日本での供給体制を確認できます。
          </p>
        </div>

        <div className="mb-6 max-w-2xl">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="メーカー名・地域・取扱機種で検索"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-3">
          <FilterSelect
            id="manufacturer-country"
            label="ORIGIN COUNTRY"
            value={country}
            onChange={setCountry}
            options={countryOptions}
          />
          <FilterSelect
            id="manufacturer-type"
            label="COMPANY TYPE"
            value={type}
            onChange={setType}
            options={typeOptions}
          />
          <FilterSelect
            id="manufacturer-status"
            label="STATUS"
            value={status}
            onChange={setStatus}
            options={statusOptions}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState message="条件に合うメーカーがありません。" variant="muted" size="large" />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((manufacturer) => (
              <div
                key={manufacturer.slug}
                className="border border-neutral-300 bg-neutral-50 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="min-w-0 text-xl font-semibold text-neutral-900 tracking-tight">
                      <ManufacturerLogoName
                        name={manufacturer.name.toUpperCase()}
                        logo={manufacturer.logo}
                        frameClassName="h-7 w-7"
                        imageClassName="h-5 w-5"
                      />
                    </h2>
                    <TagChip className="py-1 border-neutral-400 whitespace-nowrap">
                      {companyTypeLabels[manufacturer.companyType]}
                    </TagChip>
                  </div>

                  <div className="space-y-2 text-xs mb-6">
                    <div className="flex justify-between py-1.5 border-b border-neutral-300">
                      <span className="text-neutral-500">所在地</span>
                      <span className="text-neutral-900 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {manufacturer.hqCity ? `${manufacturer.hqCity}, ${manufacturer.country}` : manufacturer.country}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-neutral-300">
                      <span className="text-neutral-500">取扱機種</span>
                      <span className="text-neutral-900">{robotCount(manufacturer.slug)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-neutral-300">
                      <span className="text-neutral-500">日本での体制</span>
                      <span className="text-neutral-900">{japanPresenceLabels[manufacturer.japanPresence]}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-neutral-500">設立</span>
                      <span className="text-neutral-900">{manufacturer.foundedYear ?? TBD_LABEL}</span>
                    </div>
                  </div>

                  <Link
                    href={`/manufacturers/${manufacturer.slug}`}
                    className="flex items-center justify-between w-full px-4 py-2 bg-white border border-neutral-300 hover:bg-neutral-50 transition-colors text-xs uppercase tracking-wide text-neutral-900"
                  >
                    <span>VIEW FULL PROFILE</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
