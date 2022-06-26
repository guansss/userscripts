import { computed, reactive, ref, watchEffect } from 'vue';
import { hasClass, SimpleMutationObserver } from '../../@common/dom';
import { log } from '../../@common/log';
import { getReactEventHandlers } from '../../@common/react';
import { formatDate } from '../../@common/string';
import { delay } from '../../@common/timer';
import { page, unpage } from '../core/paging';
import { storage } from '../core/storage';

// a partial structure of the video data defined in iwara's video page,
// including only the properties we need
interface Video {
    id: string;
    title: string;
    body: string;
    file: {
        id: string;
        type: string;
        mime: string;
        size: number;
        createdAt: string;
        updatedAt: string;
    };
    user: {
        id: string;
        name: string;
        username: string;
    };
    createdAt: string;
    updatedAt: string;
    fileUrl: string;
}

interface VideoSource {
    label: string;
    url: string;
}

const FILENAME_KEYWORDS = ['ID', 'TITLE', 'RES', 'AUTHOR', 'DATE', 'UP_DATE', 'DATE_TS', 'UP_DATE_TS'] as const;
const RESOLUTIONS = ['Source', '540p', '360p'] as const;

const autoEnabled = GM_info.downloadMode === 'browser' ? ref(storage.get('auto_down_enabled')) : false;
const filenameTemplate = ref(storage.get('filename'));
const resolution = ref(storage.get('preferred_res'));

const videoInfo = reactive({
    id: '',
    title: '',
    author: '',
    created: 0,
    size: 0,
    error: '',
});
const sources = reactive<VideoSource[]>([]);
const source = computed(() => sources.find(({ label }) => label === resolution.value) || sources[0]);

// indicates whether the sources belong to current page
const hasFreshSources = ref(false);

const filename = computed(() => {
    try {
        if (!source.value) {
            throw 'Please open a video';
        }

        return resolveFilename(filenameTemplate.value, source.value);
    } catch (e: any) {
        return `Unable to resolve filename (${e.message || e})`;
    }
});

watchEffect(() => storage.set('preferred_res', resolution.value));
watchEffect(() => storage.set('filename', filenameTemplate.value));

if (typeof autoEnabled !== 'boolean') {
    watchEffect(() => storage.set('auto_down_enabled', autoEnabled.value));
    watchEffect(() => convertDownloadDropdown(undefined, autoEnabled.value, source.value));
}

export function useDownloaderSettings() {
    return {
        FILENAME_KEYWORDS,
        RESOLUTIONS,
        autoDownEnabled: autoEnabled,
        resolution,
        filenameTemplate,
        filenamePreview: filename,
    };
}

page('video', __MODULE_ID__, (pageID, onLeave) => {
    const videoActions = $('.page-video__actions').get(0);

    if (!videoActions) {
        log('Could not find video actions.');
        return;
    }

    const actionsObserver = new SimpleMutationObserver((mutation) =>
        mutation.addedNodes.forEach((node) => {
            if (hasClass(node, 'dropdown')) {
                updateVideoInfo(videoActions);
                updateSources(node);

                if (autoEnabled && autoEnabled.value) {
                    convertDownloadDropdown(node, true, source.value);

                    if (__DEV__) {
                        onLeave(() => convertDownloadDropdown(node, false, undefined));
                    }
                }
            }
        })
    );
    actionsObserver.observe(videoActions, { childList: true, immediate: true });

    onLeave(() => {
        // prevent unexpected downloads
        hasFreshSources.value = false;

        if (__DEV__) {
            actionsObserver.disconnect();
        }
    });
});

function updateVideoInfo(videoActions: HTMLElement) {
    try {
        // FIXME: reading the prop by a path is quite unreliable, any improvement?
        const video: Video = getReactEventHandlers(videoActions).children[1].props.video;

        videoInfo.id = video.id;
        videoInfo.title = video.title;
        videoInfo.created = new Date(video.createdAt).getTime();
        videoInfo.author = video.user.name;
        videoInfo.size = video.file.size;
    } catch (e) {
        log(e);
        videoInfo.error = e + '';
    }
}

