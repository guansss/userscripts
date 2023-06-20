// ==UserScript==
// @name        SD web UI
// @noframes
// @grant       GM_info
// @grant       GM_addStyle
// @require     https://unpkg.com/jquery@^3.6.0
// @require     https://unpkg.com/toastify-js@^1.12.0
// @match       *://127.0.0.1/*
// @namespace   https://github.com/guansss/userscripts
// @version     0.1
// @author      guansss
// @source      https://github.com/guansss/userscripts
// @supportURL  https://github.com/guansss/userscripts/issues
// ==/UserScript==
;(() => {
  "use strict"

  const ready = new Promise((resolve) => {
    if ("loading" === document.readyState)
      document.addEventListener("DOMContentLoaded", () => resolve())
    else resolve()
  })

  $

  function formatError(e) {
    let fallback = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "Unknown error"
    if ("string" === typeof e) return e || fallback

    if (null !== e && "object" === typeof e) {
      if (e instanceof Event && "error" === e.type) return "Failed to load resource"

      if (e.message) return e.message

      const str = String(e)
      return "[object Object]" === str ? fallback : str
    }

    return fallback
  }

  /**
   * Periodically calls given function until the return value is truthy.
   * @returns A CancelablePromise that resolves with the function's return value when truthy.
   */
  function until(fn) {
    let interval = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0
    let cancelOnReload = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : true
    let cancelled = false

    if (cancelOnReload);

    const STOP = Symbol()

    const promise = new Promise((resolve, reject) => {
      const run = () => {
        if (cancelled) return STOP

        const result = fn()

        if (result) {
          resolve(result)
          return STOP
        }
      }

      const timerId = setInterval(() => {
        try {
          if (run() === STOP) clearInterval(timerId)
        } catch (e) {
          reject(e)
          clearInterval(timerId)
        }
      }, interval)
    })
    promise.cancel = () => (cancelled = true)

    return promise
  }

  Toastify

  let hasErrored = false

  function ensureOptions(options) {
    return "string" === typeof options ? { text: options } : options
  }

  function toast(options) {
    options = ensureOptions(options)

    const toast = window.Toastify({
      duration: 2e3,
      close: true,
      ...options,
      text: `[${GM_info.script.name}]:
${options.text}`,
      style: { cursor: "initial", ...options.style },
    })

    toast.showToast()
  }

  function toastWarn(options) {
    options = ensureOptions(options)

    toast({ ...options, style: { background: "#ffbd69", ...options.style } })
  }

  function toastError(options) {
    // only show the first error, ignore the rest
    if (hasErrored) return

    hasErrored = true

    options = ensureOptions(options)

    toast({ ...options, duration: -1, style: { background: "#ff5f6d", ...options.style } })
  }

  let log

  setLogger(console.log)

  function setLogger(logger) {
    log = logger.bind(console, `[${GM_info.script.name}]`)
  }

  const KEY_SAVE = "Enter"

  async function control($root) {
    const modal = await until(() => $root.find("#lightboxModal")[0], 200)
    const txt2ImgSaveButton = await until(
      () => $root.find("#txt2img_images_history_button_panel>button")[0],
      200
    )
    const imgHistorySaveButton = await until(() => $root.find("#save_txt2img")[0], 200)

    function onKeydown(e) {
      if (e.key === KEY_SAVE && isVisible(modal)) {
        const saveButton = [txt2ImgSaveButton, imgHistorySaveButton].find((button) =>
          isVisible(button)
        )

        if (saveButton) {
          log("Pressing save button", saveButton)
          saveButton.click()
          toast("Saved")
        } else toastWarn("Not saved: no save button found.")
      }
    }

    document.addEventListener("keydown", onKeydown, { passive: true })
  }

  function isVisible(element) {
    let visible = isSelfVisible(element)

    $(element)
      .parents()
      .each((_, el) => {
        // if any ancestor is invisible, the element is invisible
        if (!isSelfVisible(el)) {
          visible = false
          return false
        }
      })

    return visible
  }

  function isSelfVisible(element) {
    const styles = window.getComputedStyle(element)

    return !(
      "none" === styles.display ||
      "hidden" === styles.visibility ||
      "0" === styles.opacity ||
      "none" === styles.pointerEvents
    )
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

  const image_viewerraw_literal_namespaceObject = `
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Image Viewer - Stable Diffusion</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                background-color: #000;
            }

            img {
                width: 100%;
                height: 100%;
                border: 0;
                object-fit: contain;
                display: none;
            }
        </style>
    </head>
    <body>
        <img />
    </body>
</html>
`

  async function imageViewer($root) {
    const gallery = await until(() => $root.find("#txt2img_gallery")[0], 200)
    const modal = await until(() => $root.find("#lightboxModal")[0], 200)

    const childWindow = window.open("about:blank", "sd-image-viewer", "width=800,height=600")

    if (!childWindow) throw new Error("Failed to open child window.")

    log("Connected to child window", childWindow)

    childWindow.document.open()
    childWindow.document.write(image_viewerraw_literal_namespaceObject)
    childWindow.document.close()

    const imgObserver = new SimpleMutationObserver((mutation) => {
      const img = mutation.target

      if (img && "IMG" === img.tagName && img.src.includes("/file=")) {
        const childImg = childWindow.document.getElementsByTagName("img")[0]

        if (childImg) {
          childImg.style.display = "block"
          childImg.src = img.src
        }

        return true
      }
    })

    const options = { attributes: true, attributeFilter: ["src"], subtree: true, immediate: true }
    imgObserver.observe(gallery, options)
    imgObserver.observe(modal, options)
  }

  ready.then(main)

  async function main() {
    if ("Stable Diffusion" !== $('meta[property="og:title"]').attr("content")) return

    try {
      const root = await until(() => {
        var _document$getElements
        return null === (_document$getElements = document.getElementsByTagName("gradio-app")[0]) ||
          void 0 === _document$getElements
          ? void 0
          : _document$getElements.shadowRoot
      }, 200)
      const $root = $(root)

      const results = await Promise.allSettled([imageViewer($root), control($root)])

      for (const result of results) if ("rejected" === result.status) throw result.reason
    } catch (e) {
      toastError(formatError(e))
    }
  }
})()

GM_addStyle(`
/*!
 * Toastify js 1.12.0
 * https://github.com/apvarun/toastify-js
 * @license MIT licensed
 *
 * Copyright (C) 2018 Varun A P
 */

.toastify {
    padding: 12px 20px;
    color: #ffffff;
    display: inline-block;
    box-shadow: 0 3px 6px -1px rgba(0, 0, 0, 0.12), 0 10px 36px -4px rgba(77, 96, 232, 0.3);
    background: linear-gradient(135deg, #73a5ff, #5477f5);
    position: fixed;
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.215, 0.61, 0.355, 1);
    border-radius: 2px;
    cursor: pointer;
    -webkit-text-decoration: none;
    text-decoration: none;
    max-width: calc(50% - 20px);
    z-index: 2147483647;
}

.toastify.on {
    opacity: 1;
}

.toast-close {
    background: transparent;
    border: 0;
    color: white;
    cursor: pointer;
    font-family: inherit;
    font-size: 1em;
    opacity: 0.4;
    padding: 0 5px;
}

.toastify-right {
    right: 15px;
}

.toastify-left {
    left: 15px;
}

.toastify-top {
    top: -150px;
}

.toastify-bottom {
    bottom: -150px;
}

.toastify-rounded {
    border-radius: 25px;
}

.toastify-avatar {
    width: 1.5em;
    height: 1.5em;
    margin: -7px 5px;
    border-radius: 2px;
}

.toastify-center {
    margin-left: auto;
    margin-right: auto;
    left: 0;
    right: 0;
    max-width: -webkit-fit-content;
    max-width: fit-content;
    max-width: -moz-fit-content;
}

@media only screen and (max-width: 360px) {
    .toastify-right, .toastify-left {
        margin-left: auto;
        margin-right: auto;
        left: 0;
        right: 0;
        max-width: -webkit-fit-content;
        max-width: -moz-fit-content;
        max-width: fit-content;
    }
}

`)
