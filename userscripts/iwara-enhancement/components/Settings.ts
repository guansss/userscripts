import { App, createApp, ref } from 'vue';
import { useDownloaderSettings } from '../downloader';
import { i18n } from '../i18n';
import css from './Settings.module.css';

// language=HTML
const template = `
    <div :class='css.switch' @click='visible = !visible'>Settings</div>

    <div v-if='visible' :class='css.settings'>
        <h2 :class='css.title'>${GM_info.script.name} v${GM_info.script.version}</h2>
        <h3 :class='css.sectionHeader'>{{ $t('s.download.label') }}</h3>

        <h4 :class='css.fieldLabel'>{{ $t('s.download.auto.label') }}</h4>
        <p v-html='$t("s.download.auto.desc")'></p>
        <p v-if='!downloadMode' v-html='$t("s.download.auto.warn")'></p>
        <p v-else-if='downloadMode === "browser"' :class='css.warn'>
        <p v-html='$tm("s.download.auto.warn_tm")[0]'></p>
        <ol>
            <li v-for='line in $tm("s.download.auto.warn_tm").slice(1)'><p v-html='line'></p></li>
        </ol>
        </p>
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
`;

function setup() {
    const visible = ref(true);

    return {
        css,
        visible,
        downloadMode: GM_info.downloadMode,
        ...useDownloaderSettings(),
    };
}

const containerID = 'enh-settings';
let app: App;

export async function setupSettings() {
    const container = document.createElement('DIV');
    container.id = containerID;
    document.body.appendChild(container);

    app = createApp({
        template,
        setup,
    });

    app.use(i18n);
    app.mount(container);
}

if (import.meta.hot) {
    import.meta.hot.accept((self) => {
        self.setupSettings();
    });

    import.meta.hot.dispose(() => {
        document.getElementById(containerID)?.remove();
        app?.unmount();
    });
}
