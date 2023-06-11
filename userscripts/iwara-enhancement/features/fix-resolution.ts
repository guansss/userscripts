import { log } from "../../@common/log"
import { until } from "../../@common/timer"

import type { VideoJsPlayer } from "video.js"
import { page } from "../core/paging"

page(["video"] as const, async (pageID, onLeave) => {
  const timerPromise = until(() => {
    fixResolution()
  }, 500)

  onLeave(() => timerPromise.cancel())

  function fixResolution() {
    const player = ($(".page-video__player .video-js").get(0) as any)?.player as
      | VideoJsPlayer
      | undefined

    if (!player) {
      return
    }

    const targetSource = getTargetSource(player)

    if (targetSource && targetSource.src !== player.src()) {
      log(`setting resolution to ${(targetSource as any).name}: ${targetSource.src}`)
      player.src(targetSource)
    }
  }

  function getTargetSource(player: VideoJsPlayer) {
    const selectedResName = localStorage.getItem("player-resolution")
    const source = player.currentSources().find((s: any) => s.name === selectedResName)

    if (source) {
      return source
    }

    log(`error: source not found for ${selectedResName}`)

    return undefined
  }
})

// this "bg" is covering the video player and preventing player from entering fullscreen mode by double-clicks
GM_addStyle(`
.videoPlayer__bg {
  pointer-events: none;
}
`)
