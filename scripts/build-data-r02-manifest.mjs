import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { robots } from '../data/robots.ts';
import { useCases } from '../data/useCases.ts';
import { specSchema } from '../lib/specSchema.ts';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(rootDir, 'docs', 'data');
const schemaVersion = 'DATA-R02-implementation-v1';
const expectedRobotCount = 61;
const supportedSpecKeys = new Set(specSchema.map(({ key }) => key));
const specKindByKey = new Map(specSchema.map(({ key, kind }) => [key, kind]));
const mobilityValues = new Set(['biped', 'wheeled', 'wheel-legged', 'hybrid', 'stationary', 'unknown']);
const officialSourceTypes = new Set([
  'official',
  'official-product',
  'official-product-page',
  'official-sdk',
  'manufacturer-official',
]);
const approvedStatusProposals = new Map([
  ['agibot-a2-max', { publishStatus: 'draft', supersededById: null }],
  ['fourier-gr1', { publishStatus: 'archived', supersededById: 'fourier-gr2' }],
  ['fourier-gr2', { publishStatus: 'archived', supersededById: 'fourier-gr3' }],
  ['apptronik-apollo', { publishStatus: 'archived', supersededById: 'apptronik-apollo-2' }],
]);

const robotById = new Map(robots.map((robot) => [robot.id, robot]));
const useCaseById = new Map(useCases.map((useCase) => [useCase.id, useCase]));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function equal(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function variantMatches(identity, variant) {
  if (!variant) return true;
  const expected = normalizeText(identity.variant);
  const actual = normalizeText(variant);
  return Boolean(expected && actual && (expected.includes(actual) || actual.includes(expected)));
}

function canUseEvidence(identity, evidence) {
  if (!evidence?.sourceUrl) return { ok: false, action: 'hold-source-inaccessible', reason: '出典URLがない。' };
  if (!officialSourceTypes.has(evidence.sourceType)) {
    return { ok: false, action: 'hold-source-inaccessible', reason: '公式一次資料として分類されていない。' };
  }
  if (evidence.evidenceScope === 'current-product' || evidence.evidenceScope === 'current-family-common') {
    return { ok: true };
  }
  if (evidence.evidenceScope === 'variant-specific') {
    if (identity.recordScope !== 'specific-variant') {
      return { ok: false, action: 'hold-variant', reason: 'ファミリーrecordへvariant固有値を集約できない。' };
    }
    if (!variantMatches(identity, evidence.variant)) {
      return { ok: false, action: 'hold-variant', reason: '資料variantと登録variantが一致しない。' };
    }
    return { ok: true };
  }
  return { ok: false, action: 'hold-variant', reason: '現在製品／現在ファミリー共通／一致variantのいずれにも該当しない。' };
}

function hasSchemaCompatibleValue(key, value) {
  const kind = specKindByKey.get(key);
  if (kind === 'number' || kind === 'runtime') return typeof value === 'number' && Number.isFinite(value);
  if (kind === 'mobility') return mobilityValues.has(value);
  if (kind === 'text') return typeof value === 'string' && value.trim().length > 0;
  return false;
}

function hasSchemaCompatibleMeaning(key, evidence) {
  if (key !== 'dof') return true;
  const rawUnit = String(evidence.rawUnit ?? '');
  const rawValue = String(evidence.value ?? '');
  // 「自由度」は現行schemaではロボット全体の単一値として表示される。
  // 片腕ごとのDoFをここへ入れると、全身自由度であるかのように誤読される。
  return !(/dof\s*\/\s*arm/i.test(rawUnit) || /\beach\s+arm\b/i.test(rawValue));
}

function sourceCandidate(evidence, robot) {
  return {
    title: evidence.sourceTitle || `${robot.name} official source`,
    url: evidence.sourceUrl,
    publisher: evidence.publisher || undefined,
    publishedAt: evidence.publishedAt || undefined,
    checkedAt: evidence.checkedAt || robot.updatedAt,
    reliability: 'official',
  };
}

function sourceStatus(robot, candidate) {
  const existing = robot.sources.find((source) => source.url === candidate.url);
  if (existing) return { action: 'preserve', status: 'existing', existingSource: existing };
  return {
    action: 'add-source',
    status: 'add-after-review',
    candidateSource: candidate,
    reviewReason: 'R02の出典メタデータを人間確認してRobot.sourcesへ追加する。',
  };
}

function specAction(result, robot) {
  const currentValue = robot.specs[result.key];
  if (result.status === 'found') {
    const evidenceCheck = canUseEvidence(result.identity, result.evidence);
    if (!evidenceCheck.ok) return { action: evidenceCheck.action, reason: evidenceCheck.reason };
    if (!supportedSpecKeys.has(result.key)) return { action: 'unsupported-schema', reason: '現行specSchemaにキーがない。' };
    if (!hasSchemaCompatibleValue(result.key, result.evidence.normalizedValue)) {
      return { action: 'unsupported-schema', reason: 'R02の正規化値が現行specSchemaの値型に適合しない。分割・型拡張・人間確認が必要。' };
    }
    if (!hasSchemaCompatibleMeaning(result.key, result.evidence)) {
      return { action: 'unsupported-schema', reason: '片腕ごとのDoFであり、全身の自由度として表示する現行schemaへは投影できない。' };
    }
    if (equal(currentValue, result.evidence.normalizedValue)) return { action: 'preserve', reason: '現行値とR02正規化値が一致する。' };
    return { action: 'set', reason: '現在の公式一次資料・型・variant条件を満たす。' };
  }
  if (result.status === 'not-published' || result.status === 'not-applicable') {
    return currentValue === undefined
      ? { action: 'preserve', reason: '現行値も未設定であり、消去操作は不要。' }
      : { action: 'clear-after-review', reason: 'R02で現行一次資料の非掲載を確認。既存値の世代・出典を人間確認後にのみ消去する。' };
  }
  if (result.status === 'conflict') return { action: 'hold-conflict', reason: '一次資料間または資料と登録対象の競合を解消していない。' };
  if (result.status === 'source-inaccessible') return { action: 'hold-source-inaccessible', reason: '一次資料本文を再取得できない。' };
  if (result.status === 'needs-review') return { action: 'hold-variant', reason: 'R02がvariant・identityの人間確認を要求している。' };
  return { action: 'unsupported-schema', reason: `未知のR02 status: ${result.status}` };
}

function buildSpecChanges(record, robot) {
  const changes = [];
  for (const entry of specSchema) {
    const result = record.specs[entry.key];
    assert(result, `${record.robotId}: missing R02 spec ${entry.key}`);
    const decision = specAction({ ...result, key: entry.key, identity: record.identity }, robot);
    changes.push({
      key: entry.key,
      status: result.status,
      action: decision.action,
      reason: decision.reason,
      currentValue: robot.specs[entry.key] ?? null,
      proposedValue: result.status === 'found' ? result.evidence.normalizedValue : null,
      evidence: result.status === 'found' ? result.evidence : undefined,
      source: result.status === 'found' ? sourceStatus(robot, sourceCandidate(result.evidence, robot)) : undefined,
    });
  }
  return changes;
}

function buildPriceChanges(record, robot) {
  if (!record.priceOffers?.length) {
    return { action: 'preserve', candidates: [], reason: 'R02に公開価格候補がない。価格fallbackは保存しない。' };
  }
  const candidates = record.priceOffers.map((offer) => {
    const variantOK = variantMatches(record.identity, offer.variant);
    const structurallyValid = typeof offer.display === 'string' && typeof offer.sourceUrl === 'string';
    const action = variantOK && structurallyValid && record.identity.lifecycleStatus === 'current' ? 'set' : 'hold-variant';
    const proposedValue = {
      channel: offer.channel,
      display: offer.display,
      ...(typeof offer.amount === 'number' ? { amount: offer.amount } : {}),
      ...(offer.currency ? { currency: offer.currency } : {}),
      ...(offer.taxStatus ? { taxStatus: offer.taxStatus } : {}),
      ...(offer.variant ? { variant: offer.variant } : {}),
      ...(offer.sellerName ? { sellerName: offer.sellerName } : {}),
      sourceUrl: offer.sourceUrl,
    };
    return {
      action,
      reason: action === 'set' ? '現行specific-variantの公開価格候補。' : 'variantまたはlifecycleの確認が必要。',
      currentValue: robot.priceOffers?.find((current) => current.sourceUrl === offer.sourceUrl) ?? null,
      proposedValue,
      source: sourceStatus(robot, {
        title: `${robot.name} price page`, url: offer.sourceUrl, publisher: offer.sellerName, checkedAt: robot.updatedAt, reliability: 'official',
      }),
    };
  });
  return { action: candidates.some((candidate) => candidate.action === 'set') ? 'set' : 'hold-variant', candidates };
}

function buildLoadChanges(record, robot) {
  if (!record.loadRatings?.length) return { action: 'preserve', candidates: [], reason: 'R02に荷重候補がない。' };
  const candidates = record.loadRatings.map((rating) => {
    const valid = typeof rating.kg === 'number' && typeof rating.sourceUrl === 'string' && variantMatches(record.identity, rating.variant);
    const action = valid && record.identity.lifecycleStatus === 'current' ? 'set' : 'hold-variant';
    return {
      action,
      reason: action === 'set' ? '対象範囲・rating・条件が分離された現行荷重候補。' : 'variantまたはlifecycleの確認が必要。',
      proposedValue: rating,
      source: sourceStatus(robot, { title: `${robot.name} load specification`, url: rating.sourceUrl, checkedAt: robot.updatedAt, reliability: 'official' }),
    };
  });
  return { action: candidates.some((candidate) => candidate.action === 'set') ? 'set' : 'hold-variant', candidates };
}

function buildProcurementChanges(record, robot) {
  const procurement = record.procurement ?? {};
  const supported = ['procurementModels', 'marketAvailability', 'japanAvailability', 'distributorJapan', 'supportNote'];
  const changes = Object.entries(procurement).map(([field, value]) => {
    if (!supported.includes(field)) {
      return { field, action: 'unsupported-schema', currentValue: null, proposedValue: value, reason: 'R02の補助構造であり現行Robot fieldへ直接投影できない。' };
    }
    return {
      field,
      action: 'hold-source-inaccessible',
      currentValue: robot[field] ?? null,
      proposedValue: value,
      reason: 'R02 procurement値にはfieldEvidence対象外のため、一次資料URLと表示文を人間が紐付けるまで反映しない。',
    };
  });
  return changes.length ? changes : [{ field: null, action: 'preserve', currentValue: null, proposedValue: null, reason: 'R02に調達候補がない。' }];
}

function buildUseCaseChanges(record, robot) {
  return (record.officialUseCases ?? []).map((candidate) => {
    const useCase = useCaseById.get(candidate.useCaseId);
    const evidenceCheck = canUseEvidence(record.identity, {
      sourceUrl: candidate.evidenceSourceUrl,
      sourceType: 'official',
      evidenceScope: candidate.evidenceScope,
      variant: candidate.variant,
    });
    if (!useCase) return { ...candidate, action: 'unsupported-schema', reason: 'useCases.tsに対象IDがない。' };
    if (!evidenceCheck.ok) return { ...candidate, action: evidenceCheck.action, reason: evidenceCheck.reason };
    const existing = useCase.candidateRobots.find((item) => item.robotId === robot.id);
    return {
      ...candidate,
      action: existing ? 'merge-use-case-relation' : 'set',
      reason: existing
        ? `既存relation（${existing.basis}）を保持し、公式根拠URLのみ併合候補にする。`
        : '現在公式資料による用途relation追加候補。',
      existingRelation: existing ?? null,
      source: sourceStatus(robot, { title: `${robot.name} official use-case source`, url: candidate.evidenceSourceUrl, checkedAt: robot.updatedAt, reliability: 'official' }),
    };
  });
}

function buildUsageChanges(record, robot) {
  const candidates = (record.usageExamples ?? []).map((example) => {
    const actionable = record.identity.lifecycleStatus === 'current' && variantMatches(record.identity, example.variant);
    return {
      ...example,
      action: actionable ? 'replace-usage-example-urls' : 'hold-variant',
      reason: actionable
        ? '最大3件の既存Source URLだけを最終登録できる候補。Sourceメタデータの人間確認は別途必要。'
        : '現行モデルとのvariantまたはlifecycle一致を確認できない。',
      source: sourceStatus(robot, { title: `${robot.name} usage example`, url: example.evidenceSourceUrl, checkedAt: robot.updatedAt, reliability: 'reported' }),
    };
  });
  return { action: candidates.some((candidate) => candidate.action === 'replace-usage-example-urls') ? 'replace-usage-example-urls' : 'preserve', candidates: candidates.slice(0, 3) };
}

function buildStatusProposal(record, robot) {
  const approved = approvedStatusProposals.get(record.robotId);
  if (!approved) return { action: 'preserve', currentPublishStatus: robot.publishStatus, proposal: null };
  return {
    action: 'publish-status-proposal',
    currentPublishStatus: robot.publishStatus,
    proposal: approved,
    reason: 'DATA-R02-decisions.mdで人間承認済み。R02-02では実データを変更しない。',
  };
}

function countActions(value, counts = {}) {
  if (Array.isArray(value)) value.forEach((item) => countActions(item, counts));
  else if (value && typeof value === 'object') {
    if (typeof value.action === 'string') counts[value.action] = (counts[value.action] ?? 0) + 1;
    Object.values(value).forEach((item) => countActions(item, counts));
  }
  return counts;
}

async function main() {
  const files = (await readdir(dataDir)).filter((file) => /^DATA-R02-B\d{2}\.json$/.test(file)).sort();
  assert(files.length === 10, `Expected 10 R02 batch files; found ${files.length}`);
  const records = [];
  for (const file of files) {
    const batch = file.match(/B\d{2}/)[0];
    const content = JSON.parse(await readFile(path.join(dataDir, file), 'utf8'));
    assert(Array.isArray(content), `${file} must be an array`);
    records.push(...content.map((record) => ({ ...record, batch })));
  }
  assert(records.length === expectedRobotCount, `Expected ${expectedRobotCount} robots; found ${records.length}`);
  assert(new Set(records.map((record) => record.robotId)).size === records.length, 'Duplicate R02 robot IDs');

  const manifestsByBatch = new Map();
  for (const record of records) {
    const robot = robotById.get(record.robotId);
    assert(robot, `R02 robot not found in data/robots.ts: ${record.robotId}`);
    const manifest = {
      schemaVersion,
      batch: record.batch,
      robotId: record.robotId,
      identity: record.identity,
      specs: buildSpecChanges(record, robot),
      priceOffers: buildPriceChanges(record, robot),
      loadRatings: buildLoadChanges(record, robot),
      procurement: buildProcurementChanges(record, robot),
      officialUseCases: buildUseCaseChanges(record, robot),
      usageExamples: buildUsageChanges(record, robot),
      currentFeatures: (record.currentFeatures ?? []).map((feature) => ({ ...feature, action: 'unsupported-schema', reason: 'currentFeaturesは現行Robot schemaにないため、aeo pilot後の別設計で扱う。' })),
      publishStatus: buildStatusProposal(record, robot),
      humanReviewRequired: record.humanReviewRequired ?? [],
    };
    assert(manifest.specs.length === specSchema.length, `${record.robotId}: spec coverage incomplete`);
    manifestsByBatch.set(record.batch, [...(manifestsByBatch.get(record.batch) ?? []), manifest]);
  }

  const allManifests = [...manifestsByBatch.values()].flat();
  const actionCounts = countActions(allManifests);
  for (const [batch, manifests] of manifestsByBatch) {
    await writeFile(path.join(dataDir, `DATA-R02-IMPLEMENT-${batch}.json`), `${JSON.stringify(manifests, null, 2)}\n`);
  }
  const report = [
    '# DATA-R02 implementation manifest report',
    '',
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    '',
    '## Scope',
    '',
    `- R02 records: ${allManifests.length} / expected ${expectedRobotCount}`,
    `- Spec decisions: ${allManifests.length * specSchema.length} / expected ${allManifests.length * specSchema.length}`,
    '- This is a planning artifact only: no `data/*.ts`, UI, media, or publish status has changed.',
    '- `set` means eligible for a reviewed implementation patch; it is not an automatic update.',
    '',
    '## Action counts',
    '',
    ...Object.entries(actionCounts).sort(([a], [b]) => a.localeCompare(b)).map(([action, count]) => `- ${action}: ${count}`),
    '',
    '## Guardrails',
    '',
    '- Only current official evidence with a matching identity can become a `set` candidate.',
    '- Family records never absorb variant-specific scalar values.',
    '- `not-published` never deletes an existing value automatically.',
    '- Price and usage examples still require the referenced URL to exist in `Robot.sources` before implementation.',
    '- Procurement and `currentFeatures` are held when the present schema cannot preserve the evidence without loss.',
    '- Approved lifecycle decisions remain proposals here; publish-status changes are a separate reviewed patch.',
    '',
    '## Output',
    '',
    '- `DATA-R02-IMPLEMENT-B01.json` through `DATA-R02-IMPLEMENT-B10.json`',
    '- Regenerate with `npm run build:data-r02-manifest`.',
    '',
  ].join('\n');
  await writeFile(path.join(dataDir, 'DATA-R02-implementation-report.md'), report);
  console.log(`Built R02 implementation manifests for ${allManifests.length} robots.`);
}

await main();
