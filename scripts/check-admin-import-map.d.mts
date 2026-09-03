export interface AdminImportMapSources {
  /** `lib/payload/adminPublishComponents.ts` の中身。 */
  componentsModule: string;
  /** `src/app/(payload)/admin/importMap.js` の中身。 */
  importMap: string;
  /** collectionファイルの相対パス → 中身。 */
  collections: Record<string, string>;
}

export interface AdminImportMapViolation {
  path: string;
  problem: string;
}

export const PUBLISHABLE_COLLECTION_FILES: string[];

export function findAdminImportMapViolations(
  sources: AdminImportMapSources,
): AdminImportMapViolation[];

export function checkAdminImportMap(root?: string): Promise<AdminImportMapViolation[]>;
