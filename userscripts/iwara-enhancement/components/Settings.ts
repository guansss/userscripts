import { App, computed, createApp, onBeforeUnmount, ref } from "vue"
import { onClickOutside } from "../../@common/dom"
import { DEV_ONLY } from "../../@common/env"
import { log } from "../../@common/log"
import { sanitizePath } from "../../@common/string"
import { useConfigSettings } from "../core/config"
import { i18n } from "../core/i18n"
import { ALL, page } from "../core/paging"
import { useDownloaderSettings } from "../features/downloader"
import { useTeaserSettings } from "../features/process-teasers"
import css from "./Settings.module.css"

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
            <p>
                <label :class='css.labelBlock'>
                    {{ $t('s.enabled') }}
                    <input type='checkbox' v-model='autoDownEnabled'>
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
            <p v-if='!downloadMode' v-html='$t("s.download.filename.warn")'></p>
            <section v-else-if='downloadMode !== "browser"' :class='css.warn'>
                <p v-html='$t("s.download.filename.warn_tm.desc")'></p>
                <ol v-if='$tm("s.download.filename.warn_tm.steps").length'>
                    <li v-for='step in $tm("s.download.filename.warn_tm.steps")'><p v-html='step'></p></li>
                </ol>
            </section>

            <p v-html='$t("s.download.filename.desc")'></p>

            <div :class='css.keywords'>
                <table :class='css.keywordTable'>
                    <tr v-for='kw in FILENAME_KEYWORDS'>
                        <th>{{ kw }}</th>
                        <td>{{ $t('s.download.filename.key.' + kw.toLowerCase()) }}</td>
                    </tr>
                </table>
            </div>
            <details>
                <summary>{{ $t('s.extra') }}</summary>
                <p>
                    {{ $t('s.download.filename.replace_illegal_char') }}
                    <input type='text' v-model='illegalCharReplacement'>
                    {{ '*miku*miku:dance??.mp4 -> ' }} {{ sanitizePath('*miku*miku:dance??.mp4', illegalCharReplacement) }}
                </p>
            </details>
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
  const tabIndex = ref(0)
  const tabVal = computed(() => tabs[tabIndex.value] && tabs[tabIndex.value]!.val)
  const visible = ref(false)

  const onClickContainer = () => {
    visible.value = !visible.value

    if (visible.value) {
      onClickOutside(settingsContainer, () => (visible.value = false))
    }
  }

  settingsContainer.addEventListener("click", onClickContainer)

  onBeforeUnmount(() => {
    settingsContainer.removeEventListener("click", onClickContainer)
  })

  return {
    css,
    tabs,
    tabIndex,
    tabVal,
    visible,
    downloadMode: GM_info.downloadMode,
    sanitizePath,
    ...useDownloaderSettings(),
    ...useConfigSettings(),
    ...useTeaserSettings(),
  }
}

const SETTINGS_ID = "enh-settings"

const settingsContainer = $(
  `<div id="${SETTINGS_ID}" class='header__link ${css.switch}'></div>`
)[0]!

let app: App | undefined

page(ALL, (pageID, onLeave) => {
  const destination = $(
    ".page .header__content:first-of-type .dropdown:last-of-type, a[href='/register']"
  )[0]

  if (destination) {
    // destination element will be destroyed everytime the page changes,
    // so we need to insert the container after every page change
    destination.before(settingsContainer)

    // lazy-init the app
    if (!app) {
      app = createApp({
        template,
        setup,
      })

      app.use(i18n)

      if (!DEV) {
        // pending fix https://github.com/vuejs/core/pull/5197
        // @ts-ignore
        unsafeWindow.Vue = Vue
      }

      app.mount(settingsContainer)

      log("Settings view initialized")
    }
  } else {
    log("Could not insert settings view: container not found.")
  }

  DEV_ONLY(() => {
    onLeave(() => settingsContainer.remove())
  })
})
