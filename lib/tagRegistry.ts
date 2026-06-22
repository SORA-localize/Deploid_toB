export type TagKind = 'article' | 'guide-topic' | 'industry' | 'task' | 'use-case-domain';

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

  { kind: 'industry', value: 'manufacturing', label: '製造' },
  { kind: 'industry', value: 'logistics', label: '物流' },
  { kind: 'industry', value: 'healthcare-care', label: '医療・介護' },
  { kind: 'industry', value: 'retail', label: '小売・店舗' },
  { kind: 'industry', value: 'hospitality', label: 'ホテル・接客' },
  { kind: 'industry', value: 'construction-infrastructure', label: '建設・インフラ' },
  { kind: 'industry', value: 'agriculture', label: '農業・食品生産' },
  { kind: 'industry', value: 'public-sector', label: '公共・行政' },
  { kind: 'industry', value: 'research', label: '研究' },
  { kind: 'industry', value: 'education', label: '教育' },
  { kind: 'industry', value: 'e-commerce', label: 'EC' },
  { kind: 'industry', value: 'plant', label: '工場' },
  { kind: 'industry', value: 'facility', label: '施設' },
  { kind: 'industry', value: 'marketing', label: 'マーケティング' },

  { kind: 'task', value: 'material-handling', label: '搬送・マテハン' },
  { kind: 'task', value: 'picking', label: 'ピッキング' },
  { kind: 'task', value: 'shelf-stocking', label: '棚補充' },
  { kind: 'task', value: 'assembly', label: '組立・取付' },
  { kind: 'task', value: 'quality-inspection', label: '品質検査' },
  { kind: 'task', value: 'inspection', label: '検査' },
  { kind: 'task', value: 'cleaning', label: '清掃・衛生管理' },
  { kind: 'task', value: 'customer-service', label: '接客・案内' },
  { kind: 'task', value: 'physical-assistance', label: '身体介助' },
  { kind: 'task', value: 'agricultural-work', label: '農作業' },
  { kind: 'task', value: 'disaster-response', label: '災害対応' },
  { kind: 'task', value: 'patrol', label: '巡回' },
  { kind: 'task', value: 'r-and-d', label: '研究開発' },
  { kind: 'task', value: 'hri', label: 'HRI' },
  { kind: 'task', value: 'control', label: '制御' },
  { kind: 'task', value: 'demo', label: 'デモ' },
  { kind: 'task', value: 'exhibition', label: '展示' },

  // UseCase.primaryDomain/secondaryDomains の正本。industry/taskと違いMECEを意図した分類
  // （業界横断で「ロボットに何をさせるか」を9つに分ける）。検索ファセットのindustry/taskとは役割が別。
  { kind: 'use-case-domain', value: 'move-goods', label: '物を動かす' },
  { kind: 'use-case-domain', value: 'manipulate-and-assemble', label: '物を加工・組立・操作する' },
  { kind: 'use-case-domain', value: 'inspect-and-record', label: '状態を見て記録する' },
  { kind: 'use-case-domain', value: 'clean-and-maintain', label: '場を整える' },
  { kind: 'use-case-domain', value: 'communicate-with-people', label: '人に応対する' },
  { kind: 'use-case-domain', value: 'assist-human-body', label: '人の身体行為を支える' },
  { kind: 'use-case-domain', value: 'hazardous-or-remote-work', label: '危険・遠隔環境で代替する' },
  { kind: 'use-case-domain', value: 'research-education', label: '技術・人材を育てる' },
  { kind: 'use-case-domain', value: 'demo-entertainment', label: '体験・認知を作る' },

  { kind: 'article', value: 'manufacturing', label: '製造' },
  { kind: 'article', value: 'poc', label: 'PoC' },
  { kind: 'article', value: 'figure', label: 'Figure AI' },
  { kind: 'article', value: 'bmw', label: 'BMW' },
  { kind: 'article', value: 'logistics', label: '物流' },
  { kind: 'article', value: 'raas', label: 'RaaS' },
  { kind: 'article', value: 'agility', label: 'Agility Robotics' },
  { kind: 'article', value: 'gxo', label: 'GXO' },
  { kind: 'article', value: '1x', label: '1X' },
  { kind: 'article', value: 'consumer', label: '消費者向け' },
  { kind: 'article', value: 'subscription', label: 'サブスク' },
  { kind: 'article', value: 'apptronik', label: 'Apptronik' },
  { kind: 'article', value: 'mercedes-benz', label: 'Mercedes-Benz' },
  { kind: 'article', value: 'commercial', label: '商用化' },
  { kind: 'article', value: 'unitree', label: 'Unitree' },
  { kind: 'article', value: 'pricing', label: '価格' },
  { kind: 'article', value: 'research', label: '研究' },
  { kind: 'article', value: 'boston-dynamics', label: 'Boston Dynamics' },
  { kind: 'article', value: 'autonomous', label: '自律制御' },
  { kind: 'article', value: 'tesla', label: 'Tesla' },
  { kind: 'article', value: 'optimus', label: 'Optimus' },
  { kind: 'article', value: 'production', label: '量産' },
  { kind: 'article', value: 'policy', label: '政策・規制' },
  { kind: 'article', value: 'japan', label: '日本' },
  { kind: 'article', value: 'regulation', label: '規制' },
  { kind: 'article', value: 'safety', label: '安全' },
  { kind: 'article', value: 'viral', label: 'バイラル' },
  { kind: 'article', value: 'demo', label: 'デモ' },
  { kind: 'article', value: 'series-b', label: 'シリーズB' },
  { kind: 'article', value: 'funding', label: '資金調達' },
  { kind: 'article', value: 'amazon', label: 'Amazon' },
  { kind: 'article', value: 'deployment', label: '導入' },
  { kind: 'article', value: 'market', label: '市場' },
  { kind: 'article', value: 'analysis', label: '分析' },
  { kind: 'article', value: 'forecast', label: '予測' },
  { kind: 'article', value: 'nvidia', label: 'NVIDIA' },
  { kind: 'article', value: 'agibot', label: 'AGIBOT' },
  { kind: 'article', value: 'china', label: '中国' },
  { kind: 'article', value: 'ipo', label: 'IPO' },
  { kind: 'article', value: 'robotera', label: 'RobotEra' },
  { kind: 'article', value: 'dobot', label: 'DOBOT' },
  { kind: 'article', value: 'vietnam', label: 'ベトナム' },
  { kind: 'article', value: 'genesis-ai', label: 'Genesis AI' },
  { kind: 'article', value: 'j-hrti', label: 'J-HRTI' },
  { kind: 'article', value: 'physical-ai', label: 'フィジカルAI' },
] as const satisfies readonly TagRegistryEntry[];

export type RegisteredTag = (typeof tagRegistry)[number];
export type TagValue<K extends TagKind> = Extract<RegisteredTag, { kind: K }>['value'];

const tagByKindAndKey = new Map(
  tagRegistry.map((entry) => [`${entry.kind}:${normalizeTagKey(entry.value)}`, entry]),
);

const tagDisplayIndexByKindAndKey = new Map(
  tagRegistry.map((entry, index) => [`${entry.kind}:${normalizeTagKey(entry.value)}`, index] as const),
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

export function getTagDisplayIndex(kind: TagKind, value: string) {
  return (
    tagDisplayIndexByKindAndKey.get(`${kind}:${normalizeTagKey(value)}`) ??
    Number.MAX_SAFE_INTEGER
  );
}
