// ==UserScript==
// @name         GitHub PR Description Helper
// @description  Helper for filling in PR descriptions
// @noframes
// @require      https://unpkg.com/jquery@^3.6.0
// @match        *://github.com/*
// @namespace    https://github.com/guansss
// @version      0.1
// @author       guansss
// @source       https://github.com/guansss/userscripts
// @supportURL   https://github.com/guansss/userscripts/issues
// ==/UserScript==
;(() => {
  "use strict"

  $

  const urlRegex = /\/compare\//

  const descriptionInputSelector = "#pull_request_body"
  const buttonId = "gh-pr-desc-fill"

  console.log("running")

  function onDescriptionFocus(event) {
    if (!urlRegex.test(location.href)) return

    const form = $(event.target).closest("form")
    const actionBar = form.find('button[name="draft"]').parent()

    if (actionBar.find(`#${buttonId}`).length) return

    $(`<button class="btn" id="${buttonId}">Fill with commits</button>`)
      .on("click", function (e) {
        e.preventDefault()

        const commits = form.find(".commit-ref")
        const commitMessages = commits
          .map((_, commit) => {
            const message = $(commit).find(".commit-title").text()
            const sha = $(commit).find(".sha").text()

            return `- ${message} (${sha})`
          })
          .get()

        form.find("#pull_request_body").val(commitMessages.join("\n"))
      })
      .prependTo(actionBar)
  }

  $(document).on("focus", descriptionInputSelector, onDescriptionFocus)
})()
