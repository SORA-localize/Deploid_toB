// Task 6 fix round 1: CandidateEvidenceBasis/DeploymentSiteはlegacyとdomainで構造が完全に同一。
// `UseCase.candidateRobots[].robotId` はdomain側でのみ optional（DEC-S08のseriesId候補向け）。
// legacy `data/useCases.ts` は常に robotId を持つ実データしか作らないため、このファイルは
// robotId が無い候補（seriesId候補）を「まだ検証対象外」として明示的にスキップする
// （型を偽って必須扱いにはしない）。
import type { CandidateEvidenceBasis, DeploymentSite, UseCase } from '../content/domainTypes.ts';
import type { ContentSnapshot } from '../data/contentSnapshot.ts';
import { isPublicUseCaseCandidateBasis } from '../useCaseEvidence.ts';
import {
  checkDate,
  checkDisplayableReference,
  checkReference,
  checkRequiredSources,
  checkTags,
  checkUniqueValues,
  checkUrl,
} from './common.ts';
import { buildReferenceIndex } from './crossCollection.ts';
import type { ValidationCollector } from './types.ts';

const candidateEvidenceBases = new Set<CandidateEvidenceBasis>([
  'deployment',
  'adjacent-deployment',
  'official-use-case',
  'product-capability',
  'market-signal',
  'editorial-watch',
]);

function checkUseCaseCandidateEvidence(
  collector: ValidationCollector,
  deploymentById: ReadonlyMap<string, DeploymentSite>,
  useCase: UseCase,
  candidate: UseCase['candidateRobots'][number],
  index: number,
): void {
  const owner = `${useCase.slug}.candidateRobots[${index}]`;
  const deploymentIds = candidate.evidenceDeploymentIds ?? [];
  const sourceUrls = candidate.evidenceSourceUrls ?? [];

  if (!candidate.reason.trim()) {
    collector.error(`[candidate-reason] useCase "${owner}.reason" が空です`);
  }
  if (!candidateEvidenceBases.has(candidate.basis)) {
    collector.error(`[candidate-basis] useCase "${owner}.basis" が未定義または未登録です: ${candidate.basis}`);
  }
  if (useCase.publishStatus === 'published' && !isPublicUseCaseCandidateBasis(candidate.basis)) {
    collector.error(
      `[candidate-public-basis] useCase "${owner}" は公開UseCaseの候補なので ` +
        `basis:'${candidate.basis}' は使えません`,
    );
  }

  checkUniqueValues(collector, 'useCase', useCase.slug, `candidateRobots[${index}].evidenceDeploymentIds`, deploymentIds);
  checkUniqueValues(collector, 'useCase', useCase.slug, `candidateRobots[${index}].evidenceSourceUrls`, sourceUrls);

  const useCaseSourceUrls = new Set(useCase.sources.map((source) => source.url));
  sourceUrls.forEach((url, sourceIndex) => {
    checkUrl(collector, 'useCase', useCase.slug, `candidateRobots[${index}].evidenceSourceUrls[${sourceIndex}]`, url);
    if (!useCaseSourceUrls.has(url)) {
      const message =
        `[candidate-source-unlisted] useCase "${useCase.slug}" の candidateRobots[${index}].evidenceSourceUrls ` +
        `"${url}" が useCase.sources にありません`;
      if (useCase.publishStatus === 'published' && candidate.basis === 'official-use-case') {
        collector.error(message);
      } else {
        collector.warn(message);
      }
    }
  });

  const evidenceDeployments = deploymentIds.flatMap((deploymentId, deploymentIndex) => {
    const deployment = deploymentById.get(deploymentId);
    if (!deployment) {
      collector.error(
        `[candidate-deployment-missing] useCase "${useCase.slug}".candidateRobots[${index}].` +
          `evidenceDeploymentIds[${deploymentIndex}] -> "${deploymentId}" は存在しません`,
      );
      return [];
    }
    if (useCase.publishStatus === 'published' && deployment.publishStatus !== 'published') {
      collector.error(
        `[candidate-deployment-draft] useCase "${useCase.slug}".candidateRobots[${index}] は公開ページの根拠として ` +
          `未公開deployment "${deploymentId}" を参照しています`,
      );
    }
    return [deployment];
  });

  if (candidate.fit === 'strong') {
    if (candidate.basis !== 'deployment') {
      collector.error(
        `[candidate-fit-basis] useCase "${owner}" は fit:'strong' なので basis:'deployment' にしてください`,
      );
    }
    if (deploymentIds.length === 0) {
      collector.error(
        `[candidate-evidence-empty] useCase "${owner}" は fit:'strong' なので evidenceDeploymentIds が必須です`,
      );
    }
    evidenceDeployments.forEach((deployment) => {
      if (deployment.robotId !== candidate.robotId) {
        collector.error(
          `[candidate-deployment-robot] useCase "${useCase.slug}".candidateRobots[${index}] の根拠deployment ` +
            `"${deployment.id}" は robotId が一致しません: ${deployment.robotId ?? '(none)'}`,
        );
      }
      if (!(deployment.relatedUseCaseIds ?? []).includes(useCase.id)) {
        collector.error(
          `[candidate-deployment-usecase] useCase "${useCase.slug}".candidateRobots[${index}] の根拠deployment ` +
            `"${deployment.id}" は relatedUseCaseIds に "${useCase.id}" を含みません`,
        );
      }
    });
    return;
  }

  if (candidate.fit === 'possible') {
    if (candidate.basis === 'deployment') {
      collector.error(
        `[candidate-fit-understated] useCase "${owner}" は basis:'deployment' なので fit:'strong' にするか、` +
          `根拠種別を adjacent-deployment 等に落としてください`,
      );
    }
    if (candidate.basis === 'editorial-watch') {
      collector.error(
        `[candidate-fit-basis] useCase "${owner}" は fit:'possible' なので basis:'editorial-watch' は使えません`,
      );
    }
    if (candidate.basis === 'adjacent-deployment' && deploymentIds.length === 0) {
      collector.error(
        `[candidate-evidence-empty] useCase "${owner}" は basis:'adjacent-deployment' なので evidenceDeploymentIds が必須です`,
      );
    }
    if (
      (candidate.basis === 'official-use-case' ||
        candidate.basis === 'product-capability' ||
        candidate.basis === 'market-signal') &&
      sourceUrls.length === 0
    ) {
      collector.error(
        `[candidate-evidence-empty] useCase "${owner}" は basis:'${candidate.basis}' なので evidenceSourceUrls が必須です`,
      );
    }
    return;
  }

  if (candidate.fit === 'watch') {
    if (
      candidate.basis !== 'market-signal' &&
      candidate.basis !== 'editorial-watch' &&
      candidate.basis !== 'product-capability'
    ) {
      collector.error(
        `[candidate-fit-basis] useCase "${owner}" は fit:'watch' なので ` +
          `basis は market-signal / product-capability / editorial-watch のいずれかにしてください`,
      );
    }
    if (
      (candidate.basis === 'market-signal' || candidate.basis === 'product-capability') &&
      sourceUrls.length === 0
    ) {
      collector.error(
        `[candidate-evidence-empty] useCase "${owner}" は basis:'${candidate.basis}' なので evidenceSourceUrls が必須です`,
      );
    }
    return;
  }

  collector.error(`[candidate-fit] useCase "${owner}.fit" が未登録です: ${candidate.fit}`);
}

