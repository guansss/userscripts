import { log } from "../../@common/log"
import { until } from "../../@common/timer"

import type { VideoJsPlayer } from "video.js"
import { ON_RELOAD } from "../../@common/env"
import { page } from "../core/paging"

const patchedFlag = "__enhPatched"

page(["video"] as const, async (pageID, onLeave) => {
  const timerPromise = until(() => {
    const player = getPlayer()

    if (player) {
      fixResolution(player)

      if (!(patchedFlag in player)) {
        ;(player as any)[patchedFlag] = true
        preventVolumeScrolling(player)

        ON_RELOAD(() => {
          delete (player as any)[patchedFlag]
        })
      }
    }
  }, 500)

  onLeave(() => timerPromise.cancel())

  function getPlayer() {
    return ($(".page-video__player .video-js").get(0) as any)?.player as VideoJsPlayer | undefined
  }

  function preventVolumeScrolling(player: VideoJsPlayer) {
    const originalGet = WeakMap.prototype.get

    // hook WeakMap.get() to get the data object that contains the event handlers
    WeakMap.prototype.get = function (key: WeakKey) {
      const value = originalGet.call(this, key)

      try {
        const data = value as { handlers: Record<string, Function[]> } | undefined

        if (data?.handlers?.mousewheel) {
          log("removing mousewheel handlers from Player:", data.handlers.mousewheel.length)

          // the listeners are bound functions and cannot be checked with toString(),
          // so we have to remove all mousewheel handlers
          delete data.handlers.mousewheel
        }
      } catch (e) {
        log("error:", e)
      } finally {
        return value
      }
    }

    // trigger the hook by adding an arbitrary event listener
    player.on("__dummy", () => {})
    player.off("__dummy")

    WeakMap.prototype.get = originalGet
  }

  function fixResolution(player: VideoJsPlayer) {
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
