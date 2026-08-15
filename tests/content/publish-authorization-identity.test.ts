import type { PayloadRequest } from 'payload';
import { describe, expect, it } from 'vitest';
import {
  approvedPublishContext,
  privilegedPublishContext,
  readApprovedPublishAuthorization,
  readPrivilegedPublishAuthorization,
} from '@/lib/payload/publishAuthorization';

const requestWith = (context: Record<string, unknown>): PayloadRequest => ({ context }) as PayloadRequest;

describe('publish authorization capabilities', () => {
  it('accepts the exact approved authorization object issued for the operation', () => {
    const context = approvedPublishContext({
      collection: 'robots',
      documentId: '42',
      approvedVersionId: '9',
      approvalManifestHash: 'a'.repeat(64),
      actorId: 'publisher-1',
    });
    expect(readApprovedPublishAuthorization(requestWith(context), 'robots', '42')).toMatchObject({
      approvedVersionId: '9',
    });
  });

  it('rejects a structurally identical copy of an approved authorization', () => {
    const copied = structuredClone(
      approvedPublishContext({
        collection: 'robots',
        documentId: '42',
        approvedVersionId: '9',
        approvalManifestHash: 'a'.repeat(64),
        actorId: 'publisher-1',
      }),
    );
    expect(readApprovedPublishAuthorization(requestWith(copied), 'robots', '42')).toBeNull();
  });

  it('rejects a structurally identical copy of a privileged authorization', () => {
    const copied = structuredClone(
      privilegedPublishContext({
        runId: 'restore-1',
        actorId: 'admin-1',
        reason: 'verified baseline restore',
        collections: ['robots'],
      }),
    );
    expect(readPrivilegedPublishAuthorization(requestWith(copied), 'robots')).toBeNull();
  });
});
