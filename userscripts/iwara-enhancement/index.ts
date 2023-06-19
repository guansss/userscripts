import { DEV_ONLY } from "../@common/env"
import { enableHMR } from "../@common/hmr"
import "../@common/jquery"
import "./components/Settings"
import { setupPaging } from "./core/paging"
import "./features/ensure-logger"
import "./features/widen-content"
import "./features/fix-player"
import "./features/process-teasers"
import "./features/theme"
import "./index.css"

export async function main() {
  document.body.classList.add("enh-body")

  setupPaging()
}

main()

DEV_ONLY(() => enableHMR(module))
