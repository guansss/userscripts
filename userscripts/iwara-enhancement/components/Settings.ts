import { App, computed, createApp, ref } from 'vue';
import { onClickOutside } from '../../@common/dom';
import { log } from '../../@common/log';
import { useConfigSettings } from '../core/config';
import { useDownloaderSettings } from '../features/downloader';
import { i18n } from '../core/i18n';
import { page, unpage } from '../core/paging';
import { useTeaserSettings } from '../features/process-teasers';
import css from './Settings.module.css';

// language=HTML
const template = `
    <div class='text text--text text--bold' xmlns='http://www.w3.org/1999/html'>E</div>

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
            <h3 :class='css.sectionHeader'>{{ $t('s.ui.label') }}</h3>

            <h4 :class='css.fieldLabel'>{{ $t('s.ui.like_rate.label') }}</h4>
            <p v-html='$t("s.ui.like_rate.desc")'></p>
            <p>
                <label :class='css.labelBlock'>
                    {{ $t('s.enabled') }}
                    <input type='checkbox' v-model='likeRateEnabled'>
                </label>
            </p>

            <h4 :class='css.fieldLabel'>{{ $t('s.ui.highlight.label') }}</h4>
            <p v-html='$t("s.ui.highlight.desc")'></p>
            <p>
                <input type='number' step='0.1' min='0' max='100' :value='highlightThreshold' @change='highlightThreshold = +$event.target.value'>
            </p>
        </div>
        <div v-else-if='tabVal === "download"' :class='css.view'>
            <h3 :class='css.sectionHeader'>{{ $t('s.download.label') }}</h3>

            <h4 :class='css.fieldLabel'>{{ $t('s.download.auto.label') }}</h4>
            <p v-html='$t("s.download.auto.desc")'></p>
            <p v-if='!downloadMode' v-html='$t("s.download.auto.warn")'></p>
            <section v-else-if='downloadMode !== "browser"' :class='css.warn'>
                <p v-html='$tm("s.download.auto.warn_tm")[0]'></p>
                <ol>
                    <li v-for='line in $tm("s.download.auto.warn_tm").slice(1)'><p v-html='line'></p></li>
                </ol>
            </section>
            <p>
                <label :class='[css.labelBlock, { disabled: downloadMode !== "browser" }]'>
                    {{ $t('s.enabled') }}
                    <input type='checkbox' :disabled='downloadMode !== "browser"' v-model='autoDownEnabled'>
                </label>
            </p>

            <h4 :class='css.fieldLabel'>{{ $t('s.download.resolution.label') }}</h4>
            <p>
                <label v-for='res in RESOLUTIONS' :class='css.labelInline'>
                    <input type='radio' name='res' :value='res' v-model='resolution'>
                    {{ res }}
                </label>
            </p>

            <h4 :class='css.fieldLabel'>{{ $t('s.download.filename.label') }}</h4>
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
            <h3 :class='css.sectionHeader'>{{ $t('s.script.label') }}</h3>

            <h4 :class='css.fieldLabel'>{{ $t('s.script.language.label') }}</h4>
            <p>
                <label v-for='loc in $i18n.availableLocales' :class='css.labelBlock'>
                    <input type='radio' name='loc' :value='loc' :checked='activeLocale === loc' @change='locale = loc'>
                    {{ $t('language', loc) }}
                </label>
            </p>
        </div>
    </div>
`;

function setup() {
    const tabs = [
        { name: 's.ui.label', val: 'ui' },
        { name: 's.download.label', val: 'download' },
        { name: 's.script.label', val: 'script' },
    ];
    const tabIndex = ref(0);
    const tabVal = computed(() => tabs[tabIndex.value] && tabs[tabIndex.value]!.val);
    const visible = ref(false);

    settingsContainer.addEventListener('click', () => {
        visible.value = !visible.value;

        if (visible.value) {
            onClickOutside(settingsContainer, () => (visible.value = false));
        }
    });

    return {
        css,
        tabs,
        tabIndex,
        tabVal,
        visible,
        downloadMode: GM_info.downloadMode,
        ...useDownloaderSettings(),
        ...useConfigSettings(),
        ...useTeaserSettings(),
    };
}

const settingsContainer = $(`<div id="enh-settings" class='header__link ${css.switch}'></div>`).get(0)!;
let app: App | undefined;

page('', __MODULE_ID__, (pageID, onLeave) => {
    const destination = $('.page .header__content:first-of-type .dropdown:last-of-type');

    if (destination.length) {
        // destination element will be destroyed everytime the page changes,
        // so we need to insert the container after every page change
        destination.before(settingsContainer);

        // lazy-init the app
        if (!app) {
            app = createApp({
                template,
                setup,
            });

            app.use(i18n);

            if (import.meta.env.PROD) {
                // pending fix https://github.com/vuejs/core/pull/5197
                // @ts-ignore
                unsafeWindow.Vue = Vue;
            }

            app.mount(settingsContainer);

            log('Settings view initialized');
        }
    } else {
        log('Could not insert settings view: container not found.');
    }

    if (__DEV__) {
        onLeave(() => {
            settingsContainer.remove();
        });
    }
});

if (__DEV__) {
    __ON_RELOAD__(() => {
        unpage(__MODULE_ID__);
    });
}
