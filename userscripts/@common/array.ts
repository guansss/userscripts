/**
 * array.includes() with type guard.
 */
export function includes<T>(array: readonly T[], value: any): value is T {
  return array.includes(value)
}
