export interface PayloadMigrationGuardSourceFile {
  path: string;
  source: string;
}

export interface PayloadMigrationGuardViolation {
  path: string;
  /** どの参照で Payload へ到達しているか（診断用）。 */
  reasons: string[];
}

export function findPayloadMigrationGuardViolations(
  files: PayloadMigrationGuardSourceFile[],
): PayloadMigrationGuardViolation[];

export function checkPayloadMigrationGuard(root?: string): Promise<PayloadMigrationGuardViolation[]>;
