// ==UserScript==
// @name      Bilibili live - remove award dialog
// @noframes
// @grant     GM_addStyle
// @grant     GM_addStyle
// @match     *://live.bilibili.com/*
// @version   0.1
// ==/UserScript==
;(() => {
  "use strict"
  GM_addStyle(`
#anchor-guest-box-id {
  display: none;
}
`)
})()
