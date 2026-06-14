export type ResolvedSearchParams = Record<string, string | string[] | undefined>;
export type RouteSearchParams = Promise<ResolvedSearchParams>;

export async function resolveSearchParams(params: RouteSearchParams): Promise<ResolvedSearchParams> {
  return params;
}

export function readFirstSearchParam(params: ResolvedSearchParams, key: string): string | null {
  const value = params[key];
  const first = Array.isArray(value) ? value[0] : value;
  const normalized = first?.trim();
  return normalized ? normalized : null;
}

export async function getFirstSearchParam(
  params: RouteSearchParams,
  key: string,
): Promise<string | null> {
  return readFirstSearchParam(await resolveSearchParams(params), key);
}

export async function pickSearchParams<const Key extends string>(
  params: RouteSearchParams,
  keys: readonly Key[],
): Promise<Record<Key, string | null>> {
  const resolved = await resolveSearchParams(params);
  return Object.fromEntries(
    keys.map((key) => [key, readFirstSearchParam(resolved, key)]),
  ) as Record<Key, string | null>;
}
