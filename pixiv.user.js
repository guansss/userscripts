// ==UserScript==
// @name        Pixiv Script (Private use)
// @noframes
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_info
// @grant       GM_addStyle
// @require     https://unpkg.com/jquery@^3.6.0
// @match       https://www.pixiv.net/*
// @namespace   https://github.com/guansss
// @version     0.1
// @author      guansss
// @source      https://github.com/guansss/userscripts
// @supportURL  https://github.com/guansss/userscripts/issues
// ==/UserScript==
;(() => {
  "use strict"

  const ready = new Promise((resolve) => {
    if ("loading" === document.readyState)
      document.addEventListener("DOMContentLoaded", () => resolve)
    else resolve()
  })

  $

  let log

  setLogger(console.log)

  function setLogger(logger) {
    log = logger.bind(console, `[${GM_info.script.name}]`)
  }

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

  const replacer_button = $('<button style="font-size: 12px">').text("Replace").on("click", run)
  const input = $('<textarea style="font-size: 12px">').val(
    GM_getValue("replacer", "example=example")
  )

  function replacer() {
    if (location.href.includes("/novel"))
      until(() => $("h1").first().parent().append(input, replacer_button).length, 200)
  }

  function run() {
    $(this)
      .closest("main")
      .find("main")
      .find("p span")
      .contents()
      .filter(function () {
        return 3 == this.nodeType
      })
      .each(function () {
        if (this.textContent) this.textContent = replace(this.textContent)
      })
  }

  function replace(text) {
    try {
      const rules = String(input.val())

      rules.split("\n").forEach((line) => {
        const [pattern, replacement] = line.split("=")

        if (!pattern || !replacement) return

        const regex = new RegExp(pattern, "gi")

        text = text.replace(regex, replacement)
      })

      GM_setValue("replacer", rules)
    } catch (e) {
      log(e)
      alert(e?.message || "Unknown error")
    }

    return text
  }

  ready.then(main)

  function main() {
    replacer()
  }
})()
