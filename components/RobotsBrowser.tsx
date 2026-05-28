'use client';

import { useMemo, useState } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { EmptyState } from '@/components/EmptyState';
import { FilterChipGroup } from '@/components/FilterChipGroup';
import { FilterSelect } from '@/components/FilterSelect';
import { RobotCard } from '@/components/RobotCard';
import { SearchInput } from '@/components/SearchInput';
import type { Manufacturer, Robot } from '@/data/types';
import { japanAvailabilityLabels } from '@/lib/labels';
import { matchesQuery } from '@/lib/search';

const categoryLabels: Record<string, string> = {
  humanoid: 'ヒューマノイド',
  'general-purpose-robot': '汎用ロボット',
  'upper-body-humanoid': '上半身型',
  'mobile-manipulator': '移動マニピュレータ',
  other: 'その他',
};

const PRE_RELEASE_STAGES = ['concept', 'prototype'];

interface RobotsBrowserProps {
  robots: Robot[];
  manufacturers: Manufacturer[];
}

export function RobotsBrowser({ robots, manufacturers }: RobotsBrowserProps) {
  const [type, setType] = useState('all');
  const [mfg, setMfg] = useState('all');
  const [avail, setAvail] = useState('all');
  const [release, setRelease] = useState<'active' | 'pre'>('active');
  const [query, setQuery] = useState('');

  const manufacturerFor = (slug: string) => manufacturers.find((m) => m.slug === slug);
  const manufacturerName = (slug: string) => manufacturerFor(slug)?.name ?? slug;

  const types = useMemo(() => Array.from(new Set(robots.map((r) => r.category))), [robots]);
  const avails = useMemo(
    () => Array.from(new Set(robots.map((r) => r.japanAvailability))),
    [robots],
  );
  const typeOptions = useMemo(
    () => [
      { value: 'all', label: 'All Types' },
      ...types.map((value) => ({ value, label: categoryLabels[value] ?? value })),
    ],
    [types],
  );
  const manufacturerOptions = useMemo(
    () => [
      { value: 'all', label: 'All Manufacturers' },
      ...manufacturers.map((manufacturer) => ({
        value: manufacturer.slug,
        label: manufacturer.name,
      })),
    ],
    [manufacturers],
  );
  const availabilityOptions = useMemo(
    () => [
      { value: 'all', label: 'All Status' },
      ...avails.map((value) => ({ value, label: japanAvailabilityLabels[value] })),
    ],
    [avails],
  );

  const filtered = useMemo(() => {
    return [...robots]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .filter((r) => {
        const typeOk = type === 'all' || r.category === type;
        const mfgOk = mfg === 'all' || r.manufacturerSlug === mfg;
        const availOk = avail === 'all' || r.japanAvailability === avail;
        const isPre = PRE_RELEASE_STAGES.includes(r.deploymentStage);
        const releaseOk = release === 'active' ? !isPre : isPre;
        const queryOk = matchesQuery(query, [
          r.nameJa,
          r.name,
          manufacturerName(r.manufacturerSlug),
          r.summary,
          r.description,
          r.distributorJapan,
          r.supportNote,
          r.safetyNote,
          r.vendorRiskNote,
          ...r.comparison.bestFit,
          ...r.comparison.strengths,
        ]);
        return typeOk && mfgOk && availOk && releaseOk && queryOk;
      });
  }, [robots, type, mfg, avail, release, query, manufacturers]);
  const releaseOptions: Array<{ value: 'active' | 'pre'; label: string }> = [
    { value: 'active', label: `[ ${filtered.length} ACTIVE MODELS ]` },
    { value: 'pre', label: 'PRE-RELEASE' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <Breadcrumbs items={[{ label: 'Robots' }]} />

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Robots</h1>
          <p className="text-sm text-neutral-600 max-w-3xl">
            導入判断に必要なヒューマノイド機種のカタログ。メーカー、国内入手性、提供段階で絞り込み、現場に合う候補を探せます。
          </p>
        </div>

        <div className="mb-6 max-w-2xl">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="機種名・メーカー・用途キーワードで検索"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <FilterSelect
            id="robot-type"
            label="ROBOT TYPE"
            value={type}
            onChange={setType}
            options={typeOptions}
          />
          <FilterSelect
            id="robot-manufacturer"
            label="MANUFACTURER"
            value={mfg}
            onChange={setMfg}
            options={manufacturerOptions}
          />
          <FilterSelect
            id="robot-availability"
            label="AVAILABILITY"
            value={avail}
            onChange={setAvail}
            options={availabilityOptions}
          />
        </div>

        <div className="flex items-center justify-between mb-6">
          <FilterChipGroup
            options={releaseOptions}
            value={release}
            onChange={setRelease}
            ariaLabel="Release status"
            buttonClassName="px-3 py-1.5 text-xs uppercase tracking-wide"
          />
          <div className="text-xs text-neutral-500">Sort by: Latest Release</div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            message="条件に合う機種がありません。フィルタを調整してください。"
            variant="muted"
            size="large"
          />
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {filtered.map((robot) => {
              const manufacturer = manufacturerFor(robot.manufacturerSlug);
              return (
                <RobotCard
                  key={robot.slug}
                  robot={robot}
                  manufacturerName={manufacturer?.name ?? robot.manufacturerSlug}
                  manufacturerLogo={manufacturer?.logo}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
