// ==UserScript==
// @name         GitHub Default Issues Filter
// @name:zh-CN   GitHub Issues 默认过滤器
// @description  Replaces GitHub issue's default filter
// @description:zh-CN替换 GitHub issues 的默认过滤器
// @noframes
// @grant        GM_info
// @grant        GM_addStyle
// @match        *://github.com/*
// @namespace    https://github.com/guansss
// @version      0.1
// @author       guansss
// @source       https://github.com/guansss/userscripts
// @runAt        document-start
// @supportURL   https://github.com/guansss/userscripts/issues
// ==/UserScript==
;(() => {
  "use strict"

  const ready = new Promise((resolve) => {
    if ("loading" === document.readyState)
      document.addEventListener("DOMContentLoaded", () => resolve)
    else resolve()
  })

  function hookMethod(object, method, callback) {
    const original = object[method]

    object[method] = function () {
      callback.apply(this, arguments)
      return original.apply(this, arguments)
    }
  }

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

  const urlRegex = /.*issues\/?$/
  const defaultFilters = "is:issue is:open "
  const targetFilters = "is:issue"

  let currentTask

  function cancelCurrentTask() {
    currentTask && currentTask.cancel()
  }

  function check(url) {
    if (urlRegex.test(url)) {
      cancelCurrentTask()

      currentTask = until(() => {
        const input = document.getElementById("js-issues-search")

        if (input && input.parentElement && "FORM" === input.parentElement.tagName) {
          // when navigating from pull requests to issues, the input is persisted until navigation completes,
          // so we should ensure the input value is as expected
          if (input.value === defaultFilters) {
            input.value = targetFilters
            input.parentElement.dispatchEvent(new SubmitEvent("submit", { bubbles: true }))

            return true
          }

          // cancel current task whenever the input is changed by user, usually this won't happen
          // since the interval is very short, but just in case the user is Shining Finger
          input.addEventListener("input", cancelCurrentTask, { once: true })
        }
      }, 100)
    }
  }

  const handleStateChange = (data, unused, url) => {
    if (url instanceof URL) url = url.href

    if (url) check(url)
  }

  hookMethod(history, "pushState", handleStateChange)
  hookMethod(history, "replaceState", handleStateChange)

  ready.then(() => check(location.href))
})()
