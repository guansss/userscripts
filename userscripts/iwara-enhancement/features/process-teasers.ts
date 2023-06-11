import { ref, watchEffect } from "vue"
import { hasClass, SimpleMutationObserver } from "../../@common/dom"
import { DEV_ONLY } from "../../@common/env"
import { ready } from "../../@common/events"
import { log } from "../../@common/log"
import { parseAbbreviatedNumber } from "../../@common/number"
import { adjustAlpha } from "../../@common/string"
import { throttle, until$ } from "../../@common/timer"
import { page } from "../core/paging"
import { storage } from "../core/storage"

const likeRateEnabled = ref(storage.get("like_rates"))
const highlightThreshold = ref(storage.get("like_rate_highlight"))
const highlightOpacity = ref(storage.get("like_rate_highlight_opacity"))

const likeRateClass = "enh-like-rate"
const highlightClass = "enh-highlight"

ready.then(updateHighlightOpacity)

watchEffect(() => {
  storage.set("like_rates", likeRateEnabled.value)

  if (likeRateEnabled.value) {
    document.body.classList.add("enh-show-like-rates")
    $(".videoTeaser, .imageTeaser").each((i, teaser) => processTeaser(teaser))
  } else {
    document.body.classList.remove("enh-show-like-rates")
    $("." + highlightClass).removeClass(highlightClass)
  }
})

watchEffect(() => {
  storage.set("like_rate_highlight", highlightThreshold.value)

  $(".videoTeaser, .imageTeaser").each((i, teaser) => processTeaser(teaser))
})

watchEffect(() => {
  storage.set("like_rate_highlight_opacity", highlightOpacity.value)

  updateHighlightOpacity()
})

export function useTeaserSettings() {
  return {
    likeRateEnabled,
    highlightThreshold,
    highlightOpacity,
  }
}

page(
  ["home", "videoList", "imageList", "subscriptions", "profile", "video", "image"] as const,
  async (pageID, onLeave) => {
    const teaserObserver = new SimpleMutationObserver((mutation) =>
      mutation.addedNodes.forEach(detectColumn)
    )

    onLeave(() => {
      teaserObserver.disconnect()

      DEV_ONLY(() => $("." + likeRateClass).remove())
    })

    const teaserBatcher = new TeaserBatcher()

    if (["home", "profile", "image"].includes(pageID)) {
      ;[".videoTeaser", ".imageTeaser"].forEach(async (selector) => {
        const $teasers = await until$(() => $(selector), 200)

        requestProcessTeasers($teasers.toArray())
      })
    } else if (pageID === "video") {
      const selectors = [".moreFromUser", ".moreLikeThis"].flatMap((parentCls) =>
        [".videoTeaser", ".imageTeaser"].map((cls) => `${parentCls} ${cls}`)
      )

      selectors.forEach(async (selector) => {
        const $teasers = await until$(() => $(selector), 200)

        requestProcessTeasers($teasers.toArray())
      })
    } else {
      const $teasers = await until$(
        () => $(".videoTeaser:first-of-type, .imageTeaser:first-of-type"),
        200
      )

      detectRow($teasers.closest(".row")[0]!)
    }

    function detectRow(row: Node) {
      teaserObserver.observe(row, { childList: true, immediate: true })
    }

    function detectColumn(column: Node) {
      const { firstChild } = column

      if (
        !!firstChild &&
        (hasClass(firstChild, "videoTeaser") || hasClass(firstChild, "imageTeaser"))
      ) {
        requestProcessTeasers([firstChild])
      }
    }

    function requestProcessTeasers(teasers: HTMLElement[]) {
      teasers.forEach((teaser) => teaserBatcher.add(teaser))
      teaserBatcher.run(processTeaser)
    }
  }
)

class TeaserBatcher {
  teasers: HTMLElement[] = []

  add(teaser: HTMLElement) {
    this.teasers.push(teaser)
  }

  run = throttle((callback: (teaser: HTMLElement) => void) => {
    let lastError: any

    try {
      this.teasers.forEach(callback)
    } catch (e) {
      // only record the last error so the console won't blow up
      lastError = e
    }

    if (lastError) {
      log("Failed to process teasers", lastError)
    }

    this.teasers.length = 0
  }, 0)
}

function processTeaser(teaser: HTMLElement) {
  const viewsLabel = $(teaser).find(".views")
  const likesLabel = $(teaser).find(".likes")

  let likePercentage: number

  const likeRateLabel = viewsLabel.children("." + likeRateClass)

  if (likeRateLabel.length) {
    likePercentage = +likeRateLabel.text().trim().replace("%", "")
  } else {
    const views = parseAbbreviatedNumber(viewsLabel.text().trim())
    const likes = parseAbbreviatedNumber(likesLabel.text().trim())

    likePercentage = Math.round((1000 * likes) / views)

    const display = Number.isFinite(likePercentage) ? likePercentage + "%" : "/"

    // prettier-ignore
    viewsLabel.children().eq(0).clone()
            .addClass(likeRateClass)
            .text(display)
            .prependTo(viewsLabel);
  }

  if (likePercentage >= highlightThreshold.value && likeRateEnabled.value) {
    teaser.classList.add(highlightClass)
  } else {
    teaser.classList.remove(highlightClass)
  }
}

function updateHighlightOpacity() {
  const color = getComputedStyle(document.body).getPropertyValue("--primary").trim()

  // color will be empty before the page is fully loaded
  if (color) {
    document.body.style.setProperty("--ehg-hl-bg", adjustAlpha(color, highlightOpacity.value))
  }
}
