import { App, createApp, ref } from 'vue';
import { useDownloaderSettings } from '../downloader';
import { i18n } from '../i18n';
import css from './Settings.module.css';

// language=HTML
const template = `
    <div :class='css.switch' @click='visible = !visible'>Settings</div>

    <div v-if='visible' :class='css.settings'>
        <h2 class='css.title'>${ GM_info.script.name} v${ GM_info.script.version}</h2>
        <h3 :class='css.sectionHeader'>{{ $t('s.download.label') }}</h3>
        <div :class='css.fieldDesc' v-html='$t("s.download.note")'></div>
        <h4 :class='css.fieldLabel'>{{ $t('s.download.filename.label') }}</h4>
        <div :class='css.fieldDesc' v-html='$t("s.download.filename.desc1")'></div>
        <div :class='css.fieldDesc' v-html='$t("s.download.filename.desc2")'></div>
        <div :class='css.keywords'>
            <table :class='css.keywordTable'>
                <tr v-for='kw in FILENAME_KEYWORDS'>
                    <th>{{ kw }}</th>
                    <td>{{ $t('s.download.filename.key.' + kw.toLowerCase()) }}</td>
                </tr>
            </table>
        </div>
        <input type='text' :class='css.input' v-model='filenameTemplate'>
        <div :class='css.fieldDesc'>{{ $t('s.download.filename.preview') + ': ' + filenamePreview }}</div>
    </div>
`;

function setup() {
    const visible = ref(true);

    return {
        css,
        visible,
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
