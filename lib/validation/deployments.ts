import type { ContentSnapshot } from '../data/contentSnapshot.ts';
import {
  checkDate,
  checkDisplayableReference,
  checkReference,
  checkRequiredSources,
  checkUniqueValues,
} from './common.ts';
import { buildReferenceIndex } from './crossCollection.ts';
import type { ValidationCollector } from './types.ts';

export function validateDeployments(
  snapshot: ContentSnapshot,
  collector: ValidationCollector,
): void {
  const { deployments } = snapshot;
  const {
    manufacturerIds,
    publishedManufacturerIds,
    publishedUseCaseIds,
    robotIds,
    useCaseIds,
    visibleRobotIds,
  } = buildReferenceIndex(snapshot);

  for (const d of deployments) {
    checkReference({
      collector,
      kind: 'deployment',
      owner: d.id,
      field: 'manufacturerId',
      id: d.manufacturerId,
      ids: manufacturerIds,
    });
    if (d.publishStatus === 'published') {
      checkDisplayableReference({
        collector,
        kind: 'deployment',
        owner: d.id,
        field: 'manufacturerId',
        id: d.manufacturerId,
        allIds: manufacturerIds,
        displayableIds: publishedManufacturerIds,
        displayableStatus: 'published',
      });
    }
    if (d.robotId) {
      checkReference({
        collector,
        kind: 'deployment',
        owner: d.id,
        field: 'robotId',
        id: d.robotId,
        ids: robotIds,
      });
      if (d.publishStatus === 'published') {
        checkDisplayableReference({
          collector,
          kind: 'deployment',
          owner: d.id,
          field: 'robotId',
          id: d.robotId,
          allIds: robotIds,
          displayableIds: visibleRobotIds,
          displayableStatus: 'published/archived',
        });
      }
    }
    checkUniqueValues(collector, 'deployment', d.id, 'relatedUseCaseIds', d.relatedUseCaseIds ?? []);
    (d.relatedUseCaseIds ?? []).forEach((s) => {
      checkReference({
        collector,
        kind: 'deployment',
        owner: d.id,
        field: 'relatedUseCaseIds',
        id: s,
        ids: useCaseIds,
      });
      if (d.publishStatus === 'published') {
        checkDisplayableReference({
          collector,
          kind: 'deployment',
          owner: d.id,
          field: 'relatedUseCaseIds',
          id: s,
          allIds: useCaseIds,
          displayableIds: publishedUseCaseIds,
          displayableStatus: 'published',
        });
      }
    });
    checkDate(collector, 'deployment', d.id, 'updatedAt', d.updatedAt);
    checkRequiredSources(collector, 'deployment', d.id, d.sources);
  }
}
