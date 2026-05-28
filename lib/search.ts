export function matchesQuery(query: string, values: Array<string | number | null | undefined>) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return values.some((value) => String(value ?? '').toLowerCase().includes(normalizedQuery));
}
