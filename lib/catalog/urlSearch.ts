export function toInitialSearch(entries: Record<string, string | null>) {
  const params = new URLSearchParams();
  Object.entries(entries).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.toString();
}
