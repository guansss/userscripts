import { ref, watch, watchEffect } from "vue"
import { log } from "../../@common/log"
import { page } from "../core/paging"
import { storage } from "../core/storage"

const widenContentEnabled = ref(storage.get("widen_content"))
const widenContentScale = ref(storage.get("widen_content_scale"))

watch(widenContentEnabled, (enabled) => storage.set("widen_content", enabled))
watch(widenContentScale, (scale) => storage.set("widen_content_scale", scale))

export function useWidenContentSettings() {
  return {
    widenContentEnabled,
    widenContentScale,
  }
}

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

      if (containerWidth > 0 && rowWidth > 0 && colWidth > 0) {
        const scale = widenContentScale.value / 100
        const mediaWidth = Math.min(rowWidth * scale, containerWidth)

        mediaArea.style.marginLeft = `${(rowWidth - mediaWidth) / 2}px`
        mediaArea.style.marginRight = `${(rowWidth - mediaWidth) / 2 - (rowWidth - colWidth)}px`
      }

      if (mediaHeight > 0) {
        sidebar.style.marginTop = `${mediaArea.offsetTop + mediaHeight}px`
      }
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
