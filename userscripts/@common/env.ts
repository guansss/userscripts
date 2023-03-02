/** When called, the entire call expression will be removed in production. */
export function DEV_ONLY(...args: unknown[]) {}

// writing `const devOnlyContext = {}` here will cause tree shaking to fail
// because webpack keeps thinking it has a side effect, mysteriously
const devOnlyContext: Record<string, any> = {}

/** When called, the entire call expression will be removed in production. */
export function WITH_DEV_ONLY(fn: (devOnlyContext: Record<string, any>) => void) {
  fn(devOnlyContext)
}

/** Equivalent to `import.meta.webpackHot.dispose()`. Will be removed in production. */
export function ON_RELOAD(callback: () => void) {}
