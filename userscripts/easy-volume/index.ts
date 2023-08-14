import { DEV_ONLY, ON_RELOAD } from "../@common/env"
import { log } from "../@common/log"
import { schemes } from "./scheme"
import "./schemes/bilibili"

async function main() {
  for (const scheme of schemes) {
    const matchesURL =
      typeof scheme.url === "string"
        ? location.href.includes(scheme.url)
        : scheme.url.test(location.href)

    const meetsCondition =
      scheme.condition === undefined
        ? true
        : typeof scheme.condition === "function"
        ? scheme.condition()
        : !!scheme.condition

    if (matchesURL && meetsCondition) {
      if (scheme.css) {
        const styleEl = GM_addStyle(scheme.css)

        DEV_ONLY(() => log("CSS Injected", styleEl))
        ON_RELOAD(() => styleEl.remove())
      }

      if (scheme.run) {
        await scheme.run()
      }

      break
    }
  }
}

// some websites prevent the console from reporting unhandled rejections,
// then we need to manually log the error
main().catch(log)

if (module.hot) {
  module.hot?.monkeyReload()
}
