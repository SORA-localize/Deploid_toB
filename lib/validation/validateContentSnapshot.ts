import type { ContentSnapshot } from '@/lib/data/contentSnapshot';
import type { ValidationResult } from '@/lib/validation/types';
import { validateSnapshotMonolith } from '@/lib/validate';

export function validateContentSnapshot(snapshot: ContentSnapshot): ValidationResult {
  return validateSnapshotMonolith(snapshot);
}
