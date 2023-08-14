import { ON_RELOAD } from "../@common/env"
import { ready } from "../@common/events"

ready.then(() => {
  document.addEventListener("mouseleave", onLeave)
})

function onLeave(e: MouseEvent) {
  if (e.target === document) {
    const stuckComment = document.getElementById("comment-higher-container")?.firstElementChild

    if (stuckComment) {
      document.dispatchEvent(new MouseEvent("mousemove"))
    }
  }
}

ON_RELOAD(() => {
  document.removeEventListener("mouseleave", onLeave)
})

if (module.hot) {
  module.hot?.monkeyReload()
}
