import { describe, expect, it } from 'vitest';
import { findPublishAuthorizationBoundaryViolations } from '../../scripts/check-publish-authorization-boundaries.mjs';

describe('publish authorization import boundaries', () => {
  it('rejects production callers that import an authorization issuer outside its sole entrypoint', () => {
    const violations = findPublishAuthorizationBoundaryViolations([
      {
        path: 'src/app/api/unsafe.ts',
        source: "import { approvedPublishContext } from '../../../lib/payload/publishAuthorization';\n",
      },
      {
        path: 'scripts/unsafe-import.mts',
        source: "import { privilegedPublishContext } from '../lib/payload/publishAuthorization.ts';\n",
      },
    ]);
    expect(violations.map((violation: { issuer: string }) => violation.issuer)).toEqual([
      'approvedPublishContext',
      'privilegedPublishContext',
    ]);
  });

  it('allows only the existing approved and privileged production entrypoints', () => {
    expect(
      findPublishAuthorizationBoundaryViolations([
        {
          path: 'lib/payload/publishApprovedVersion.ts',
          source: "import { approvedPublishContext } from './publishAuthorization';\n",
        },
        {
          path: 'scripts/import-content-to-payload.mts',
          source: "import { privilegedPublishContext } from '../lib/payload/publishAuthorization.ts';\n",
        },
      ]),
    ).toEqual([]);
  });

  it('rejects namespace and dynamic imports because they can reach both issuers', () => {
    const violations = findPublishAuthorizationBoundaryViolations([
      {
        path: 'lib/unsafe-namespace.ts',
        source: "import * as publishAuth from './payload/publishAuthorization';\n",
      },
      {
        path: 'scripts/unsafe-dynamic.mts',
        source: "const publishAuth = await import('../lib/payload/publishAuthorization.ts');\n",
      },
    ]);
    expect(violations).toHaveLength(4);
  });
});
