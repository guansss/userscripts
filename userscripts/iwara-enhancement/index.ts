import "../@common/jquery"
import "./components/Settings"
import { setupPaging } from "./core/paging"
import "./features/ensure-logger"
import "./features/fix-player"
import "./features/process-teasers"
import "./features/theme"
import "./features/widen-content"
import "./index.css"

async function main() {
  document.body.classList.add("enh-body")

  setupPaging()
}

main()

if (module.hot) {
  module.hot?.monkeyReload()
}
