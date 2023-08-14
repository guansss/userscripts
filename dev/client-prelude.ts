function main() {
  disableSentry()
}

function disableSentry() {
  // prevent Sentry from tracking the console during dev because it breaks the log trace
  ;(["debug", "info", "warn", "error", "log"] as const).forEach((key) => {
    const sentryFn = (unsafeWindow.console[key] as any).__sentry_original__

    if (sentryFn) {
      unsafeWindow.console[key] = sentryFn
    } else {
      const fn = unsafeWindow.console[key]
      Object.defineProperty(unsafeWindow.console, key, {
        set() {
          // prevent assignment
        },
        get() {
          return fn
        },
      })
    }
  })

  // fully disable Sentry, I'm not 100% sure this works
  ;(unsafeWindow as any).__SENTRY__ = {
    extensions: {},
  }

  let hub: any

  Object.defineProperty((unsafeWindow as any).__SENTRY__, "hub", {
    set(_hub) {
      hub = _hub
      hub.getClient = () => undefined
    },
    get() {
      return hub
    },
  })
}

main()
