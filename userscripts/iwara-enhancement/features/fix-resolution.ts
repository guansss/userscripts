import { log } from "../../@common/log"
import { until$ } from "../../@common/timer"

import type videojs from "video.js"
import { page } from "../core/paging"

page(["video"] as const, async (pageID, onLeave) => {
  const resButtonsPromise = until$(
    () => $(".vjs-menu-item").filter((i, el) => el.className.includes("resolution-")),
    200
  )

  onLeave(() => resButtonsPromise.cancel())

  const resButtons = await resButtonsPromise
  const selectedResButton = resButtons.filter((i, el) => el.classList.contains("active"))
  const selectedResName = selectedResButton.text()

  if (selectedResButton.length === 1) {
    const player = ($(".page-video__player .video-js").get(0) as any).player as videojs.Player
    const selectedSource = player.currentSources().find((s: any) => s.name === selectedResName)

    if (!selectedSource) {
      log(`error: source not found for ${selectedResName}`)
      return
    }

    if (player.src() !== selectedSource.src) {
      log(`setting resolution to ${selectedResName}`)
      player.src(selectedSource)
    }
  }
})
