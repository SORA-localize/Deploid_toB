export type TagKind = 'report' | 'guide-topic' | 'industry' | 'task';

export interface TagRegistryEntry {
  kind: TagKind;
  value: string;
  label: string;
}

export function normalizeTagKey(value: string) {
  return value.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

export const tagRegistry = [
  { kind: 'guide-topic', value: 'decision-variables', label: '判断軸' },
  { kind: 'guide-topic', value: 'tco', label: 'TCO' },
  { kind: 'guide-topic', value: 'safety', label: '安全' },
  { kind: 'guide-topic', value: 'procurement', label: '調達' },
  { kind: 'guide-topic', value: 'poc', label: 'PoC' },
  { kind: 'guide-topic', value: 'kpi', label: 'KPI' },
  { kind: 'guide-topic', value: 'operations', label: '運用' },

  { kind: 'industry', value: 'logistics', label: '物流' },
  { kind: 'industry', value: 'e-commerce', label: 'EC' },
  { kind: 'industry', value: 'manufacturing', label: '製造' },
  { kind: 'industry', value: 'plant', label: '工場' },
  { kind: 'industry', value: 'research', label: '研究' },
  { kind: 'industry', value: 'education', label: '教育' },
  { kind: 'industry', value: 'marketing', label: 'マーケティング' },
  { kind: 'industry', value: 'facility', label: '施設' },

  { kind: 'task', value: 'picking', label: 'ピッキング' },
  { kind: 'task', value: 'material-handling', label: '搬送・マテハン' },
  { kind: 'task', value: 'inspection', label: '検査' },
  { kind: 'task', value: 'patrol', label: '巡回' },
  { kind: 'task', value: 'r-and-d', label: '研究開発' },
  { kind: 'task', value: 'hri', label: 'HRI' },
  { kind: 'task', value: 'control', label: '制御' },
  { kind: 'task', value: 'demo', label: 'デモ' },
  { kind: 'task', value: 'exhibition', label: '展示' },

  // ─── industry: 新規追加 ─────────────────────────────────────────
  { kind: 'industry', value: 'healthcare-care',             label: '医療・介護' },
  { kind: 'industry', value: 'hospitality',                 label: 'ホテル・接客' },
  { kind: 'industry', value: 'retail',                      label: '小売・店舗' },
  { kind: 'industry', value: 'construction-infrastructure', label: '建設・インフラ' },
  { kind: 'industry', value: 'agriculture',                 label: '農業・食品生産' },
  { kind: 'industry', value: 'public-sector',               label: '公共・行政' },

  // ─── task: 新規追加 ─────────────────────────────────────────────
  { kind: 'task', value: 'assembly',            label: '組立・取付' },
  { kind: 'task', value: 'quality-inspection',  label: '品質検査' },
  { kind: 'task', value: 'cleaning',            label: '清掃・衛生管理' },
  { kind: 'task', value: 'physical-assistance', label: '身体介助' },
  { kind: 'task', value: 'shelf-stocking',      label: '棚補充' },
  { kind: 'task', value: 'customer-service',    label: '接客・案内' },
  { kind: 'task', value: 'agricultural-work',   label: '農作業' },
  { kind: 'task', value: 'disaster-response',   label: '災害対応' },

  { kind: 'report', value: 'manufacturing', label: '製造' },
  { kind: 'report', value: 'poc', label: 'PoC' },
  { kind: 'report', value: 'figure', label: 'Figure AI' },
  { kind: 'report', value: 'bmw', label: 'BMW' },
  { kind: 'report', value: 'logistics', label: '物流' },
  { kind: 'report', value: 'raas', label: 'RaaS' },
  { kind: 'report', value: 'agility', label: 'Agility Robotics' },
  { kind: 'report', value: 'gxo', label: 'GXO' },
  { kind: 'report', value: '1x', label: '1X' },
  { kind: 'report', value: 'consumer', label: '消費者向け' },
  { kind: 'report', value: 'subscription', label: 'サブスク' },
  { kind: 'report', value: 'apptronik', label: 'Apptronik' },
  { kind: 'report', value: 'mercedes-benz', label: 'Mercedes-Benz' },
  { kind: 'report', value: 'commercial', label: '商用化' },
  { kind: 'report', value: 'unitree', label: 'Unitree' },
  { kind: 'report', value: 'pricing', label: '価格' },
  { kind: 'report', value: 'research', label: '研究' },
] as const satisfies readonly TagRegistryEntry[];

const tagByKindAndKey = new Map(
  tagRegistry.map((entry) => [`${entry.kind}:${normalizeTagKey(entry.value)}`, entry]),
);

const tagByKey = new Map<string, TagRegistryEntry>();
tagRegistry.forEach((entry) => {
  const key = normalizeTagKey(entry.value);
  if (!tagByKey.has(key)) tagByKey.set(key, entry);
});

export function getRegisteredTag(kind: TagKind, value: string) {
  return tagByKindAndKey.get(`${kind}:${normalizeTagKey(value)}`);
}

export function getAnyRegisteredTag(value: string) {
  return tagByKey.get(normalizeTagKey(value));
}

export function isRegisteredTag(kind: TagKind, value: string) {
  return Boolean(getRegisteredTag(kind, value));
}
