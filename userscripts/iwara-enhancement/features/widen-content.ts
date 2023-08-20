import { ref, watch, watchEffect } from "vue"
import { ON_RELOAD } from "../../@common/env"
import { log } from "../../@common/log"
import { throttle } from "../../@common/timer"
import { page } from "../core/paging"
import { storage } from "../core/storage"

const widenListEnabled = ref(storage.get("widen_list"))
const widenListScale = ref(storage.get("widen_list_scale"))
const widenContentEnabled = ref(storage.get("widen_content"))
const widenContentScale = ref(storage.get("widen_content_scale"))

watch(widenListEnabled, (enabled) => storage.set("widen_list", enabled))
watch(widenListScale, (scale) => storage.set("widen_list_scale", scale))
watch(widenContentEnabled, (enabled) => storage.set("widen_content", enabled))
watch(widenContentScale, (scale) => storage.set("widen_content_scale", scale))
watch([widenListEnabled, widenListScale], throttle(updateListScale, 100))

export function useWidenContentSettings() {
  return {
    widenListEnabled,
    widenListScale,
    widenContentEnabled,
    widenContentScale,
  }
}

let widenListStyleEl: HTMLStyleElement | undefined

function updateListScale() {
  widenListStyleEl?.remove()
  widenListStyleEl = undefined

  if (widenListEnabled.value) {
    const pageIds = ["home", "videoList", "imageList", "subscriptions", "profile", "video", "image"]
    const classes = pageIds.map((pageId) => `.page-${pageId} .container-fluid`)

    widenListStyleEl = GM_addStyle(
      `${classes.join(",")} {
          max-width: ${1200 * (widenListScale.value / 100)}px;
        }`
    )
  }
}

updateListScale()
ON_RELOAD(() => widenListStyleEl?.remove())

page(["video", "image"] as const, (pageID, onLeave) => {
  const mediaArea = $(".page-video__player, .page-video__slideshow").get(0)!

  if (!mediaArea) {
    log(`${pageID === "video" ? "video" : "slideshow"} area not found.`)
    return
  }

  const sidebar = $(".page-video__sidebar").get(0)!

  if (!sidebar) {
    log("sidebar not found.")
    return
  }

  const col = $(mediaArea).closest(".col-12").get(0)!
  const row = $(mediaArea).closest(".row").get(0)!
  const container = $(row).closest(".content").get(0)!

  onLeave(watchEffect(() => updateResize()))

  function updateResize(entries?: ResizeObserverEntry[]) {
    if (widenContentEnabled.value) {
      let containerWidth = 0
      let rowWidth = 0
      let colWidth = 0
      let mediaHeight = 0

      if (entries) {
        for (const entry of entries) {
          if (entry.target === mediaArea) {
            mediaHeight = entry.contentRect.height
          } else if (entry.target === col) {
            colWidth = entry.contentRect.width
          } else if (entry.target === row) {
            rowWidth = entry.contentRect.width
          } else if (entry.target === container) {
            containerWidth = entry.contentRect.width
          }
        }
      } else {
        containerWidth = container.offsetWidth
        rowWidth = row.offsetWidth
        colWidth = col.offsetWidth
        mediaHeight = mediaArea.offsetHeight
      }

      // iwara uses a polyfilled ResizeObserver, which reports an error when resizing DOMs in the callback immediately,
      // this is so stupid that I have to use setTimeout to avoid the error
      // see: https://github.com/juggle/resize-observer/issues/103
      setTimeout(() => {
        if (containerWidth > 0 && rowWidth > 0 && colWidth > 0) {
          const scale = widenContentScale.value / 100
          const mediaWidth = Math.min(rowWidth * scale, containerWidth)

          mediaArea.style.marginLeft = `${~~((rowWidth - mediaWidth) / 2)}px`
          mediaArea.style.marginRight = `${~~(
            (rowWidth - mediaWidth) / 2 -
            (rowWidth - colWidth)
          )}px`
        }

        if (mediaHeight > 0) {
          sidebar.style.marginTop = `${~~(mediaArea.offsetTop + mediaHeight)}px`
        }
      }, 0)
    } else {
      mediaArea.style.marginLeft = ""
      mediaArea.style.marginRight = ""
      sidebar.style.marginTop = ""
    }
  }

  const observer = new ResizeObserver(updateResize)

  observer.observe(mediaArea)
  observer.observe(row)
  observer.observe(container)

  onLeave(() => {
    observer.disconnect()
  })
})
