// ==UserScript==
// @name        Douyu Script
// @noframes
// @grant       GM_addStyle
// @match       *://www.douyu.com/*
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

  ready.then(() => {
    document.addEventListener("mouseleave", onLeave)
  })

  function onLeave(e) {
    if (e.target === document) {
      var _document$getElementB
      const stuckComment =
        null === (_document$getElementB = document.getElementById("comment-higher-container")) ||
        void 0 === _document$getElementB
          ? void 0
          : _document$getElementB.firstElementChild

      if (stuckComment) document.dispatchEvent(new MouseEvent("mousemove"))
    }
  }

  //asdasd
  console.log(`
aaaaaaaaaaaaaa
==================
bbbbbbbbbbbbb
`)
})()
