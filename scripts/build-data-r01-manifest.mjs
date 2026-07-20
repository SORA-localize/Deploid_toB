import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { manufacturers } from '../data/manufacturers.ts';
import { robots } from '../data/robots.ts';
import { useCases } from '../data/useCases.ts';
import { specSchema } from '../lib/specSchema.ts';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(rootDir, 'docs', 'data');
const acceptedStatuses = new Set(['verified', 'corrected']);
const expectedBatchCount = 14;
const manifestSchemaVersion = 'DATA-R01-implementation-v1';

const robotById = new Map(robots.map((robot) => [robot.id, robot]));
const manufacturerById = new Map(manufacturers.map((manufacturer) => [manufacturer.id, manufacturer]));
const useCaseById = new Map(useCases.map((useCase) => [useCase.id, useCase]));
const specEntryByKey = new Map(specSchema.map((entry) => [entry.key, entry]));
const expectedFieldKeys = specSchema.map((entry) => entry.key).sort();

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function hasAcceptedValue(record, { requireVariant = true } = {}) {
  return Boolean(
    record &&
      acceptedStatuses.has(record.verificationStatus) &&
      record.proposedValue !== null &&
      record.proposedValue !== undefined &&
      (!requireVariant || record.variantConfirmed === true),
  );
}

