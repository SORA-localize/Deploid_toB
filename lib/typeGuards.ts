export function isOneOf<T extends string>(value: string | null | undefined, values: readonly T[]): value is T {
  return Boolean(value && values.includes(value as T));
}
