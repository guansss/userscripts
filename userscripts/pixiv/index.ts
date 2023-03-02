import { DEV_ONLY } from "../@common/env"
import { ready } from "../@common/events"
import { enableHMR } from "../@common/hmr"
import "../@common/jquery"
import { replacer } from "./replacer"

ready.then(main)

function main() {
  replacer()
}

DEV_ONLY(enableHMR(module))
