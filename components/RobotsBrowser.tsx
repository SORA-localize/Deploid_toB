'use client';

import { useMemo, useState } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
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

  const manufacturerName = (slug: string) =>
    manufacturers.find((m) => m.slug === slug)?.name ?? slug;

  const types = useMemo(() => Array.from(new Set(robots.map((r) => r.category))), [robots]);
  const avails = useMemo(
    () => Array.from(new Set(robots.map((r) => r.japanAvailability))),
    [robots],
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
          <div>
            <label className="block text-xs uppercase tracking-wide text-neutral-500 mb-2">ROBOT TYPE</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 bg-white text-sm text-neutral-900 focus:outline-none focus:border-neutral-500"
            >
              <option value="all">All Types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {categoryLabels[t] ?? t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-neutral-500 mb-2">MANUFACTURER</label>
            <select
              value={mfg}
              onChange={(e) => setMfg(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 bg-white text-sm text-neutral-900 focus:outline-none focus:border-neutral-500"
            >
              <option value="all">All Manufacturers</option>
              {manufacturers.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-neutral-500 mb-2">AVAILABILITY</label>
            <select
              value={avail}
              onChange={(e) => setAvail(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 bg-white text-sm text-neutral-900 focus:outline-none focus:border-neutral-500"
            >
              <option value="all">All Status</option>
              {avails.map((a) => (
                <option key={a} value={a}>
                  {japanAvailabilityLabels[a]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setRelease('active')}
              className={`px-3 py-1.5 border border-neutral-300 uppercase tracking-wide ${
                release === 'active'
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              [ {filtered.length} ACTIVE MODELS ]
            </button>
            <button
              onClick={() => setRelease('pre')}
              className={`px-3 py-1.5 border border-neutral-300 uppercase tracking-wide ${
                release === 'pre'
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              PRE-RELEASE
            </button>
          </div>
          <div className="text-xs text-neutral-500">Sort by: Latest Release</div>
        </div>

        {filtered.length === 0 ? (
          <div className="border border-neutral-300 bg-neutral-50 p-16 text-center text-sm text-neutral-500">
            条件に合う機種がありません。フィルタを調整してください。
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {filtered.map((robot) => (
              <RobotCard
                key={robot.slug}
                robot={robot}
                manufacturerName={manufacturerName(robot.manufacturerSlug)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
