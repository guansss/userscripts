// ==UserScript==
// @name         Dev script
// @version      0.1
// @match        *://*/*
// @connect      *
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_addElement
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_log
// @grant        GM_getResourceText
// @grant        GM_getResourceURL
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_openInTab
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_getTab
// @grant        GM_saveTab
// @grant        GM_getTabs
// @grant        GM_notification
// @grant        GM_setClipboard
// @grant        GM_info
// ==/UserScript==

;(async function () {
  "use strict"

  const host = "http://127.0.0.1:9527"
  const scriptUrl = host + "/dev-impl.user.js"

  window.__devContext = {
    host,
  }

  GM_xmlhttpRequest({
    method: "GET",
    url: scriptUrl,
    responseType: "text",
    onload: (res) => {
      let source = res.responseText

      source = source.replace(`var scriptUrl;`, `var scriptUrl = "${scriptUrl}";`)

      eval(source)
    },
    ontimeout: () => {
      console.warn("Timeout when loading dev script, please check if the server is running.")
    },
  })
})()
