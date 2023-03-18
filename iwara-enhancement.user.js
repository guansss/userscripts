// ==UserScript==
// @name        Iwara Enhancement
// @name:zh-CN  Iwara增强
// @noframes
// @grant       unsafeWindow
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_download
// @grant       GM_info
// @grant       GM_addStyle
// @require     https://unpkg.com/jquery@^3.6.0
// @require     https://unpkg.com/vue@^3.2.20
// @require     https://unpkg.com/vue-i18n@^9.2.0-beta.26
// @match       *://*.iwara.tv/*
// @namespace   https://github.com/guansss
// @version     1.0
// @author      guansss
// @source      https://github.com/guansss/userscripts
// @runAt       document-start
// @updateURL   https://sleazyfork.org/scripts/416003-iwara-enhancement/code/Iwara%20Enhancement.user.js
// @supportURL  https://github.com/guansss/userscripts/issues
// ==/UserScript==
;(() => {
  "use strict"

  $

  const external_Vue_namespaceObject = Vue

  function onClickOutside(el, callback) {
    document.addEventListener("click", handler)

    function handler(e) {
      if (!el.contains(e.target)) {
        document.removeEventListener("click", handler)
        callback(e)
      }
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
  function hasClass(node, className) {
    return !!node.classList?.contains(className)
  }

  let log

  setLogger(console.log)

  function setLogger(logger) {
    log = logger.bind(console, `[${GM_info.script.name}]`)
  }

  const external_VueI18n_namespaceObject = VueI18n

  const en_namespaceObject = JSON.parse(
    '{"language":"English","name":"Iwara Enhancement","description":"Multiple UI enhancements for better experience.","ui":{"show_list_options":"Show options","hide_list_options":"Hide options"},"s":{"enabled":"Enabled","download":{"label":"Download","auto":{"label":"One-click Download","desc":"Automatically starts download when clicking the download button.","warn":"This feature requires Tampermonkey.","warn_tm":["This feature requires Tampermonkey\'s <b>Browser API</b> download mode, please follow these steps:","Navigate to Tampermonkey\'s settings panel and then the <b>Settings</b> tab.","In <b>General</b> section, set <b>Config Mode</b> to <b>Advanced</b> (or <b>Beginner</b>).","In <b>Downloads BETA</b> section, set <b>Download Mode</b> to <b>Browser API</b>.","In <b>Downloads BETA</b> section, click <b>Save</b>.","Grant permission if requested.","Refresh this page."]},"resolution":{"label":"Preferred Resolution for Download"},"filename":{"label":"Filename","desc":"Filename template to use when downloading a video.<br>Each keyword should be surrounded by <b>{\'{ }\'}</b>.","preview":"Preview","key":{"id":"video\'s ID","title":"video\'s title","res":"video\'s resolution","author":"author\'s name","date":"date time when the download starts","up_date":"date time when the video was uploaded","date_ts":"DATE in timestamp format","up_date_ts":"UP_DATE in timestamp format"}}},"ui":{"label":"UI","like_rate":{"label":"Like rate","desc":"Displays like rates in video and image list."},"highlight_threshold":{"label":"Highlight threshold","desc":"Highlights video and image items over certain like rate."},"highlight_bg":{"label":"Highlight opacity"}},"script":{"label":"Script","language":{"label":"Language"}}}}'
  )

  const zh_namespaceObject = JSON.parse(
    '{"language":"中文","name":"Iwara增强","description":"多种增强体验的界面优化","s":{"enabled":"启用","download":{"label":"下载","auto":{"label":"一键下载","desc":"点击下载按钮时自动开始下载","warn":"该功能仅在 Tampermonkey 中可用","warn_tm":["该功能需要启用 Tampermonkey 的<b>浏览器 API</b>下载模式，请按照以下步骤启用：","进入 Tampermonkey 的设置面板，选择<b>设置</b>标签页","在<b>通用</b>里，设置<b>配置模式</b>为<b>高级<b>（或者<b>初学者</b>）","在<b>下载 BETA</b>里，设置<b>下载模式</b>为<b>浏览器 API</b>","在<b>下载 BETA</b>里，点击<b>保存</b>","如果请求权限的话，选择同意","刷新当前页面"]},"resolution":{"label":"优先下载的分辨率"},"filename":{"label":"文件名","desc":"下载视频时使用的文件名模板<br>每个关键词必须使用 <b>{\'{ }\'}</b> 来包围","preview":"预览","key":{"id":"视频 ID","title":"视频标题","author":"作者名","res":"视频分辨率","date":"下载开始时的日期和时间","up_date":"视频发布时的日期和时间","date_ts":"DATE 的时间戳格式","up_date_ts":"UP_DATE 的时间戳格式"}}},"ui":{"label":"界面","like_rate":{"label":"喜爱率","desc":"在视频和图片列表里显示喜爱率"},"highlight_threshold":{"label":"高亮分界点","desc":"喜爱率高于此值的视频和图片将会被高亮显示"},"highlight_bg":{"label":"高亮透明度"}},"script":{"label":"脚本","language":{"label":"语言"}}}}'
  )

  /* harmony default export */ const i18n = { zh: zh_namespaceObject, en: en_namespaceObject }

  function createStorage(prefix, schema) {
    if (prefix) prefix += "."

    return {
      get(key) {
        return GM_getValue(prefix + key, schema[key])
      },
      set(key, val) {
        if ("function" === typeof val) val = val(this.get(key))

        GM_setValue(prefix + key, val)
      },
    }
  }

  const storage = createStorage("", {
    v: GM_info.script.version,
    locale: navigator.language,
    volume: 0.5,
    auto_down_enabled: true,
    preferred_res: "Source",
    filename: "{DATE} {TITLE} - {AUTHOR} ({ID})",
    dark: false,
    like_rates: true,
    like_rate_highlight: 4,
    like_rate_highlight_opacity: 0.2,
    player_size: 100,
    hide_list_options: false,
  })

  const i18n_i18n = (0, external_VueI18n_namespaceObject.createI18n)({
    locale: storage.get("locale"),
    fallbackLocale: "en",
    messages: i18n,

    // disable warnings - I know what I'm doing!!
    silentFallbackWarn: true,
    silentTranslationWarn: true,
    warnHtmlInMessage: "off",
  })

  function matchLocale(locale) {
    return i18n_i18n.global.availableLocales.includes(locale)
      ? locale
      : i18n_i18n.global.availableLocales.find((loc) => locale.startsWith(loc)) || "en"
  }

  // shorthand helper making TypeScript happy
  function localize(message) {
    // @ts-ignore TS2589: Type instantiation is excessively deep and possibly infinite.
    return i18n_i18n.global.t(message)
  }

  const locale = (0, external_Vue_namespaceObject.ref)(storage.get("locale"))

  ;(0, external_Vue_namespaceObject.watchEffect)(() => {
    i18n_i18n.global.locale = locale.value

    storage.set("locale", locale.value)
  })

  function useConfigSettings() {
    // locale that will actually be used, with fallback applied
    const activeLocale = (0, external_Vue_namespaceObject.computed)(() => matchLocale(locale.value))

    return { locale, activeLocale }
  }

  /* harmony default export */ function mitt(n) {
    return {
      all: (n = n || new Map()),
      on: function (t, e) {
        var i = n.get(t)
        i ? i.push(e) : n.set(t, [e])
      },
      off: function (t, e) {
        var i = n.get(t)
        i && (e ? i.splice(i.indexOf(e) >>> 0, 1) : n.set(t, []))
      },
      emit: function (t, e) {
        var i = n.get(t)
        i &&
          i.slice().map(function (n) {
            n(e)
          }),
          (i = n.get("*")) &&
            i.slice().map(function (n) {
              n(t, e)
            })
      },
    }
  }

  const ready = new Promise((resolve) => {
    if ("loading" === document.readyState)
      document.addEventListener("DOMContentLoaded", () => resolve)
    else resolve()
  })

  function once(emitter, event, listener) {
    const fn = (data) => {
      emitter.off(event, fn)
      listener(data)
    }

    emitter.on(event, fn)

    return fn
  }

  function setupPaging() {
    ready.then(() => {
      const appDiv = document.getElementById("app")

      if (!appDiv) {
        log("Missing app div.")
        return
      }

      log("Start observing pages.")

      const appObserver = new SimpleMutationObserver((mutation) => {
        detectPageChange(appDiv, mutation.addedNodes, "pageEnter")
        detectPageChange(appDiv, mutation.removedNodes, "pageLeave")
      })
      appObserver.observe(appDiv, { childList: true, immediate: true })
    })
  }

  const emitter = mitt()

  let currentClassName = ""

  emitter.on("pageEnter", (className) => (currentClassName = className))

  const ALL = "*"

  // page listener for iwara
  function page(id, enter) {
    const match = (() => {
      if (id === ALL) return () => id

      const ids = "string" === typeof id ? [id] : id
      const classes = ids.map((id) => `page-${id}`)

      return (className) => {
        const split = className.split(" ")
        const index = classes.findIndex((cls) => split.includes(cls))

        return ids[index]
      }
    })()

    function callIfMatch(listener) {
      return (className) => {
        const matchedID = match(className)

        if (void 0 !== matchedID)
          try {
            listener(matchedID)
          } catch (e) {
            log("Error executing page listener", e)
          }
      }
    }

    const onPageEnter = callIfMatch((matchedID) => {
      enter(matchedID, (onLeave) => {
        once(emitter, "pageLeave", callIfMatch(onLeave))
      })
    })

    emitter.on("pageEnter", onPageEnter)
  }

  function detectPageChange(appDiv, nodes, event) {
    if (nodes.length)
      // a valid class name will be like "page page-videoList", where "videoList" is the ID
      for (const node of nodes)
        if (hasClass(node, "page")) {
          // sometimes there are two (maybe more) "page" elements, and one of them contains only the "page" class,
          // we ignore it in this case
          const hasOtherPageElements =
            $(appDiv)
              .children(".page")
              .filter((_, e) => e !== node).length > 0

          if (!hasOtherPageElements) emitter.emit(event, node.className)
          break
        }
  }
  let reactEventHandlersKey = ""

  function getReactEventHandlers(element) {
    if (reactEventHandlersKey) return element[reactEventHandlersKey]

    for (const key of Object.keys(element))
      if (key.startsWith("__reactEventHandlers$")) {
        reactEventHandlersKey = key
        return element[key]
      }
  }

  function clamp(val, min, max) {
    return val < min ? min : val > max ? max : val
  }

  function formatDate(date) {
    let delimiter = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "/"
    return [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
    ]
      .map((num) => String(num).padStart(2, "0"))
      .join(delimiter)
  }

  function adjustHexColor(color, amount) {
    return color.replace(/\w\w/g, (color) =>
      clamp(parseInt(color, 16) + amount, 0, 255)
        .toString(16)
        .padStart(2, "0")
    )
  }

  // sometimes I just don't want the script to depend on Lodash...
  function throttle(fn, timeout) {
    let timer = 0

    return function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++)
        args[_key] = arguments[_key]
      if (timer) return

      timer = setTimeout(() => {
        fn.apply(null, args)

        timer = 0
      }, timeout)
    }
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

  // a partial structure of the video data defined in iwara's video page,
  // including only the properties we need

  const FILENAME_KEYWORDS = [
    "ID",
    "TITLE",
    "RES",
    "AUTHOR",
    "DATE",
    "UP_DATE",
    "DATE_TS",
    "UP_DATE_TS",
  ]
  const RESOLUTIONS = ["Source", "540p", "360p"]

  const autoEnabled =
    "browser" === GM_info.downloadMode
      ? (0, external_Vue_namespaceObject.ref)(storage.get("auto_down_enabled"))
      : false
  const filenameTemplate = (0, external_Vue_namespaceObject.ref)(storage.get("filename"))
  const resolution = (0, external_Vue_namespaceObject.ref)(storage.get("preferred_res"))

  const videoInfo = (0, external_Vue_namespaceObject.reactive)({
    id: "",
    title: "",
    author: "",
    created: 0,
    size: 0,
    error: "",
  })
  const sources = (0, external_Vue_namespaceObject.reactive)([])
  const source = (0, external_Vue_namespaceObject.computed)(
    () =>
      sources.find((_ref) => {
        let { label } = _ref
        return label === resolution.value
      }) || sources[0]
  )

  // indicates whether the sources belong to current page
  const hasFreshSources = (0, external_Vue_namespaceObject.ref)(false)

  const filename = (0, external_Vue_namespaceObject.computed)(() => {
    try {
      if (!source.value) throw "Please open a video"

      return resolveFilename(filenameTemplate.value, source.value)
    } catch (e) {
      return `Unable to resolve filename (${e.message || e})`
    }
  })

  ;(0, external_Vue_namespaceObject.watchEffect)(() =>
    storage.set("preferred_res", resolution.value)
  )
  ;(0, external_Vue_namespaceObject.watchEffect)(() =>
    storage.set("filename", filenameTemplate.value)
  )

  if ("boolean" !== typeof autoEnabled) {
    ;(0, external_Vue_namespaceObject.watchEffect)(() =>
      storage.set("auto_down_enabled", autoEnabled.value)
    )
    ;(0, external_Vue_namespaceObject.watchEffect)(() =>
      convertDownloadDropdown(void 0, autoEnabled.value, source.value)
    )
  }

  function useDownloaderSettings() {
    return {
      FILENAME_KEYWORDS,
      RESOLUTIONS,
      autoDownEnabled: autoEnabled,
      resolution,
      filenameTemplate,
      filenamePreview: filename,
    }
  }

  page("video", (pageID, onLeave) => {
    const videoActions = $(".page-video__actions").get(0)

    if (!videoActions) {
      log("Could not find video actions.")
      return
    }

    const actionsObserver = new SimpleMutationObserver((mutation) =>
      mutation.addedNodes.forEach((node) => {
        if (hasClass(node, "dropdown")) {
          updateVideoInfo(videoActions)
          updateSources(node)

          if (autoEnabled && autoEnabled.value) convertDownloadDropdown(node, true, source.value)
        }
      })
    )
    actionsObserver.observe(videoActions, { childList: true, immediate: true })

    onLeave(() => {
      // prevent unexpected downloads
      hasFreshSources.value = false

      actionsObserver.disconnect()
    })
  })

  function updateVideoInfo(videoActions) {
    try {
      // FIXME: reading the prop by a path is quite unreliable, any improvement?
      const video = getReactEventHandlers(videoActions).children[1].props.video

      videoInfo.id = video.id
      videoInfo.title = video.title
      videoInfo.created = new Date(video.createdAt).getTime()
      videoInfo.author = video.user.name
      videoInfo.size = video.file.size
    } catch (e) {
      log(e)
      videoInfo.error = e + ""
    }
  }

  function updateSources(downloadDropdown) {
    const newSources = $(downloadDropdown)
      .find(".dropdown__content a")
      .map(function () {
        const url = this.href
        const label = this.innerText

        return { url, label }
      })
      .get()

    if (!newSources.length) return

    sources.splice(0, sources.length, ...newSources)

    hasFreshSources.value = true
  }

  function convertDownloadDropdown(downloadDropdown, enabled, source) {
    // @ts-ignore The parameter is valid but TS doesn't recognize it
    const $dropdown = $(downloadDropdown || ".page-video__actions > .dropdown")
    const $button = $dropdown.find(".downloadButton")
    const rawButtonText = $button.text().replace(/\s*\(.*\)/, "")

    if (enabled) {
      if (!$dropdown.data("converted"))
        $dropdown
          .data("converted", true)
          .on("click", function () {
            download(this)
          })
          .children(".dropdown__content")
          .css("display", "none")

      $button.text(rawButtonText + (source ? ` (${source.label})` : ""))
    } else {
      $dropdown
        .data("converted", false)
        .off("click")
        .children(".dropdown__content")
        .css("display", "")
      $button.text(rawButtonText)
    }
  }

  function download(downloadDropdown) {
    try {
      if (!hasFreshSources.value) throw new Error("No sources found in current page.")
      if (!source.value) throw new Error("Missing source.")
      if ("browser" !== GM_info.downloadMode)
        throw new Error(`Invalid download mode "${GM_info.downloadMode}".`)

      const $downloadButton = $(downloadDropdown).find(".downloadButton")

      // TODO: properly disable the button
      $(downloadDropdown).css("pointer-events", "none")
      $downloadButton.css("background-color", "var(--primary-dark)")

      const filename = resolveFilename(filenameTemplate.value, source.value)

      log("Downloading:", filename, source.value.url)

      if (false);

      GM_download({
        url: source.value.url,
        name: filename,
        saveAs: true,
        onload: () => downloadEnded("onload"),
        onerror: (e) => downloadEnded("onerror", e),
        ontimeout: () => downloadEnded("ontimeout"),
      })

      function downloadEnded(type, e) {
        $(downloadDropdown).css("pointer-events", "")
        $downloadButton.css("background-color", "")

        if ("ontimeout" === type) e = { error: "timed_out" }

        if (e && e.error) {
          log(e)
          printDownloadMessage(
            `Download Error (${e.error}): ${(e.details && e.details.current) || "No info"}`
          )
        }
      }
    } catch (e) {
      log(e)
      printDownloadMessage(e + "")
    }
  }

  function resolveFilename(template, source) {
    if (videoInfo.error) throw new Error("Broken video info: " + videoInfo.error)

    const replacements = {
      ID: videoInfo.id,
      TITLE: videoInfo.title,
      RES: source.label,
      AUTHOR: videoInfo.author,
      DATE: formatDate(new Date()),
      DATE_TS: new Date().getTime() + "",
      UP_DATE: formatDate(new Date(videoInfo.created)),
      UP_DATE_TS: videoInfo.created + "",
    }

    let basename = template

    for (const [key, value] of Object.entries(replacements))
      basename = basename.replace(new RegExp(`{${key}}`, "g"), value)

    // strip characters disallowed in file path
    basename = basename.replace(/[*/:<>?\\|]/g, "")

    const ext = source.url.slice(source.url.lastIndexOf("."))

    return basename + ext
  }

  function printDownloadMessage(msg) {
    $(".page-video__bottom")
      .css("flex-wrap", "wrap")
      .append(`<div style="flex: 100% 0 0">${msg}</div>`)
  }

  const likeRateEnabled = (0, external_Vue_namespaceObject.ref)(storage.get("like_rates"))
  const highlightThreshold = (0, external_Vue_namespaceObject.ref)(
    storage.get("like_rate_highlight")
  )
  const highlightOpacity = (0, external_Vue_namespaceObject.ref)(
    storage.get("like_rate_highlight_opacity")
  )

  const likeRateClass = "enh-like-rate"

  ;(0, external_Vue_namespaceObject.watchEffect)(() => {
    storage.set("like_rates", likeRateEnabled.value)

    if (likeRateEnabled.value) document.body.classList.add("enh-show-like-rates")
    else document.body.classList.remove("enh-show-like-rates")
  })

  ;(0, external_Vue_namespaceObject.watchEffect)(() => {
    storage.set("like_rate_highlight", highlightThreshold.value)

    $(".videoTeaser, .imageTeaser")
      .parent()
      .each((i, teaser) => processTeaser(teaser))
  })

  ;(0, external_Vue_namespaceObject.watchEffect)(() => {
    storage.set("like_rate_highlight_opacity", highlightOpacity.value)

    document.body.style.setProperty("--ehg-hl-op", highlightOpacity.value + "")
  })

  function useTeaserSettings() {
    return { likeRateEnabled, highlightThreshold, highlightOpacity }
  }

  page(["home", "videoList", "imageList", "subscriptions"], async (pageID, onLeave) => {
    const teaserObserver = new SimpleMutationObserver((mutation) =>
      mutation.addedNodes.forEach(detectTeaser)
    )

    onLeave(() => {
      teaserObserver.disconnect()
    })

    const teaserBatcher = new TeaserBatcher()

    if ("home" === pageID) {
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

    function detectRow(row) {
      teaserObserver.observe(row, { childList: true, immediate: true })
    }

    function detectTeaser(teaser) {
      if (isTeaser(teaser)) {
        teaserBatcher.add(teaser)
        teaserBatcher.run(processTeaser)
      }
    }
  })

  class TeaserBatcher {
    constructor() {
      this.teasers = []

      this.run = throttle((callback) => {
        let lastError

        try {
          this.teasers.forEach(callback)
        } catch (e) {
          // only record the last error so the console won't blow up
          lastError = e
        }

        if (lastError) log("Failed to process teasers", lastError)

        this.teasers.length = 0
      }, 0)
    }

    add(teaser) {
      this.teasers.push(teaser)
    }
  }

  function processTeaser(teaser) {
    const viewsLabel = $(teaser).find(".views")
    const likesLabel = $(teaser).find(".likes")

    let likePercentage

    const likeRateLabel = viewsLabel.children("." + likeRateClass)

    if (likeRateLabel.length) likePercentage = +likeRateLabel.text().trim().replace("%", "")
    else {
      let [views, likes] = [viewsLabel, likesLabel].map((icon) => {
        const value = icon.text().trim()

        return value.includes("k") ? 1e3 * +value.slice(0, -1) : +value
      })

      likePercentage = 0 === views ? 0 : Math.round((1e3 * likes) / views) / 10

      // prettier-ignore
      viewsLabel.children().eq(0).clone().addClass(likeRateClass).text(likePercentage+"%").appendTo(viewsLabel)
    }

    if (likePercentage >= highlightThreshold.value) teaser.classList.add("enh-highlight")
    else teaser.classList.remove("enh-highlight")
  }

  function isTeaser(node) {
    return (
      !!node.firstChild &&
      (hasClass(node.firstChild, "videoTeaser") || hasClass(node.firstChild, "imageTeaser"))
    )
  }

  // extracted by mini-css-extract-plugin
  /* harmony default export */ const Settings_module = {
    switch: "Settings-module__switch--qcsG",
    settings: "Settings-module__settings--alpJ",
    active: "Settings-module__active--iMRv",
    disabled: "Settings-module__disabled--vvjv",
    header: "Settings-module__header--s2Rw",
    title: "Settings-module__title--aDU_",
    view: "Settings-module__view--dY2E",
    sectionHeader: "Settings-module__section-header--Xy_I",
    fieldLabel: "Settings-module__field-label--O5EA",
    labelBlock: "Settings-module__label-block--EYVa",
    labelInline: "Settings-module__label-inline--v3DK",
    warn: "Settings-module__warn--KbCV",
  }

  // recommended vscode plugin for syntax highlighting: https://marketplace.visualstudio.com/items?itemName=Tobermory.es6-string-html
  // language=HTML
  const template = /* html */ `
    <div class='text text--text text--bold'>E</div>



    <div v-if='visible' :class='css.settings' @click.stop>
        <header :class='css.header'>
            <h2 :class='css.title'>{{ $t('name') }} v${GM_info.script.version}</h2>
        </header>
        <nav>
            <ul>
                <li
                    v-for='tab, i in tabs'
                    :class='{ [css.active]: i === tabIndex }'
                    @click='tabIndex = i'
                >
                    {{ $t(tab.name) }}
                </li>
            </ul>
        </nav>
        <div v-if='tabVal === "ui"' :class='css.view'>
            <h2 :class='css.sectionHeader'>{{ $t('s.ui.label') }}</h2>



            <h3 :class='css.fieldLabel'>{{ $t('s.ui.like_rate.label') }}</h3>
            <p v-html='$t("s.ui.like_rate.desc")'></p>
            <p>
                <label :class='css.labelBlock'>
                    {{ $t('s.enabled') }}
                    <input type='checkbox' v-model='likeRateEnabled'>
                </label>
            </p>



            <h3 :class='css.fieldLabel'>{{ $t('s.ui.highlight_threshold.label') }}</h3>
            <p v-html='$t("s.ui.highlight_threshold.desc")'></p>
            <p>
                <input type='number' step='0.1' min='0' max='100' :value='highlightThreshold' @change='highlightThreshold = +$event.target.value'>
            </p>
            <h3 :class='css.fieldLabel'>{{ $t('s.ui.highlight_bg.label') }}</h3>
            <p>
                <input type="range" min="0" max="1" step="0.01" v-model='highlightOpacity'>
            </p>
        </div>
        <div v-else-if='tabVal === "download"' :class='css.view'>
            <h2 :class='css.sectionHeader'>{{ $t('s.download.label') }}</h2>



            <h3 :class='css.fieldLabel'>{{ $t('s.download.auto.label') }}</h3>
            <p v-html='$t("s.download.auto.desc")'></p>
            <p v-if='!downloadMode' v-html='$t("s.download.auto.warn")'></p>
            <section v-else-if='downloadMode !== "browser"' :class='css.warn'>
                <p v-html='$tm("s.download.auto.warn_tm")[0]'></p>
                <ol>
                    <li v-for='line in $tm("s.download.auto.warn_tm").slice(1)'><p v-html='line'></p></li>
                </ol>
            </section>
            <p>
                <label :class='[css.labelBlock, { [css.disabled]: downloadMode !== "browser" }]'>
                    {{ $t('s.enabled') }}
                    <input type='checkbox' :disabled='downloadMode !== "browser"' v-model='autoDownEnabled'>
                </label>
            </p>



            <h3 :class='css.fieldLabel'>{{ $t('s.download.resolution.label') }}</h3>
            <p>
                <label v-for='res in RESOLUTIONS' :class='css.labelInline'>
                    <input type='radio' name='res' :value='res' v-model='resolution'>
                    {{ res }}
                </label>
            </p>



            <h3 :class='css.fieldLabel'>{{ $t('s.download.filename.label') }}</h3>
            <p v-html='$t("s.download.filename.desc")'></p>
            <div :class='css.keywords'>
                <table :class='css.keywordTable'>
                    <tr v-for='kw in FILENAME_KEYWORDS'>
                        <th>{{ kw }}</th>
                        <td>{{ $t('s.download.filename.key.' + kw.toLowerCase()) }}</td>
                    </tr>
                </table>
            </div>
            <input type='text' v-model='filenameTemplate'>
            <p>{{ $t('s.download.filename.preview') + ': ' + filenamePreview }}</p>
        </div>
        <div v-if='tabVal === "script"' :class='css.view'>
            <h2 :class='css.sectionHeader'>{{ $t('s.script.label') }}</h2>



            <h3 :class='css.fieldLabel'>{{ $t('s.script.language.label') }}</h3>
            <p>
                <label v-for='loc in $i18n.availableLocales' :class='css.labelBlock'>
                    <input type='radio' name='loc' :value='loc' :checked='activeLocale === loc' @change='locale = loc'>
                    {{ $t('language', loc) }}
                </label>
            </p>
        </div>
    </div>
`

  function setup() {
    const tabs = [
      { name: "s.ui.label", val: "ui" },
      { name: "s.download.label", val: "download" },
      { name: "s.script.label", val: "script" },
    ]
    const tabIndex = (0, external_Vue_namespaceObject.ref)(0)
    const tabVal = (0, external_Vue_namespaceObject.computed)(
      () => tabs[tabIndex.value] && tabs[tabIndex.value].val
    )
    const visible = (0, external_Vue_namespaceObject.ref)(false)

    const onClickContainer = () => {
      visible.value = !visible.value

      if (visible.value) onClickOutside(settingsContainer, () => (visible.value = false))
    }

    settingsContainer.addEventListener("click", onClickContainer)

    ;(0, external_Vue_namespaceObject.onBeforeUnmount)(() => {
      settingsContainer.removeEventListener("click", onClickContainer)
    })

    return {
      css: Settings_module,
      tabs,
      tabIndex,
      tabVal,
      visible,
      downloadMode: GM_info.downloadMode,
      ...useDownloaderSettings(),
      ...useConfigSettings(),
      ...useTeaserSettings(),
    }
  }

  const SETTINGS_ID = "enh-settings"

  const settingsContainer = $(
    `<div id="${SETTINGS_ID}" class='header__link ${Settings_module["switch"]}'></div>`
  )[0]

  let app

  page(ALL, (pageID, onLeave) => {
    const destination = $(".page .header__content:first-of-type .dropdown:last-of-type")[0]

    if (destination) {
      // destination element will be destroyed everytime the page changes,
      // so we need to insert the container after every page change
      destination.before(settingsContainer)

      // lazy-init the app
      if (!app) {
        app = (0, external_Vue_namespaceObject.createApp)({ template, setup })

        app.use(i18n_i18n)

        if (true)
          // pending fix https://github.com/vuejs/core/pull/5197
          // @ts-ignore
          unsafeWindow.Vue = Vue

        app.mount(settingsContainer)

        log("Settings view initialized")
      }
    } else log("Could not insert settings view: container not found.")
  })

  // prevent Sentry from tracking the logging
  setLogger(console.log.__sentry_original__ || console.log)

  const toggleButtonID = "enh-hide-options-btn"

  page(["videoList", "imageList"], (pageID, onLeave) => {
    const hideOptions = (0, external_Vue_namespaceObject.ref)(storage.get("hide_list_options"))
    const toggleText = (0, external_Vue_namespaceObject.computed)(() =>
      localize(hideOptions.value ? "ui.show_list_options" : "ui.hide_list_options")
    )

    const optionsContainer = $(".sortFilter").eq(0).closest(".col-lg-3")

    const toggleButton = $(
      `<button id="${toggleButtonID}" class="button button--primary button--ghost d-lg-none" type="button"></button>`
    )
      .insertBefore(optionsContainer)
      .on("click", () => (hideOptions.value = !hideOptions.value))

    ;(0, external_Vue_namespaceObject.watchEffect)(() => {
      storage.set("hide_list_options", hideOptions.value)
      optionsContainer.toggleClass("d-none", hideOptions.value)
    })

    ;(0, external_Vue_namespaceObject.watchEffect)(() => {
      toggleButton.text(toggleText.value)
    })
  })

  const state = (0, external_Vue_namespaceObject.reactive)({ theme: "light" })

  setInterval(() => {
    state.theme = localStorage.theme
  }, 1e3)

  ;(0, external_Vue_namespaceObject.watchEffect)(updateTheme)

  function updateTheme() {
    const theme = state.theme
    const adjustmentSign = "light" === theme ? -1 : 1
    const bodyColor = getComputedStyle(document.body).getPropertyValue("--body")

    document.body.style.setProperty(
      "--enh-body-focus",
      adjustHexColor(bodyColor, 15 * adjustmentSign)
    )
    document.body.style.setProperty(
      "--enh-body-highlight",
      adjustHexColor(bodyColor, 30 * adjustmentSign)
    )
  }

  async function main() {
    document.body.classList.add("enh-body")

    setupPaging()
  }

  main()
})()

GM_addStyle(`
.Settings-module__switch--qcsG {
  cursor: pointer;
}

.Settings-module__settings--alpJ {
  position: absolute;
  z-index: 1000;
  top: 100%;
  right: 0;
  width: 400px;
  background: var(--body);
  font-size: 14px;
  border: 2px solid var(--primary);
  border-top: none;
  cursor: default;
}

.Settings-module__settings--alpJ nav {
    padding: 0 16px;
    border-bottom: 1px solid var(--enh-body-highlight);
  }

.Settings-module__settings--alpJ nav ul {
      margin: 0;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
    }

.Settings-module__settings--alpJ nav li {
      padding: 8px 16px;
      list-style-type: none;
      cursor: pointer;
    }

.Settings-module__settings--alpJ nav li:hover {
        background: var(--enh-body-focus);
      }

.Settings-module__settings--alpJ nav li.Settings-module__active--iMRv {
        background: var(--enh-body-highlight);
      }

.Settings-module__settings--alpJ p {
    color: var(--muted);
  }

.Settings-module__settings--alpJ p,
  .Settings-module__settings--alpJ section {
    margin-bottom: 8px;
  }

.Settings-module__settings--alpJ a {
    font-weight: bold;
    cursor: pointer;
  }

.Settings-module__settings--alpJ ol {
    padding-left: 20px;
  }

.Settings-module__settings--alpJ table {
    margin: 16px 0;
    width: 100%;
    background: var(--enh-body-focus);
    border: 1px solid var(--enh-body-highlight);
    border-collapse: collapse;
  }

.Settings-module__settings--alpJ th {
    text-align: right;
  }

.Settings-module__settings--alpJ th,
  .Settings-module__settings--alpJ td {
    padding: 4px 8px;
    border: 1px solid var(--enh-body-highlight);
  }

.Settings-module__settings--alpJ label {
    cursor: pointer;
  }

.Settings-module__settings--alpJ label:hover {
      background: var(--enh-body-focus);
    }

.Settings-module__settings--alpJ label input {
      cursor: pointer;
    }

.Settings-module__settings--alpJ label.Settings-module__disabled--vvjv {
      cursor: not-allowed;
    }

.Settings-module__settings--alpJ label.Settings-module__disabled--vvjv input {
        cursor: not-allowed;
      }

.Settings-module__settings--alpJ input[type="text"] {
    outline: none !important;
  }

.Settings-module__settings--alpJ input[type="text"] {
    margin-bottom: 16px;
    width: 100%;
    padding: 8px;
    background: var(--enh-body-focus);
    color: var(--text);
    border: 2px solid var(--enh-body-highlight);
    border-radius: 3px;
  }

.Settings-module__settings--alpJ input[type="text"]:hover,
    .Settings-module__settings--alpJ input[type="text"]:focus {
      background: var(--enh-body-highlight);
    }

.Settings-module__header--s2Rw {
  padding: 0 16px;
}

.Settings-module__title--aDU_ {
  margin-top: 4px;
}

.Settings-module__view--dY2E {
  padding: 16px;
}

.Settings-module__section-header--Xy_I {
  margin-bottom: 16px;
}

.Settings-module__field-label--O5EA {
  position: relative;
  margin: 16px 0;
  padding-top: 16px;
}

.Settings-module__field-label--O5EA:not(:first-of-type) {
    border-top: 1px solid var(--enh-body-highlight);
  }

.Settings-module__label-block--EYVa {
  display: flex;
  padding: 8px 8px 8px 0;
}

.Settings-module__label-block--EYVa input[type="checkbox"] {
    margin-left: auto;
  }

.Settings-module__label-inline--v3DK {
  padding: 8px 8px 8px 0;
}

.Settings-module__label-inline--v3DK:not(:first-child) {
    padding-left: 8px;
  }

.Settings-module__label-inline--v3DK:not(:last-child) {
    margin-right: 8px;
  }

.Settings-module__warn--KbCV {
  padding: 8px;
  background-color: #594c00;
}

.enh-body {
    --ehg-hl-op: 0.2;
}

#enh-settings {
    position: relative;
}

#enh-settings * {
        box-sizing: border-box;
    }

.enh-like-rate {
    display: none;
}

.enh-show-like-rates .videoTeaser .views .text, .enh-show-like-rates .imageTeaser .views .text {
                display: none;
            }

.enh-show-like-rates .videoTeaser .enh-like-rate.text, .enh-show-like-rates .imageTeaser .enh-like-rate.text {
            display: block;
        }

.enh-highlight:before {
        content: '';
        position: absolute;
        z-index: -1;
        top: -15px;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--primary);
        opacity: var(--ehg-hl-op);
    }

`)
