/**
 * When used, the entire call expression will be removed in production.
 * @example
 * ```js
 * DEV_ONLY(()=> console.log("I will be removed in production"))
 * ```
 * @see /dev/babel-plugin.ts
 */
export function DEV_ONLY(callback: () => void) {
  callback()
}

/**
 * Used to clear side effects on HMR. Shorthand for:
 * ```js
 * DEV_ONLY(()=> import.meta.webpackHot.dispose(callback))
 * ```
 * @see /dev/babel-plugin.ts
 */
export function ON_RELOAD(callback: () => void) {}
