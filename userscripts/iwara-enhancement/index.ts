import { invalidate } from "../@common/hmr"
import "../@common/jquery"
import "./components/Settings"
import { setupPaging } from "./core/paging"
import "./features/ensure-logger"
import "./features/hide-list-options"
import "./features/process-teasers"
import "./features/theme"
import "./index.css"

export async function main() {
  document.body.classList.add("enh-body")

  setupPaging()
}

main()

if (import.meta.hot) {
  import.meta.hot.accept()

  // listen for beforeUpdate event instead of using dispose()
  // because vite sometimes mysteriously invokes the dispose hook for multiple times
  import.meta.hot.on("vite:beforeUpdate", () => {
    // call all onExit() hooks
    invalidate()
  })
}
