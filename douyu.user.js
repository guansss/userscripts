// ==UserScript==
// @name        Douyu Script
// @noframes
// @grant       GM_addStyle
// @match       *://www.douyu.com/*
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

  ready.then(() => {
    document.addEventListener("mouseleave", onLeave)
  })

  function onLeave(e) {
    if (e.target === document) {
      const stuckComment = document.getElementById("comment-higher-container")?.firstElementChild

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
