import { ready } from "../@common/events"
import { invalidate } from "../@common/hmr"
import "../@common/jquery"
import { formatError } from "../@common/string"
import { until } from "../@common/timer"
import { toastError } from "../@common/toast"
import { control } from "./control"
import { imageViewer } from "./image-viewer"

ready.then(main)

async function main() {
  if ($('meta[property="og:title"]').attr("content") !== "Stable Diffusion") {
    return
  }

  try {
    const root = await until(() => document.getElementsByTagName("gradio-app")[0]?.shadowRoot, 200)
    const $root = $(root)

    const results = await Promise.allSettled([imageViewer($root), control($root)])

    for (const result of results) {
      if (result.status === "rejected") {
        throw result.reason
      }
    }
  } catch (e) {
    toastError(formatError(e))
  }
}

if (import.meta.hot) {
  import.meta.hot.accept()
  import.meta.hot.on("vite:beforeUpdate", () => {
    invalidate()
  })
}
