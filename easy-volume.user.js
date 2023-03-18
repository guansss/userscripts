// ==UserScript==
// @name        Easy volume
// @grant       GM_addStyle
// @grant       GM_info
// @grant       GM_addStyle
// @match       *:/*
// @namespace   https://github.com/guansss
// @version     0.1
// @author      guansss
// @source      https://github.com/guansss/userscripts
// @supportURL  https://github.com/guansss/userscripts/issues
// ==/UserScript==
;(() => {
  "use strict"

  let log

  setLogger(console.log)

  function setLogger(logger) {
    log = logger.bind(console, `[${GM_info.script.name}]`)
  }

  const schemes = []

  function register(scheme) {
    schemes.push(scheme)
  }

  function inIframe() {
    // https://stackoverflow.com/a/326076/13237325
    try {
      return window.self !== window.top
    } catch (e) {
      return true
    }
  }

  /**
   * MutationObserver that calls callback with just a single mutation.
   */
  class SimpleMutationObserver extends MutationObserver {
    // since calling `new NodeList()` is illegal, this is the only way to create an empty NodeList

    constructor(callback) {
      super((mutations) => {
        for (const mutation of mutations) if (this.callback(mutation)) break
      })
      this.callback = callback
    }

    /**
     * @param options.immediate - When observing "childList", immediately trigger a mutation with existing nodes.
     */
    observe(target, options) {
      super.observe(target, options)

      if (options && options.immediate && options.childList && target.childNodes.length)
        this.callback({
          target,
          type: "childList",
          addedNodes: target.childNodes,
          removedNodes: SimpleMutationObserver.emptyNodeList,
        })
    }
  }

  SimpleMutationObserver.emptyNodeList = document.querySelectorAll("#__absolutely_nonexisting")

  /**
   * Periodically calls given function until it returns true.
   */
  function repeat(fn) {
    let interval = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 200
    if (fn()) return 0

    const id = setInterval(() => {
      try {
        fn() && clearInterval(id)
      } catch (e) {
        log(e)
        clearInterval(id)
      }
    }, interval)

    return id
  }

  /**
   * Periodically calls given function until the return value is truthy.
   * @returns A CancelablePromise that resolves with the function's return value when truthy.
   */
  function until(fn) {
    let interval = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0
    let cancelled = false

    const promise = new Promise((resolve, reject) =>
      repeat(() => {
        if (cancelled) return true

        try {
          const result = fn()

          if (result) {
            resolve(result)

            // break the repeat() loop
            return true
          }
        } catch (e) {
          reject(e)
          return true
        }
      }, interval)
    )
    promise.cancel = () => (cancelled = true)

    return promise
  }

  /**
   * @returns A Promise that resolves/rejects with given Promise, and rejects on HMR during dev.
   */
  function alive(promise) {
    return false ? 0 : promise
  }

  const isInIframe = inIframe()

  const panelHeight = 250
  const barHeight = panelHeight - 40
  const trackHeight = barHeight - 12
  const originalTrackHeight = 48

  register({
    url: "live.bilibili.com",
    css: `
        .volume .volume-control {
            height: ${panelHeight}px !important;
        }`,
  })

  register({
    url: "www.bilibili.com/video",
    condition: !isInIframe,
    css: `
        .bilibili-player-video-volumebar-wrp {
            height: ${panelHeight}px !important;
        }
        .bilibili-player-video-volumebar {
            height: ${barHeight}px !important;
        }`,
    async run() {
      const volumeThumb = await alive(
        until(() => document.querySelector(".bilibili-player-video-volumebar-wrp .bui-thumb"), 700)
      )

      let currentStyle = ""

      const transformRule = "transform: translateY($px);"
      const numberCaptureRegex = /(-?\d+?\.?\d+?)/
      const transformRuleRegex = new RegExp(
        transformRule.replace(/[()]/g, "\\$&").replace("$", numberCaptureRegex.source)
      )

      const observer = new SimpleMutationObserver(() => {
        const newStyle = volumeThumb.style.cssText

        // compare the two styles to prevent the assignment from being observed,
        // which will cause a infinite loop
        if (currentStyle !== newStyle) {
          const match = transformRuleRegex.exec(newStyle)

          if (match) {
            let translateY = Number(match[1])

            if (!isNaN(translateY)) {
              translateY = ~~(translateY * (trackHeight / originalTrackHeight) * 100) / 100

              currentStyle =
                newStyle.slice(0, match.index) +
                transformRule.replace("$", String(translateY)) +
                newStyle.slice(match.index + match[0].length)

              volumeThumb.style.cssText = currentStyle
            }
          }
        }
      })
      observer.observe(volumeThumb, { attributes: true, attributeFilter: ["style"] })
    },
  })

  async function main() {
    for (const scheme of schemes) {
      const matchesURL =
        "string" === typeof scheme.url
          ? location.href.includes(scheme.url)
          : scheme.url.test(location.href)

      const meetsCondition =
        void 0 === scheme.condition
          ? true
          : "function" === typeof scheme.condition
          ? scheme.condition()
          : !!scheme.condition

      if (matchesURL && meetsCondition) {
        if (scheme.css) GM_addStyle(scheme.css)

        if (scheme.run) await scheme.run()

        break
      }
    }
  }

  // some websites prevent the console from reporting unhandled rejections,
  // then we need to manually log the error
  main().catch(log)
})()
