export interface PublishAuthorizationSourceFile {
  path: string;
  source: string;
}

export interface PublishAuthorizationBoundaryViolation {
  path: string;
  issuer: 'approvedPublishContext' | 'privilegedPublishContext';
  allowedPath: string;
}

export function findPublishAuthorizationBoundaryViolations(
  files: PublishAuthorizationSourceFile[],
): PublishAuthorizationBoundaryViolation[];

export function checkPublishAuthorizationBoundaries(
  root?: string,
): Promise<PublishAuthorizationBoundaryViolation[]>;