function updateSources(downloadDropdown: HTMLElement) {
    const newSources = $(downloadDropdown)
        .find('.dropdown__content a')
        .map(function () {
            const url = (this as HTMLAnchorElement).href;
            const label = this.innerText;

            return { url, label };
        })
        .get();

    if (!newSources.length) {
        return;
    }

    sources.splice(0, sources.length, ...newSources);

    hasFreshSources.value = true;
}

function convertDownloadDropdown(
    downloadDropdown: HTMLElement | undefined,
    enabled: boolean,
    source: VideoSource | undefined
) {
    // @ts-ignore The parameter is valid but TS doesn't recognize it
    const $dropdown = $(downloadDropdown || '.page-video__actions > .dropdown') as JQuery<HTMLElement>;
    const $button = $dropdown.find('.downloadButton');
    const rawButtonText = $button.text().replace(/\s*\(.*\)/, '');

    if (enabled) {
        if (!$dropdown.data('converted')) {
            $dropdown
                .data('converted', true)
                .on('click', function () {
                    download(this);
                })
                .children('.dropdown__content')
                .css('display', 'none');
        }

        $button.text(rawButtonText + (source ? ` (${source.label})` : ''));
    } else {
        $dropdown.data('converted', false).off('click').children('.dropdown__content').css('display', '');
        $button.text(rawButtonText);
    }
}

function download(downloadDropdown: HTMLElement) {
    try {
        if (!hasFreshSources.value) {
            throw new Error('No sources found in current page.');
        }
        if (!source.value) {
            throw new Error('Missing source.');
        }
        if (GM_info.downloadMode !== 'browser') {
            throw new Error(`Invalid download mode "${GM_info.downloadMode}".`);
        }

        const $downloadButton = $(downloadDropdown).find('.downloadButton');

        // TODO: properly disable the button
        $(downloadDropdown).css('pointer-events', 'none');
        $downloadButton.css('background-color', 'var(--primary-dark)');

        const filename = resolveFilename(filenameTemplate.value, source.value);

        log('Downloading:', filename, source.value.url);

        if (__DEV__) {
            delay(2000).then(() => downloadEnded('onload'));
            // delay(2000).then(() => downloadEnded('ontimeout'));
            return;
        }

        GM_download({
            url: source.value.url,
            name: filename,
            saveAs: true,
            onload: () => downloadEnded('onload'),
            onerror: (e) => downloadEnded('onerror', e),
            ontimeout: () => downloadEnded('ontimeout'),
        });

        function downloadEnded(
            type: 'onload' | 'onerror' | 'ontimeout',
            e?: Parameters<Required<Parameters<typeof GM_download>[0]>['onerror']>[0]
        ) {
            $(downloadDropdown).css('pointer-events', '');
            $downloadButton.css('background-color', '');

            if (type === 'ontimeout') {
                e = { error: 'timed_out' } as any;
            }

            if (e && e.error) {
                log(e);
                printDownloadMessage(`Download Error (${e.error}): ${(e.details && e.details.current) || 'No info'}`);
            }
        }
    } catch (e) {
        log(e);
        printDownloadMessage(e + '');
    }
}

function resolveFilename(template: string, source: VideoSource) {
    if (videoInfo.error) {
        throw new Error('Broken video info: ' + videoInfo.error);
    }

    const replacements: Record<typeof FILENAME_KEYWORDS[number], string> = {
        ID: videoInfo.id,
        TITLE: videoInfo.title,
        RES: source.label,
        AUTHOR: videoInfo.author,
        DATE: formatDate(new Date()),
        DATE_TS: new Date().getTime() + '',
        UP_DATE: formatDate(new Date(videoInfo.created)),
        UP_DATE_TS: videoInfo.created + '',
    };

    let basename = template;

    for (const [key, value] of Object.entries(replacements)) {
        basename = basename.replace(new RegExp(`{${key}}`, 'g'), value);
    }

    // strip characters disallowed in file path
    basename = basename.replace(/[*/:<>?\\|]/g, '');

    const ext = source.url.slice(source.url.lastIndexOf('.'));

    return basename + ext;
}

function printDownloadMessage(msg: string) {
    $('.page-video__bottom').css('flex-wrap', 'wrap').append(`<div style="flex: 100% 0 0">${msg}</div>`);
}

if (__DEV__) {
    __ON_RELOAD__(() => {
        unpage(__MODULE_ID__);
    });
}
