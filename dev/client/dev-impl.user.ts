import { GM_fetch } from "../../userscripts/@common/counterfeits/GM_fetch"
import { log } from "../../userscripts/@common/log"
import { createStorage } from "../../userscripts/@common/storage"
import { UserscriptInfo } from "../utils-shared"
import "./hmr"

declare global {
  interface Window {
    __devContext: {
      host: string
    }

    // during development, we need to expose the GM APIs to unsafeWindow
    // to grant access to userscripts that are dynamically loaded via <script>
    __GM__: Record<string, unknown>

    // why is this not in the types?
    console: Console
  }
}

interface UserscriptInfoWithMenu extends UserscriptInfo {
  label?: string
  menuID?: number
}

;(() => {
  window.fetch = GM_fetch

  disableSentry()

  const { host } = window.__devContext

  const storage = createStorage("dev", {
    force: {} as Record<string, string[]>,
  })

  function getForceLoads() {
    return storage.get("force")[location.origin] || []
  }

  function saveForceLoads(forceLoads: string[]) {
    storage.set("force", (val) => ({
      ...val,
      [location.origin]: forceLoads,
    }))
  }

  const loadedScripts: UserscriptInfoWithMenu[] = []
  const allScripts: UserscriptInfoWithMenu[] = []

  GM_xmlhttpRequest({
    url: host + "/@userscripts/all",
    responseType: "json",
    headers: { referer: location.href },
    onload: (details) => {
      log("Got all scripts:", details.response)
      const scripts = details.response
      const forceLoads = getForceLoads()

      allScripts.push(...scripts)
      allScripts.forEach((script) => {
        if (forceLoads.includes(script.name)) {
          loadScript(script)
        }
      })

      updateMenu()
    },
  })

  GM_xmlhttpRequest({
    url: host + "/@userscripts/match",
    responseType: "json",
    headers: { referer: location.href },
    onload: (details) => {
      log("Got matching scripts:", details.response)
      const scripts = details.response
      scripts.forEach(loadScript)
      updateMenu()
    },
  })

  function loadScript(script: UserscriptInfo) {
    if (loadedScripts.find(({ name }) => name === script.name)) {
      return
    }

    log("Loading script:", script.name)

    loadedScripts.push(script)

    require(`../../userscripts/${script.name}/index.ts`)
  }

  function updateMenu() {
    const forceLoads = getForceLoads()

    allScripts.forEach((script) => {
      let label = ""

      if (loadedScripts.find(({ name }) => name === script.name)) {
        label += "[x] "
      } else {
        // en space
        label += "[\u2002] "
      }

      label += script.name

      if (forceLoads.includes(script.name)) {
        label += " (force)"
      }

      if (script.label !== label) {
        script.label = label

        if (script.menuID) {
          GM_unregisterMenuCommand(script.menuID)
        }

        script.menuID = GM_registerMenuCommand(label, createToggler(script))
      }
    })
  }

  function createToggler(script: UserscriptInfo) {
    return () => {
      const forceLoads = getForceLoads()

      // toggle the state
      const shouldForce = !forceLoads.includes(script.name)

      if (shouldForce) {
        forceLoads.push(script.name)
        loadScript(script)
      } else {
        forceLoads.splice(forceLoads.indexOf(script.name), 1)
      }

      saveForceLoads(forceLoads)
      updateMenu()
    }
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
})()

// prevent the webpack from reloading the page even though this file is not HMR-able,
// so you need to manually reload the page after changes
import.meta.webpackHot.accept()