export function validateUseCases(snapshot: ContentSnapshot, collector: ValidationCollector): void {
  const { useCases } = snapshot;
  const { deploymentById, robotIds, visibleRobotIds } = buildReferenceIndex(snapshot);

  for (const u of useCases) {
    checkDate(collector, 'useCase', u.slug, 'updatedAt', u.updatedAt);
    checkRequiredSources(collector, 'useCase', u.slug, u.sources, {
      requireNonEmpty: u.publishStatus === 'published',
    });
    checkTags(collector, 'useCase', u.slug, 'primaryIndustry', 'industry', [u.primaryIndustry]);
    checkTags(collector, 'useCase', u.slug, 'industryTags', 'industry', u.industryTags);
    checkTags(collector, 'useCase', u.slug, 'taskTags', 'task', u.taskTags);
    checkUniqueValues(
      collector,
      'useCase',
      u.slug,
      'candidateRobots.robotId',
      u.candidateRobots.map((c) => c.robotId).filter((robotId): robotId is string => robotId !== undefined),
    );
    if (u.publishStatus === 'published' && u.candidateRobots.length === 0) {
      collector.error(`[candidate-empty] useCase "${u.slug}".candidateRobots が空です`);
    }
    if (
      u.publishStatus === 'published' &&
      !u.candidateRobots.some((candidate) => isPublicUseCaseCandidateBasis(candidate.basis))
    ) {
      collector.error(`[candidate-public-empty] useCase "${u.slug}" に公開候補として使える candidateRobots がありません`);
    }
    u.candidateRobots.forEach((c, index) => {
      if (c.robotId === undefined) {
        // seriesId候補（DEC-S08）。legacy `data/useCases.ts` はまだこの形を作らないため
        // 実データには現れないが、型としては起こりうる。robotId向けの参照チェックは
        // 対象外にして、根拠チェック（basis/fit/evidence）だけ引き続き行う。
        collector.error(
          `[candidate-series-unsupported] useCase "${u.slug}".candidateRobots[${index}] は seriesId候補ですが、` +
            'このvalidatorはlocal data向けでrobotId候補のみ対応しています',
        );
        checkUseCaseCandidateEvidence(collector, deploymentById, u, c, index);
        return;
      }
      checkReference({
        collector,
        kind: 'useCase',
        owner: u.slug,
        field: 'candidateRobots.robotId',
        id: c.robotId,
        ids: robotIds,
      });
      if (u.publishStatus === 'published') {
        checkDisplayableReference({
          collector,
          kind: 'useCase',
          owner: u.slug,
          field: 'candidateRobots.robotId',
          id: c.robotId,
          allIds: robotIds,
          displayableIds: visibleRobotIds,
          displayableStatus: 'published/archived',
        });
      }
      checkUseCaseCandidateEvidence(collector, deploymentById, u, c, index);
    });
  }
}
