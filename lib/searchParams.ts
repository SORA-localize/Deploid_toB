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

/**
 * readFirstSearchParam のクライアント版。next/navigation の useSearchParams() が返す
 * URLSearchParams から、空文字を null に正規化して読む（サーバー側 pickSearchParams と同じ規約）。
 */
export function readClientSearchParam(
  searchParams: URLSearchParams,
  key: string,
): string | null {
  const normalized = searchParams.get(key)?.trim();
  return normalized ? normalized : null;
}

export function pickClientSearchParams<const Key extends string>(
  searchParams: URLSearchParams,
  keys: readonly Key[],
): Record<Key, string | null> {
  return Object.fromEntries(
    keys.map((key) => [key, readClientSearchParam(searchParams, key)]),
  ) as Record<Key, string | null>;
}
