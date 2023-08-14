import { ready } from "../@common/events"
import "../@common/jquery"
import { replacer } from "./replacer"

ready.then(main)

function main() {
  replacer()
}

if (module.hot) {
  module.hot?.monkeyReload()
}
