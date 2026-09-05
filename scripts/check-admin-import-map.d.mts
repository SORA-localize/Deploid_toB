export interface AdminImportMapSources {
  /** `lib/payload/adminPublishComponents.ts` の中身。 */
  componentsModule: string;
  /** `src/app/(payload)/admin/importMap.js` の中身。 */
  importMap: string;
  /** `lib/payload/publishApprovedVersion.ts` の中身（`ApprovableCollectionSlug` の正本）。 */
  approvableSource: string;
  /** collectionファイルの相対パス → 中身（読めなければ null）。 */
  collections: Record<string, string | null>;
}

export interface AdminImportMapViolation {
  path: string;
  problem: string;
}

export interface PublishableCollectionFile {
  slug: string;
  path: string;
}

export function publishableCollectionFiles(
  approvableSource: string,
): PublishableCollectionFile[] | null;

export function findAdminImportMapViolations(
  sources: AdminImportMapSources,
): AdminImportMapViolation[];

export function checkAdminImportMap(root?: string): Promise<AdminImportMapViolation[]>;
