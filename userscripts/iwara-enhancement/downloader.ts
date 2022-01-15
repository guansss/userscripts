import { computed, ref, watchEffect } from 'vue';
import { storage } from './store';

const resolution = ref(storage.get('preferred_res'));
let sources: { label: string; src: string };

const FILENAME_KEYWORDS = ['ID', 'TITLE', 'AUTHOR', 'DATE', 'UP_DATE', 'DATE_TS', 'UP_DATE_TS'];
const RESOLUTIONS = ['Source', '540p', '360p'];

const autoEnabled = GM_info.downloadMode === 'browser' ? ref(storage.get('auto_down_enabled')) : false;
const filenameTemplate = ref(storage.get('filename'));

watchEffect(() => {
    storage.set('preferred_res', resolution.value);
    storage.set('filename', filenameTemplate.value);

    if (typeof autoEnabled !== 'boolean') {
        storage.set('auto_down_enabled', autoEnabled.value);
    }
});

export function useDownloaderSettings() {
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
