import { ref, watchEffect } from "vue"
import { hasClass, SimpleMutationObserver } from "../../@common/dom"
import { DEV_ONLY } from "../../@common/env"
import { log } from "../../@common/log"
import { parseAbbreviatedNumber } from "../../@common/number"
import { throttle, until } from "../../@common/timer"
import { page } from "../core/paging"
import { storage } from "../core/storage"

const likeRateEnabled = ref(storage.get("like_rates"))
const highlightThreshold = ref(storage.get("like_rate_highlight"))
const highlightOpacity = ref(storage.get("like_rate_highlight_opacity"))

const likeRateClass = "enh-like-rate"

watchEffect(() => {
  storage.set("like_rates", likeRateEnabled.value)

  if (likeRateEnabled.value) {
    document.body.classList.add("enh-show-like-rates")
  } else {
    document.body.classList.remove("enh-show-like-rates")
  }
})

watchEffect(() => {
  storage.set("like_rate_highlight", highlightThreshold.value)

  $(".videoTeaser, .imageTeaser")
    .parent()
    .each((i, teaser) => processTeaser(teaser))
})

watchEffect(() => {
  storage.set("like_rate_highlight_opacity", highlightOpacity.value)

  document.body.style.setProperty("--ehg-hl-op", highlightOpacity.value + "")
})

export function useTeaserSettings() {
  return {
    likeRateEnabled,
    highlightThreshold,
    highlightOpacity,
  }
}

page(["home", "videoList", "imageList", "subscriptions"] as const, async (pageID, onLeave) => {
  const teaserObserver = new SimpleMutationObserver((mutation) =>
    mutation.addedNodes.forEach(detectTeaser)
  )

  onLeave(() => {
    teaserObserver.disconnect()

    DEV_ONLY(() => $("." + likeRateClass).remove())
  })

  const teaserBatcher = new TeaserBatcher()

  if (pageID === "home") {
    const rows = $(".videoTeaser, .imageTeaser").closest(".row")

    if (!rows.length) {
      log("Could not find teaser rows.")
      return
    }

    rows.each((i, row) => detectRow(row))
  } else {
    const rowPromise = until(() => $(".videoTeaser, .imageTeaser").closest(".row")[0], 200)

    onLeave(() => rowPromise.cancel())

    detectRow(await rowPromise)
  }

  function detectRow(row: Node) {
    teaserObserver.observe(row, { childList: true, immediate: true })
  }

  function detectTeaser(teaser: Node) {
    if (isTeaser(teaser)) {
      teaserBatcher.add(teaser)
      teaserBatcher.run(processTeaser)
    }
  }
})

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

  let likePercentage

  const likeRateLabel = viewsLabel.children("." + likeRateClass)

  if (likeRateLabel.length) {
    likePercentage = +likeRateLabel.text().trim().replace("%", "")
  } else {
    const views = parseAbbreviatedNumber(viewsLabel.text().trim())
    const likes = parseAbbreviatedNumber(likesLabel.text().trim())

    likePercentage = views === 0 ? 0 : Math.round((1000 * likes) / views) / 10

    if (Number.isNaN(likePercentage)) {
      likePercentage = 0
    }

    // prettier-ignore
    viewsLabel.children().eq(0).clone()
            .addClass(likeRateClass)
            .text(likePercentage + '%')
            .appendTo(viewsLabel);
  }

  if (likePercentage >= highlightThreshold.value) {
    teaser.classList.add("enh-highlight")
  } else {
    teaser.classList.remove("enh-highlight")
  }
}

function isTeaser<E extends HTMLElement = HTMLElement>(node: Node): node is E {
  return (
    !!node.firstChild &&
    (hasClass(node.firstChild, "videoTeaser") || hasClass(node.firstChild, "imageTeaser"))
  )
}
