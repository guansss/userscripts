import { computed, ref, watchEffect } from 'vue';
import { storage } from './store';

const defaultResolution = 'Source';

const resolution = ref(storage.get('preferred_res', defaultResolution));
let sources: { label: string; src: string };

const FILENAME_KEYWORDS = ['ID', 'TITLE', 'AUTHOR', 'DATE', 'UP_DATE', 'DATE_TS', 'UP_DATE_TS'];
const RESOLUTIONS = ['Source', '540p', '360p'];

const DEFAULT_FILENAME_TEMPLATE = '{DATE} {TITLE} - {AUTHOR} ({ID})';
const autoEnabled = GM_info.downloadMode === 'browser' ? ref(storage.get('auto_down_enabled', true)) : false;
const filenameTemplate = ref(storage.get('filename', DEFAULT_FILENAME_TEMPLATE));

export function useDownloaderSettings() {
    watchEffect(() => {
        storage.set('preferred_res', resolution.value);
        storage.set('filename', filenameTemplate.value);

        if (typeof autoEnabled !== 'boolean') {
            storage.set('auto_down_enabled', autoEnabled.value);
        }
    });

    const filenamePreview = computed(() => {
        try {
            return 'Not implemented'; //getDownloadTarget(filenameTemplate.value).filename;
        } catch (e) {
            return `Unable to preview filename (${e})`;
        }
    });

    return {
        FILENAME_KEYWORDS,
        RESOLUTIONS,
        autoDownEnabled: autoEnabled,
        resolution,
        filenameTemplate,
        filenamePreview,
    };
}
