import type { Report } from './types';

export const reports: Report[] = [
  {
    slug: 'bmw-figure-deployment',
    title: 'BMW and Figure deployment note',
    titleJa: 'BMWとFigureの実証から見る製造現場PoCの論点',
    type: 'deployment-report',
    summary: 'Figureの製造現場実証を、日本企業のPoC設計という視点で読むためのメモ。',
    publishStatus: 'published',
    updatedAt: '2026-05-27',
    reliability: 'reported',
    publishedAt: '2026-05-27',
    author: 'Deploid Research',
    tags: ['manufacturing', 'poc', 'figure'],
    whyItMatters:
      '日本の製造業がヒューマノイドを検討する際、作業選定、現場分離、評価KPI、保守責任をどう設計するかの参考になる。',
    keyTakeaways: ['PoCの作業範囲を狭くする', '現場安全と停止手順を先に決める', '外販可否と保守体制は別論点'],
    featured: true,
    relatedRobotSlugs: ['figure-02'],
    relatedManufacturerSlugs: ['figure-ai'],
    relatedUseCaseSlugs: ['warehouse-picking', 'factory-inspection'],
    relatedGuideSlugs: ['decision-variables', 'poc-planning'],
    sources: [
      {
        title: 'Figure AI official website',
        url: 'https://www.figure.ai/',
        publisher: 'Figure AI',
        checkedAt: '2026-05-27',
        reliability: 'official',
      },
    ],
  },
  {
    slug: 'unitree-market-note',
    title: 'Unitree market note',
    titleJa: 'Unitree G1を日本企業が見るときの確認ポイント',
    type: 'analysis',
    summary: '価格訴求の強いヒューマノイドを、研究・PoC・本番運用のどの文脈で見るべきか整理する。',
    publishStatus: 'published',
    updatedAt: '2026-05-27',
    reliability: 'reported',
    publishedAt: '2026-05-27',
    author: 'Deploid Research',
    tags: ['unitree', 'pricing', 'research'],
    whyItMatters:
      '低価格帯の機体は検討入口になりやすいが、買えることと本番運用できることは別の問題として扱う必要がある。',
    relatedRobotSlugs: ['unitree-g1'],
    relatedManufacturerSlugs: ['unitree'],
    relatedUseCaseSlugs: ['research-development', 'demo-exhibition'],
    relatedGuideSlugs: ['decision-variables'],
    sources: [
      {
        title: 'Unitree G1 official page',
        url: 'https://www.unitree.com/g1/',
        publisher: 'Unitree Robotics',
        checkedAt: '2026-05-27',
        reliability: 'official',
      },
    ],
  },
];
