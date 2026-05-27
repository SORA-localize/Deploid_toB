'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, MapPin } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import type { Manufacturer, Robot } from '@/data/types';
import { companyStatusLabels, companyTypeLabels, japanPresenceLabels } from '@/lib/labels';

const TBD = '要確認';

interface ManufacturersBrowserProps {
  manufacturers: Manufacturer[];
  robots: Robot[];
}

export function ManufacturersBrowser({ manufacturers, robots }: ManufacturersBrowserProps) {
  const [country, setCountry] = useState('all');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');

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

  const robotCount = (slug: string) => robots.filter((r) => r.manufacturerSlug === slug).length;

  const filtered = manufacturers.filter(
    (m) =>
      (country === 'all' || m.country === country) &&
      (type === 'all' || m.companyType === type) &&
      (status === 'all' || m.companyStatus === status),
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

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div>
            <label className="block text-xs uppercase tracking-wide text-neutral-500 mb-2">ORIGIN COUNTRY</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 bg-white text-sm text-neutral-900 focus:outline-none focus:border-neutral-500"
            >
              <option value="all">All Regions</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-neutral-500 mb-2">COMPANY TYPE</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 bg-white text-sm text-neutral-900 focus:outline-none focus:border-neutral-500"
            >
              <option value="all">All Types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {companyTypeLabels[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-neutral-500 mb-2">STATUS</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 bg-white text-sm text-neutral-900 focus:outline-none focus:border-neutral-500"
            >
              <option value="all">All Status</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {companyStatusLabels[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="border border-neutral-300 bg-neutral-50 p-16 text-center text-sm text-neutral-500">
            条件に合うメーカーがありません。
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((manufacturer) => (
              <div
                key={manufacturer.slug}
                className="border border-neutral-300 bg-neutral-50 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="text-xl font-semibold text-neutral-900 tracking-tight">
                      {manufacturer.name.toUpperCase()}
                    </h2>
                    <span className="text-xs px-2 py-1 border border-neutral-400 text-neutral-700 whitespace-nowrap">
                      {companyTypeLabels[manufacturer.companyType]}
                    </span>
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
                      <span className="text-neutral-900">{manufacturer.foundedYear ?? TBD}</span>
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