function isVerifiedAbsent(record) {
  return Boolean(
    record &&
      acceptedStatuses.has(record.verificationStatus) &&
      record.rawStatus === 'not-published' &&
      record.proposedValue == null &&
      record.variantConfirmed === true,
  );
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function compareValue(currentValue, proposedValue) {
  if (currentValue === undefined) return 'add';
  return deepEqual(currentValue, proposedValue) ? 'unchanged' : 'update';
}

function createSourceRequirementStore() {
  const requirements = new Map();

  return {
    add(url, usedBy, candidate = undefined) {
      if (!url) return;
      const existing = requirements.get(url) ?? { url, usedBy: [], candidates: [] };
      existing.usedBy = unique([...existing.usedBy, usedBy]);
      if (candidate && !existing.candidates.some((current) => deepEqual(current, candidate))) {
        existing.candidates.push(candidate);
      }
      requirements.set(url, existing);
    },
    values() {
      return [...requirements.values()];
    },
  };
}

function chooseSourceCandidate(requirement, context) {
  const existingSource = context.existingSources.get(requirement.url);
  if (existingSource) {
    const proposedCheckedAt = requirement.candidates
      .map((candidate) => candidate.checkedAt)
      .filter(Boolean)
      .sort()
      .at(-1);
    return {
      ...requirement,
      status: 'existing',
      existingSource,
      action:
        proposedCheckedAt && proposedCheckedAt > existingSource.checkedAt
          ? 'refresh-checkedAt'
          : 'unchanged',
      proposedCheckedAt: proposedCheckedAt ?? existingSource.checkedAt,
    };
  }

  const usageCandidate = requirement.candidates.find((candidate) => candidate.kind === 'usage-example');
  if (usageCandidate) {
    return {
      ...requirement,
      status: 'add-after-review',
      candidateSource: {
        title: usageCandidate.title,
        url: requirement.url,
        publisher: usageCandidate.publisher || undefined,
        publishedAt: usageCandidate.publishedAt || undefined,
        checkedAt: usageCandidate.checkedAt,
        reliability: 'reported',
      },
      reviewReason: '活用事例の媒体種別に応じてofficial/reportedを最終確認する。',
    };
  }

  const distributorCandidate = requirement.candidates.find(
    (candidate) => candidate.kind === 'authorized-distributor-price',
  );
  if (distributorCandidate) {
    return {
      ...requirement,
      status: 'add-after-review',
      candidateSource: {
        title: `${distributorCandidate.sellerName} ${context.officialName} price page`,
        url: requirement.url,
        publisher: distributorCandidate.sellerName,
        checkedAt: distributorCandidate.checkedAt,
        reliability: 'official',
      },
      reviewReason: '生成した説明用titleと正規代理店表記を人間が確認する。',
    };
  }

  const officialProductCandidate = requirement.candidates.find(
    (candidate) => candidate.kind === 'official-product',
  );
  const officialCandidate = officialProductCandidate ?? requirement.candidates[0];
  return {
    ...requirement,
    status: 'add-after-review',
    candidateSource: {
      title: officialProductCandidate
        ? `${context.officialName} official product page`
        : `${context.officialName} official source`,
      url: requirement.url,
      publisher: context.manufacturerName,
      checkedAt: officialCandidate?.checkedAt ?? context.checkedAt,
      reliability: 'official',
    },
    reviewReason: officialProductCandidate
      ? '公式製品URLとの一致を確認済み。生成した説明用titleだけを確認する。'
      : 'VERIFYで公式原典として採用済み。生成したtitle/publisherがページ実体に合うか確認する。',
  };
}

function normalizeProcurement(record, currentRobot) {
  const patch = {};
  const clearFields = [];
  const manualCandidates = [];
  const unresolved = [];
  const diffs = {};

  const directShapes = {
    procurementModels: (value) => Array.isArray(value) && value.every((entry) => typeof entry === 'string'),
    marketAvailability: (value) => typeof value === 'string',
    japanAvailability: (value) => typeof value === 'string',
    distributorJapan: (value) => typeof value === 'string',
    supportNote: (value) => typeof value === 'string',
  };

  for (const [field, fieldRecord] of Object.entries(record.procurement ?? {})) {
    if (hasAcceptedValue(fieldRecord)) {
      if (directShapes[field]?.(fieldRecord.proposedValue)) {
        patch[field] = fieldRecord.proposedValue;
        diffs[field] = {
          action: compareValue(currentRobot[field], fieldRecord.proposedValue),
          currentValue: currentRobot[field] ?? null,
          proposedValue: fieldRecord.proposedValue,
        };
      } else if (
        field === 'distributorJapan' &&
        fieldRecord.proposedValue?.status === 'not-published'
      ) {
        if (currentRobot.distributorJapan !== undefined) clearFields.push(field);
        diffs[field] = {
          action: currentRobot.distributorJapan === undefined ? 'unchanged' : 'remove',
          currentValue: currentRobot.distributorJapan ?? null,
          proposedValue: null,
        };
      } else {
        manualCandidates.push({
          field,
          candidate: fieldRecord.proposedValue,
          sourceUrls: unique(fieldRecord.sourceUrls ?? [fieldRecord.sourceUrl]),
          reason: '現行Robot fieldへ意味を失わず直接投影できないため、人間が短い表示値へ編集する。',
        });
      }
    } else if (fieldRecord?.verificationStatus === 'unresolved') {
      unresolved.push({
        field,
        rawValue: fieldRecord.rawValue,
        sourceUrls: unique(fieldRecord.sourceUrls ?? [fieldRecord.sourceUrl]),
        reason: fieldRecord.reason,
        currentValue: currentRobot[field] ?? null,
      });
    }
  }

  return { patch, clearFields, manualCandidates, unresolved, diffs };
}

function sourceCandidateForField(record, identity) {
  return {
    kind: record.sourceUrl === identity.officialProductUrl ? 'official-product' : 'official-evidence',
    checkedAt: record.checkedAt,
  };
}

function buildRobotManifest(verifiedRobot, batch, seenRobotIds) {
  const { robotId } = verifiedRobot;
  assert(!seenRobotIds.has(robotId), `Duplicate VERIFY robot: ${robotId}`);
  seenRobotIds.add(robotId);

  const currentRobot = robotById.get(robotId);
  assert(currentRobot, `VERIFY robot does not exist in data/robots.ts: ${robotId}`);
  assert(currentRobot.publishStatus === 'published', `VERIFY robot is not published: ${robotId}`);
  assert(currentRobot.manufacturerId === verifiedRobot.manufacturerId, `Manufacturer mismatch: ${robotId}`);

  const actualFieldKeys = Object.keys(verifiedRobot.fields ?? {}).sort();
  assert(deepEqual(actualFieldKeys, expectedFieldKeys), `Spec field set mismatch: ${robotId}`);

  const identity = verifiedRobot.identityVerification;
  const identityReady = Boolean(
    identity &&
      acceptedStatuses.has(identity.verificationStatus) &&
      identity.variantConfirmed === true &&
      identity.officialProductUrl,
  );
  const manufacturer = manufacturerById.get(verifiedRobot.manufacturerId);
  assert(manufacturer, `Manufacturer does not exist: ${verifiedRobot.manufacturerId}`);

  const robotSources = new Map(currentRobot.sources.map((source) => [source.url, source]));
  const sourceRequirements = createSourceRequirementStore();
  const specs = {};
  const clearSpecKeys = [];
  const specDiffs = {};
  const fieldEvidence = {};
  const unresolvedFields = [];

  for (const [key, fieldRecord] of Object.entries(verifiedRobot.fields)) {
    assert(specEntryByKey.has(key), `Unknown spec key in VERIFY: ${robotId}.${key}`);
    if (hasAcceptedValue(fieldRecord)) {
      specs[key] = fieldRecord.proposedValue;
      fieldEvidence[key] = [fieldRecord.sourceUrl];
      specDiffs[key] = {
        action: compareValue(currentRobot.specs[key], fieldRecord.proposedValue),
        currentValue: currentRobot.specs[key] ?? null,
        proposedValue: fieldRecord.proposedValue,
      };
      sourceRequirements.add(
        fieldRecord.sourceUrl,
        `specs.${key}`,
        sourceCandidateForField(fieldRecord, identity),
      );
    } else if (isVerifiedAbsent(fieldRecord)) {
      if (currentRobot.specs[key] !== undefined) clearSpecKeys.push(key);
      specDiffs[key] = {
        action: currentRobot.specs[key] === undefined ? 'unchanged' : 'remove',
        currentValue: currentRobot.specs[key] ?? null,
        proposedValue: null,
      };
    } else if (fieldRecord.verificationStatus === 'unresolved') {
      unresolvedFields.push({
        field: key,
        rawStatus: fieldRecord.rawStatus,
        rawValue: fieldRecord.rawValue,
        sourceUrl: fieldRecord.sourceUrl,
        reason: fieldRecord.reason,
        currentValue: currentRobot.specs[key] ?? null,
        currentValueRequiresReview: currentRobot.specs[key] !== undefined,
      });
    }
  }

  const priceOffers = verifiedRobot.priceOffers
    .filter((record) => hasAcceptedValue(record))
    .map((record) => record.proposedValue);
  if (priceOffers.length > 0) {
    fieldEvidence.priceOffers = unique(priceOffers.map((offer) => offer.sourceUrl));
  }
  priceOffers.forEach((offer) => {
    sourceRequirements.add(
      offer.sourceUrl,
      'priceOffers',
      offer.channel === 'authorized-distributor-public'
        ? {
            kind: 'authorized-distributor-price',
            sellerName: offer.sellerName,
            checkedAt: verifiedRobot.priceOffers.find(
              (record) => record.proposedValue?.sourceUrl === offer.sourceUrl,
            )?.checkedAt,
          }
        : { kind: 'manufacturer-price', checkedAt: batch.checkedAt },
    );
  });
  const priceResearchVerifiedAbsent = Boolean(
    acceptedStatuses.has(verifiedRobot.priceResearchStatus?.verificationStatus) &&
      verifiedRobot.priceResearchStatus?.rawStatus === 'not-published',
  );
  const priceAction = priceOffers.length > 0
    ? 'replace'
    : priceResearchVerifiedAbsent
      ? 'clear'
      : 'hold';

  const loadRatings = verifiedRobot.loadRatings
    .filter((record) => hasAcceptedValue(record))
    .map((record) => record.proposedValue);
  if (loadRatings.length > 0) {
    fieldEvidence.loadRatings = unique(loadRatings.map((load) => load.sourceUrl));
  }
  loadRatings.forEach((load) => {
    sourceRequirements.add(load.sourceUrl, 'loadRatings', {
      kind: 'official-load-rating',
      checkedAt: batch.checkedAt,
    });
  });

  const acceptedUsageByUrl = new Map(
    verifiedRobot.usageExamples
      .filter((record) => hasAcceptedValue(record))
      .map((record) => [record.url, record]),
  );
  const usageExampleSourceUrls = verifiedRobot.usageExampleSourceUrls
    .filter((record) => acceptedStatuses.has(record.verificationStatus))
    .map((record) => record.url)
    .filter((url) => acceptedUsageByUrl.has(url))
    .slice(0, 3);
  assert(usageExampleSourceUrls.length <= 3, `Usage example limit exceeded: ${robotId}`);
  const hasUnresolvedUsageExamples = verifiedRobot.usageExamples.some(
    (record) => record.verificationStatus === 'unresolved',
  );
  const hasRejectedUsageExamples = verifiedRobot.usageExamples.some(
    (record) => record.verificationStatus === 'rejected',
  );
  const usageExampleAction = usageExampleSourceUrls.length > 0
    ? 'replace'
    : hasRejectedUsageExamples && !hasUnresolvedUsageExamples
      ? 'clear'
      : 'hold';
  usageExampleSourceUrls.forEach((url) => {
    const usage = acceptedUsageByUrl.get(url);
    sourceRequirements.add(url, 'usageExampleSourceUrls', {
      kind: 'usage-example',
      title: usage.proposedValue.title,
      publisher: usage.proposedValue.publisher,
      publishedAt: usage.proposedValue.publishedAt,
      checkedAt: usage.checkedAt,
    });
  });

  const officialUseCases = verifiedRobot.officialUseCases
    .filter((record) => hasAcceptedValue(record))
    .map((record) => {
      const useCaseId = record.proposedValue;
      const useCase = useCaseById.get(useCaseId);
      assert(useCase?.publishStatus === 'published', `UseCase is not published: ${robotId} -> ${useCaseId}`);
      const currentRelation = useCase.candidateRobots.find((candidate) => candidate.robotId === robotId);
      const hasSameEvidence = Boolean(
        currentRelation?.basis === 'official-use-case' &&
          currentRelation.evidenceSourceUrls?.includes(record.evidenceSourceUrl),
      );
      const preservesDifferentBasis = Boolean(
        currentRelation && currentRelation.basis !== 'official-use-case',
      );
      const proposedRelation = preservesDifferentBasis
        ? null
        : {
            robotId,
            fit: currentRelation?.fit ?? 'possible',
            basis: 'official-use-case',
            evidenceSourceUrls: unique([
              ...(currentRelation?.evidenceSourceUrls ?? []),
              record.evidenceSourceUrl,
            ]),
            reason: currentRelation?.reason ?? `${record.officialExpression}（公式情報で確認）`,
          };
      return {
        useCaseId,
        evidenceSourceUrl: record.evidenceSourceUrl,
        officialExpression: record.officialExpression,
        proposedRelation,
        action: preservesDifferentBasis
          ? 'preserve-existing-review-official-evidence'
          : hasSameEvidence
            ? 'unchanged'
            : currentRelation
              ? 'merge'
              : 'add',
        currentRelation: currentRelation ?? null,
        checkedAt: record.checkedAt,
      };
    });

  const useCaseSourceRequirements = officialUseCases.map((relation) => {
    const useCase = useCaseById.get(relation.useCaseId);
    const existingSource = useCase.sources.find((source) => source.url === relation.evidenceSourceUrl);
    return existingSource
      ? {
          useCaseId: relation.useCaseId,
          url: relation.evidenceSourceUrl,
          status: 'existing',
          existingSource,
          action:
            relation.checkedAt > existingSource.checkedAt
              ? 'refresh-checkedAt'
              : 'unchanged',
          proposedCheckedAt: relation.checkedAt,
        }
      : {
          useCaseId: relation.useCaseId,
          url: relation.evidenceSourceUrl,
          status: 'add-after-review',
          candidateSource: {
            title: `${identity.officialName} official use case`,
            url: relation.evidenceSourceUrl,
            publisher: manufacturer.name,
            checkedAt: relation.checkedAt,
            reliability: 'official',
          },
          reviewReason: '生成した説明用titleとpublisherを人間が確認する。',
        };
  });

  const procurement = normalizeProcurement(verifiedRobot, currentRobot);
  for (const [field, fieldRecord] of Object.entries(verifiedRobot.procurement ?? {})) {
    if (hasAcceptedValue(fieldRecord)) {
      unique(fieldRecord.sourceUrls ?? [fieldRecord.sourceUrl]).forEach((url) => {
        sourceRequirements.add(url, `procurement.${field}`, {
          kind: 'official-procurement',
          checkedAt: fieldRecord.checkedAt,
        });
      });
    }
  }

  const normalizedRobotSources = sourceRequirements.values().map((requirement) =>
    chooseSourceCandidate(requirement, {
      existingSources: robotSources,
      officialName: identity.officialName,
      manufacturerName: manufacturer.name,
      checkedAt: batch.checkedAt,
    }),
  );

  const useCaseGaps = verifiedRobot.useCaseGaps
    .filter((record) => acceptedStatuses.has(record.verificationStatus) && record.variantConfirmed === true)
    .map((record) => ({
      officialExpression: record.officialExpression,
      evidenceSourceUrl: record.evidenceSourceUrl,
      reason: record.reason,
    }));

  const rejectedUsageExamples = verifiedRobot.usageExamples
    .filter((record) => record.verificationStatus === 'rejected')
    .map((record) => ({ title: record.title, url: record.url, reason: record.reason }));

  const unresolvedPriceOffers = verifiedRobot.priceOffers.filter(
    (record) => record.verificationStatus === 'unresolved',
  );
  const unresolvedLoadRatings = verifiedRobot.loadRatings.filter(
    (record) => record.verificationStatus === 'unresolved',
  );
  const unresolvedUsageExamples = verifiedRobot.usageExamples.filter(
    (record) => record.verificationStatus === 'unresolved',
  );
  const unresolvedOfficialUseCases = verifiedRobot.officialUseCases.filter(
    (record) => record.verificationStatus === 'unresolved',
  );

  const missingRobotSources = normalizedRobotSources.filter((source) => source.status !== 'existing');
  const missingUseCaseSources = useCaseSourceRequirements.filter((source) => source.status !== 'existing');

  return {
    robotId,
    manufacturerId: verifiedRobot.manufacturerId,
    identity: {
      ready: identityReady,
      officialName: identity.officialName,
      variant: identity.variant,
      officialProductUrl: identity.officialProductUrl,
      checkedAt: identity.checkedAt,
    },
    positioningFacts: verifiedRobot.positioningFacts
      .filter((record) => acceptedStatuses.has(record.verificationStatus) && record.variantConfirmed === true)
      .map((record) => ({ value: record.rawValue, sourceUrl: record.sourceUrl })),
    robotPatch: {
      specs,
      clearSpecKeys,
      priceOffers: {
        action: priceAction,
        values: priceOffers,
      },
      loadRatings: {
        action: loadRatings.length > 0 ? 'replace' : 'hold',
        values: loadRatings,
      },
      usageExampleSourceUrls: {
        action: usageExampleAction,
        values: usageExampleSourceUrls,
      },
      procurement: procurement.patch,
      clearProcurementFields: procurement.clearFields,
      fieldEvidence,
      clearFieldEvidenceKeys: unique([
        ...clearSpecKeys,
        ...(priceAction === 'clear' ? ['priceOffers'] : []),
      ]),
    },
    currentDiff: {
      specs: specDiffs,
      priceOffers: {
        action: priceAction,
        currentValue: currentRobot.priceOffers ?? null,
        proposedValue: priceAction === 'hold' ? null : priceOffers,
      },
      loadRatings: {
        action: loadRatings.length > 0 ? 'replace' : 'hold',
        currentValue: currentRobot.loadRatings ?? null,
        proposedValue: loadRatings.length > 0 ? loadRatings : null,
      },
      usageExampleSourceUrls: {
        action: usageExampleAction,
        currentValue: currentRobot.usageExampleSourceUrls ?? null,
        proposedValue: usageExampleAction === 'hold' ? null : usageExampleSourceUrls,
      },
      procurement: procurement.diffs,
    },
    robotSourceRequirements: normalizedRobotSources,
    useCaseRelations: officialUseCases,
    useCaseSourceRequirements,
    manualReview: {
      unresolvedFields,
      unresolvedPriceOffers,
      unresolvedLoadRatings,
      unresolvedUsageExamples,
      unresolvedOfficialUseCases,
      useCaseGaps,
      rejectedUsageExamples,
      procurementCandidates: procurement.manualCandidates,
      unresolvedProcurement: procurement.unresolved,
      conflicts: verifiedRobot.conflicts ?? [],
      humanReviewRequired: verifiedRobot.humanReviewRequired ?? [],
    },
    applyGate: {
      identityReady,
      missingRobotSourceCount: missingRobotSources.length,
      missingUseCaseSourceCount: missingUseCaseSources.length,
      sourceMetadataReviewRequired: missingRobotSources.length + missingUseCaseSources.length > 0,
      hasUnresolvedCurrentSpecValues: unresolvedFields.some(
        (field) => field.currentValueRequiresReview,
      ),
    },
    cardCoverageFromVerifiedResearch: {
      officialUseCase: officialUseCases.some((relation) => relation.proposedRelation !== null),
      size: specs.heightCm !== undefined || specs.weightKg !== undefined,
      publicPrice: priceOffers.length > 0,
      runtime: specs.runtimeMin !== undefined,
    },
  };
}

function countRobotManifest(robot) {
  const review = robot.manualReview;
  return {
    specsToSet: Object.keys(robot.robotPatch.specs).length,
    specsToClear: robot.robotPatch.clearSpecKeys.length,
    priceOffers: robot.robotPatch.priceOffers.values.length,
    loadRatings: robot.robotPatch.loadRatings.values.length,
    usageExamples: robot.robotPatch.usageExampleSourceUrls.values.length,
    officialUseCases: robot.useCaseRelations.length,
    useCaseRelationReviews: robot.useCaseRelations.filter(
      (relation) => relation.action === 'preserve-existing-review-official-evidence',
    ).length,
    useCaseGaps: review.useCaseGaps.length,
    unresolved:
      review.unresolvedFields.length +
      review.unresolvedPriceOffers.length +
      review.unresolvedLoadRatings.length +
      review.unresolvedUsageExamples.length +
      review.unresolvedOfficialUseCases.length +
      review.unresolvedProcurement.length,
    missingRobotSources: robot.applyGate.missingRobotSourceCount,
    missingUseCaseSources: robot.applyGate.missingUseCaseSourceCount,
  };
}

function sumCounts(items) {
  return items.reduce((total, item) => {
    for (const [key, value] of Object.entries(item)) total[key] = (total[key] ?? 0) + value;
    return total;
  }, {});
}

function createReport(manifests, totals) {
  const rows = manifests.map((manifest) => {
    const c = manifest.counts;
    return `| ${manifest.batchId.replace('DATA-R01-IMPLEMENT-', '')} | ${manifest.robots.length} | ${c.specsToSet} | ${c.specsToClear} | ${c.priceOffers} | ${c.loadRatings} | ${c.usageExamples} | ${c.officialUseCases} | ${c.useCaseRelationReviews} | ${c.useCaseGaps} | ${c.unresolved} | ${c.missingRobotSources + c.missingUseCaseSources} |`;
  });
  const coverage = sumCounts(
    manifests.flatMap((manifest) => manifest.robots).map((robot) => ({
      officialUseCase: Number(robot.cardCoverageFromVerifiedResearch.officialUseCase),
      size: Number(robot.cardCoverageFromVerifiedResearch.size),
      publicPrice: Number(robot.cardCoverageFromVerifiedResearch.publicPrice),
      runtime: Number(robot.cardCoverageFromVerifiedResearch.runtime),
    })),
  );

  return `# DATA-R01 implementation manifest report

Generated from: \`DATA-R01-VERIFY-B01.json\`〜\`DATA-R01-VERIFY-B14.json\`
Schema: \`${manifestSchemaVersion}\`
Checked at: 2026-07-16

## 結論

VERIFYの \`verificationStatus\` が \`verified\` / \`corrected\` で、対象variantが確定し、\`proposedValue\` がnullでない値だけを実装候補へ抽出した。
\`unresolved\` / \`rejected\` は \`robotPatch\` へ入れず、\`manualReview\` に隔離している。

公式ページで「非掲載」を確認できたspecは \`clearSpecKeys\`、公開価格なしを確認できたRobotは \`priceOffers.action: clear\` として、古い値を残さないための削除候補を分離した。削除候補も実装時に差分確認する。

## 全体件数

- Robot: ${totals.robots}
- 設定候補spec: ${totals.specsToSet}
- 削除候補spec: ${totals.specsToClear}
- 公開価格offer: ${totals.priceOffers}
- 荷重: ${totals.loadRatings}
- 活用事例URL: ${totals.usageExamples}
- 公式UseCase evidence: ${totals.officialUseCases}
- 既存のdeployment/adjacent-deployment関係を保持して要レビュー: ${totals.useCaseRelationReviews}
- USE_CASE_GAP: ${totals.useCaseGaps}
- unresolved record: ${totals.unresolved}
- 追加・メタデータ確認が必要なsource join: ${totals.missingRobotSources + totals.missingUseCaseSources}

## カード4項目の調査カバレッジ

61機のうち、VERIFYから直接採用できる情報があるRobot数。

- 想定用途（既存UseCaseへ公式根拠付き接続）: ${coverage.officialUseCase}
- サイズ（身長または重量）: ${coverage.size}
- 公開価格: ${coverage.publicPrice}（それ以外はUIの問い合わせフォールバック）
- 稼働時間: ${coverage.runtime}

## バッチ別

| Batch | Robot | spec set | spec clear | price | load | usage | use case evidence | relation review | gap | unresolved | source review |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows.join('\n')}

## 実装順序

1. 各manifestの \`robotSourceRequirements\` と \`useCaseSourceRequirements\` を確認し、\`status: add-after-review\` のsource title・publisher・reliabilityを確定する。
2. sourceを追加してから \`robotPatch.specs\`、価格、荷重、活用事例URL、procurementを反映する。
3. \`clearSpecKeys\` / \`clearProcurementFields\` / \`priceOffers.action: clear\` は現行値と出典を目視して削除する。
4. \`useCaseRelations\` を既存candidateへ上書きせずmergeする。\`preserve-existing-review-official-evidence\` は既存のdeployment系関係を保持し、UseCase.sourcesへのevidence追加だけを個別判断する。
5. \`manualReview\`、特に既存値を持つunresolved fieldを確認する。推測で埋めない。
6. メーカー単位または5〜8機体単位で \`npm run validate:data\`、\`npm run build\`、\`npm run check:source-links\` を実行する。

## 非対象

- 画像・ロゴの権利判断と素材登録
- summary / description / comparison のAI自動生成
- USE_CASE_GAPからのUseCase自動新設
- unresolved値のenumへの推測変換
- dirtyな実装worktreeへの自動適用
`;
}

async function main() {
  const seenRobotIds = new Set();
  const manifests = [];

  for (let index = 1; index <= expectedBatchCount; index += 1) {
    const batchNumber = String(index).padStart(2, '0');
    const verifyPath = path.join(dataDir, `DATA-R01-VERIFY-B${batchNumber}.json`);
    const batch = JSON.parse(await readFile(verifyPath, 'utf8'));
    assert(batch.batchId === `DATA-R01-VERIFY-B${batchNumber}`, `Unexpected batch id: ${batch.batchId}`);

    const normalizedRobots = batch.robots.map((robot) => buildRobotManifest(robot, batch, seenRobotIds));
    const counts = sumCounts(normalizedRobots.map(countRobotManifest));
    const manifest = {
      schemaVersion: manifestSchemaVersion,
      batchId: `DATA-R01-IMPLEMENT-B${batchNumber}`,
      sourceBatchId: batch.batchId,
      checkedAt: batch.checkedAt,
      policy: {
        acceptedVerificationStatuses: [...acceptedStatuses],
        requireVariantConfirmed: true,
        requireNonNullProposedValue: true,
        unresolvedPolicy: 'manualReview-only',
        sourceJoinPolicy: 'sources-first',
        useCasePolicy: 'merge-existing-candidate-never-blind-overwrite',
      },
      targetRobotIds: batch.targetRobotIds,
      robots: normalizedRobots,
      counts,
    };
    manifests.push(manifest);
  }

  const expectedRobotIds = robots
    .filter((robot) => robot.publishStatus === 'published')
    .map((robot) => robot.id)
    .sort();
  assert(
    deepEqual([...seenRobotIds].sort(), expectedRobotIds),
    'VERIFY robot set does not match published data/robots.ts',
  );

  const batchTotals = sumCounts(manifests.map((manifest) => manifest.counts));
  const totals = { robots: seenRobotIds.size, ...batchTotals };

  for (const manifest of manifests) {
    const batchNumber = manifest.batchId.slice(-2);
    const outputPath = path.join(dataDir, `DATA-R01-IMPLEMENT-B${batchNumber}.json`);
    await writeFile(outputPath, `${JSON.stringify(manifest)}\n`, 'utf8');
  }

  const report = createReport(manifests, totals);
  await writeFile(path.join(dataDir, 'DATA-R01-implementation-manifest-report.md'), report, 'utf8');

  console.log(`[DATA-R01] manifests: ${manifests.length}`);
  console.log(`[DATA-R01] robots: ${totals.robots}`);
  console.log(`[DATA-R01] specs set/clear: ${totals.specsToSet}/${totals.specsToClear}`);
  console.log(`[DATA-R01] price/load/usage/useCase: ${totals.priceOffers}/${totals.loadRatings}/${totals.usageExamples}/${totals.officialUseCases}`);
  console.log(`[DATA-R01] unresolved: ${totals.unresolved}`);
  console.log(`[DATA-R01] source review: ${totals.missingRobotSources + totals.missingUseCaseSources}`);
}

await main();
