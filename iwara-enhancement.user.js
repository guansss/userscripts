// ==UserScript==
// @name        Iwara Enhancement
// @name:zh-CN  Iwara增强
// @version     0.11
// @author      guansss
// @namespace   https://github.com/guansss
// @source      https://github.com/guansss/userscripts
// @supportURL  https://github.com/guansss/userscripts/issues
// @updateURL   https://sleazyfork.org/scripts/416003-iwara-enhancement/code/Iwara%20Enhancement.user.js
// @require     https://cdn.jsdelivr.net/npm/jquery@3/dist/jquery.min.js
// @require     https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js
// @require     https://cdn.jsdelivr.net/npm/vue-i18n@9/dist/vue-i18n.global.prod.js
// @match       *://staging.iwara.tv/*
// @run-at      document-start
// @grant       unsafeWindow
// @grant       GM_addStyle
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_download
// @grant       GM_info
// @noframes
// ==/UserScript==

function _script_main(jQuery, vue, vueI18n) {
    'use strict';

    let log;

    setLogger(console.log);

    function setLogger(logger) {
        log = logger.bind(console, `[${GM_info.script.name}]`);
    }

    // prevent Sentry from tracking the logging
    setLogger(console.log.__sentry_original__ || console.log);

    function onClickOutside(el, callback) {
        document.addEventListener('click', handler);

        function handler(e) {
            if (!el.contains(e.target)) {
                document.removeEventListener('click', handler);
                callback(e);
            }
        }
    }

    /**
     * MutationObserver that calls callback with just a single mutation.
     */
    class SimpleMutationObserver extends MutationObserver {
        constructor(callback) {
            super((mutations) => mutations.forEach((mutation) => this.callback(mutation)));
            this.callback = callback;
        }

        /**
         * @param options.immediate - When observing "childList", immediately trigger a mutation with existing nodes.
         */
        observe(target, options) {
            super.observe(target, options);

            if (options && options.immediate && options.childList && target.childNodes.length) {
                this.callback({
                    target,
                    type: 'childList',
                    addedNodes: target.childNodes,
                    removedNodes: SimpleMutationObserver.emptyNodeList,
                });
            }
        }
    }
    // since calling `new NodeList()` is illegal, this is the only way to create an empty NodeList
    SimpleMutationObserver.emptyNodeList = document.querySelectorAll('#__absolutely_nonexisting');

    function hasClass(node, className) {
        return node.classList && node.classList.contains(className);
    }

    function createStorage(schema) {
        return {
            get(key) {
                return GM_getValue(key, schema[key]);
            },
            set(key, val) {
                GM_setValue(key, val);
            },
        };
    }

    const storage = createStorage({
        version: GM_info.script.version,
        locale: navigator.language,
        volume: 0.5,
        auto_down_enabled: true,
        preferred_res: 'Source',
        filename: '{DATE} {TITLE} - {AUTHOR} ({ID})',
        dark: false,
        like_rates: true,
        like_rate_highlight: 4,
        player_size: 100,
        hide_list_options: false,
    });

    const i18n = vueI18n.createI18n({
        locale: storage.get('locale'),
        fallbackLocale: 'en',
        messages: JSON.parse(
            '{"en":{"language":"English","name":"Iwara Enhancement","description":"Multiple UI enhancements for better experience.","ui":{"show_list_options":"Show options","hide_list_options":"Hide options"},"s":{"enabled":"Enabled","download":{"label":"Download","auto":{"label":"One-click Download","desc":"Automatically starts download when clicking the download button.","warn":"This feature requires Tampermonkey.","warn_tm":["This feature requires Tampermonkey\'s <b>Browser API</b> download mode, please follow these steps:","Navigate to Tampermonkey\'s settings panel and then the <b>Settings</b> tab.","In <b>General</b> section, set <b>Config Mode</b> to <b>Advanced</b> (or <b>Beginner</b>).","In <b>Downloads BETA</b> section, set <b>Download Mode</b> to <b>Browser API</b>.","Grant permission if requested.","Refresh this page."]},"resolution":{"label":"Preferred Resolution for Download"},"filename":{"label":"Filename","desc":"Filename template to use when downloading a video.<br>Each keyword should be surrounded by <b>{\'{ }\'}</b>.","preview":"Preview","key":{"id":"video\'s ID","title":"video\'s title","res":"video\'s resolution","author":"author\'s name","date":"date time when the download starts","up_date":"date time when the video was uploaded","date_ts":"DATE in timestamp format","up_date_ts":"UP_DATE in timestamp format"}}},"ui":{"label":"UI","like_rate":{"label":"Like rate","desc":"Displays like rates in video and image list."},"highlight":{"label":"Highlight threshold","desc":"Highlights video and image items over a certain like rate."}},"script":{"label":"Script","language":{"label":"Language"}}}},"zh":{"language":"中文","name":"Iwara增强","description":"多种增强体验的界面优化","s":{"enabled":"启用","download":{"label":"下载","auto":{"label":"一键下载","desc":"点击下载按钮时自动开始下载","warn":"该功能仅在 Tampermonkey 中可用","warn_tm":["该功能需要启用 Tampermonkey 的<b>浏览器 API</b>下载模式，请按照以下步骤启用：","进入 Tampermonkey 的设置面板，选择<b>设置</b>标签页","在<b>通用</b>里，设置<b>配置模式</b>为<b>高级<b>（或者<b>初学者</b>）","在<b>下载 BETA</b>里，设置<b>下载模式</b>为<b>浏览器 API</b>","如果请求权限的话，选择同意","刷新当前页面"]},"resolution":{"label":"优先下载的分辨率"},"filename":{"label":"文件名","desc":"下载视频时使用的文件名模板<br>每个关键词必须使用 <b>{\'{ }\'}</b> 来包围","preview":"预览","key":{"id":"视频 ID","title":"视频标题","author":"作者名","date":"下载开始时的日期和时间","up_date":"视频发布时的日期和时间","date_ts":"DATE 的时间戳格式","up_date_ts":"UP_DATE 的时间戳格式"}}}}}}'
        ),

        // disable warnings - I know what I'm doing!!
        silentFallbackWarn: true,
        silentTranslationWarn: true,
        warnHtmlInMessage: 'off',
    });

    function matchLocale(locale) {
        return i18n.global.availableLocales.includes(locale)
            ? locale
            : i18n.global.availableLocales.find((loc) => locale.startsWith(loc)) || 'en';
    }

    // shorthand helper making TypeScript happy
    function localize(message) {
        // @ts-ignore TS2589: Type instantiation is excessively deep and possibly infinite.
        return i18n.global.t(message);
    }

    const locale = vue.ref(storage.get('locale'));

    vue.watchEffect(() => {
        i18n.global.locale = locale.value;

        storage.set('locale', locale.value);
    });

    function useConfigSettings() {
        // locale that will actually be used, with fallback applied
        const activeLocale = vue.computed(() => matchLocale(locale.value));

        return {
            locale,
            activeLocale,
        };
    }

    // cached keys, since there will most likely be only one React instance in the page
    let reactEventHandlersKey = '';

    function getReactEventHandlers(element) {
        if (reactEventHandlersKey) {
            return element[reactEventHandlersKey];
        }

        for (const key of Object.keys(element)) {
            if (key.startsWith('__reactEventHandlers$')) {
                reactEventHandlersKey = key;
                return element[key];
            }
        }
    }

    function formatDate(date, delimiter = '/') {
        return [
            date.getFullYear(),
            date.getMonth() + 1,
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds(),
        ]
            .map((num) => String(num).padStart(2, '0'))
            .join(delimiter);
    }

    // sometimes I just don't want the script to depend on Lodash...
    function throttle(fn, timeout) {
        let timer = 0;

        return (...args) => {
            if (timer) {
                return;
            }

            timer = setTimeout(() => {
                fn.apply(null, args);

                timer = 0;
            }, timeout);
        };
    }

    function delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function mitt(n) {
        return {
            all: (n = n || new Map()),
            on: function (t, e) {
                var i = n.get(t);
                i ? i.push(e) : n.set(t, [e]);
            },
            off: function (t, e) {
                var i = n.get(t);
                i && (e ? i.splice(i.indexOf(e) >>> 0, 1) : n.set(t, []));
            },
            emit: function (t, e) {
                var i = n.get(t);
                i &&
                    i.slice().map(function (n) {
                        n(e);
                    }),
                    (i = n.get('*')) &&
                        i.slice().map(function (n) {
                            n(t, e);
                        });
            },
        };
    }

    const ready = new Promise((resolve) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => resolve);
        } else {
            resolve();
        }
    });

    function once(emitter, event, listener) {
        const fn = (data) => {
            emitter.off(event, fn);
            listener(data);
        };

        emitter.on(event, fn);

        return fn;
    }

    function setupPaging() {
        ready.then(() => {
            const appDiv = document.getElementById('app');

            if (!appDiv) {
                log('Missing app div.');
                return;
            }

            log('Start observing pages.');

            const appObserver = new SimpleMutationObserver((mutation) => {
                detectPageChange(mutation.addedNodes, 'pageEnter');
                detectPageChange(mutation.removedNodes, 'pageLeave');
            });
            appObserver.observe(appDiv, { childList: true, immediate: true });
        });
    }
    const emitter = mitt();

    emitter.on('pageEnter', (className) => className);

    // page listener for iwara
    function page(id, key, enter) {
        const match =
            typeof id === 'string'
                ? (className) => (className.includes(id) ? id : undefined)
                : (className) => id.find((_id) => className.includes(_id)) || undefined;

        function callIfMatch(listener) {
            return (className) => {
                const matchedID = match(className);

                if (matchedID !== undefined) {
                    try {
                        listener(matchedID);
                    } catch (e) {
                        log('Error executing page listener', e);
                    }
                }
            };
        }

        const onPageEnter = callIfMatch((matchedID) => {
            enter(matchedID, (onLeave) => {
                once(emitter, 'pageLeave', callIfMatch(onLeave));
            });
        });

        emitter.on('pageEnter', onPageEnter);
    }

    function detectPageChange(nodes, event) {
        if (nodes.length) {
            for (const node of nodes) {
                // a valid class name will be like "page page-videoList", where "videoList" is the ID
                if (hasClass(node, 'page')) {
                    emitter.emit(event, node.className);
                    break;
                }
            }
        }
    }

    const FILENAME_KEYWORDS = ['ID', 'TITLE', 'RES', 'AUTHOR', 'DATE', 'UP_DATE', 'DATE_TS', 'UP_DATE_TS'];
    const RESOLUTIONS = ['Source', '540p', '360p'];

    const autoEnabled = GM_info.downloadMode === 'browser' ? vue.ref(storage.get('auto_down_enabled')) : false;
    const filenameTemplate = vue.ref(storage.get('filename'));
    const resolution = vue.ref(storage.get('preferred_res'));

    const videoInfo = vue.reactive({
        id: '',
        title: '',
        author: '',
        created: 0,
        size: 0,
        error: '',
    });
    const sources = vue.reactive([]);
    const source = vue.computed(() => sources.find(({ label }) => label === resolution.value) || sources[0]);

    // indicates whether the sources belong to current page
    const hasFreshSources = vue.ref(false);

    const filename = vue.computed(() => {
        try {
            if (!source.value) {
                throw 'No sources found';
            }

            return resolveFilename(filenameTemplate.value, source.value);
        } catch (e) {
            return `Unable to resolve filename (${e.message || e})`;
        }
    });

    vue.watchEffect(() => storage.set('preferred_res', resolution.value));
    vue.watchEffect(() => storage.set('filename', filenameTemplate.value));

    if (typeof autoEnabled !== 'boolean') {
        vue.watchEffect(() => storage.set('auto_down_enabled', autoEnabled.value));
        vue.watchEffect(() => convertDownloadDropdown(undefined, autoEnabled.value, source.value));
    }

    function useDownloaderSettings() {
        return {
            FILENAME_KEYWORDS,
            RESOLUTIONS,
            autoDownEnabled: autoEnabled,
            resolution,
            filenameTemplate,
            filenamePreview: filename,
        };
    }

    page('video', '', (pageID, onLeave) => {
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
                    }
                }
            })
        );
        actionsObserver.observe(videoActions, { childList: true, immediate: true });

        onLeave(() => {
            // prevent unexpected downloads
            hasFreshSources.value = false;
        });
    });

    function updateVideoInfo(videoActions) {
        try {
            // FIXME: reading the prop by a path is quite unreliable, any improvement?
            const video = getReactEventHandlers(videoActions).children[1].props.video;

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

    function updateSources(downloadDropdown) {
        const newSources = $(downloadDropdown)
            .find('.dropdown__content a')
            .map(function () {
                const url = this.href;
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

    function convertDownloadDropdown(downloadDropdown, enabled, source) {
        // @ts-ignore The parameter is valid but TS doesn't recognize it
        const $dropdown = $(downloadDropdown || '.page-video__actions > .dropdown');
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

    function download(downloadDropdown) {
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

            if (false);

            GM_download({
                url: source.value.url,
                name: filename,
                saveAs: true,
                onload: () => downloadEnded('onload'),
                onerror: (e) => downloadEnded('onerror', e),
                ontimeout: () => downloadEnded('ontimeout'),
            });

            function downloadEnded(type, e) {
                $(downloadDropdown).css('pointer-events', '');
                $downloadButton.css('background-color', '');

                if (type === 'ontimeout') {
                    e = { error: 'timed_out' };
                }

                if (e && e.error) {
                    log(e);
                    printDownloadMessage(
                        `Download Error (${e.error}): ${(e.details && e.details.current) || 'No info'}`
                    );
                }
            }
        } catch (e) {
            log(e);
            printDownloadMessage(e + '');
        }
    }

    function resolveFilename(template, source) {
        if (videoInfo.error) {
            throw new Error('Broken video info: ' + videoInfo.error);
        }

        const replacements = {
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

    function printDownloadMessage(msg) {
        $('.page-video__bottom').css('flex-wrap', 'wrap').append(`<div style="flex: 100% 0 0">${msg}</div>`);
    }

    const likeRateEnabled = vue.ref(storage.get('like_rates'));
    const highlightThreshold = vue.ref(storage.get('like_rate_highlight'));

    const likeRateClass = 'enh-like-rate';

    vue.watchEffect(() => {
        storage.set('like_rates', likeRateEnabled.value);

        if (likeRateEnabled.value) {
            document.body.classList.add('enh-show-like-rates');
        } else {
            document.body.classList.remove('enh-show-like-rates');
        }
    });

    vue.watchEffect(() => {
        storage.set('like_rate_highlight', highlightThreshold.value);

        $('.videoTeaser, .imageTeaser').each((i, teaser) => processTeaser(teaser));
    });

    function useTeaserSettings() {
        return {
            likeRateEnabled,
            highlightThreshold,
        };
    }

    page(['home', 'videoList', 'imageList'], '', async (pageID, onLeave) => {
        const rowObserver = new SimpleMutationObserver((mutation) => mutation.addedNodes.forEach(detectRow));
        const teaserObserver = new SimpleMutationObserver((mutation) => mutation.addedNodes.forEach(detectTeaser));

        const teaserBatcher = new TeaserBatcher();

        if (pageID === 'home') {
            const rows = $('.page-start__videos > .row, .page-start__images > .row').filter(function () {
                return this.classList.length === 1;
            });

            if (!rows.length) {
                log('Could not find teaser rows.');
                return;
            }

            rows.each((i, row) => detectRow(row));
        } else {
            const rowContainer = $(`.page-${pageID}>.content .col-12.order-lg-1:first-of-type`).get(0);

            if (!rowContainer) {
                log('Could not find teaser row container.');
                return;
            }

            rowObserver.observe(rowContainer, { childList: true, immediate: true });
        }

        function detectRow(row) {
            if (hasClass(row, 'row')) {
                teaserObserver.observe(row, { childList: true, immediate: true });
            }
        }

        function detectTeaser(teaser) {
            if (isTeaser(teaser)) {
                teaserBatcher.add(teaser);
                teaserBatcher.flush(processTeaser);
            }
        }

        onLeave(() => {
            rowObserver.disconnect();
            teaserObserver.disconnect();
        });
    });

    class TeaserBatcher {
        constructor() {
            this.teasers = [];

            this.flush = throttle((callback) => {
                let lastError;

                try {
                    this.teasers.forEach(callback);
                } catch (e) {
                    // only record the last error so the console won't blow up
                    lastError = e;
                }

                if (lastError) {
                    log('Failed to process teasers', lastError);
                }

                this.teasers.length = 0;
            }, 0);
        }

        add(teaser) {
            this.teasers.push(teaser);
        }
    }

    function processTeaser(teaser) {
        const viewsLabel = $(teaser).find('.views');
        const likesLabel = $(teaser).find('.likes');

        let likePercentage;

        const likeRateLabel = viewsLabel.children('.' + likeRateClass);

        if (likeRateLabel.length) {
            likePercentage = +likeRateLabel.text().trim().replace('%', '');
        } else {
            let [views, likes] = [viewsLabel, likesLabel].map((icon) => {
                const value = icon.text().trim();

                return value.includes('k') ? +value.slice(0, -1) * 1000 : +value;
            });

            likePercentage = views === 0 ? 0 : Math.round((1000 * likes) / views) / 10;

            // prettier-ignore
            viewsLabel.children().eq(0).clone()
                .addClass(likeRateClass)
                .text(likePercentage + '%')
                .appendTo(viewsLabel);
        }

        if (likePercentage >= highlightThreshold.value) {
            teaser.classList.add('enh-highlight');
        } else {
            teaser.classList.remove('enh-highlight');
        }
    }

    function isTeaser(node) {
        return (
            !!node.firstChild && (hasClass(node.firstChild, 'videoTeaser') || hasClass(node.firstChild, 'imageTeaser'))
        );
    }

    const settings = 'settings_cf1';
    const active = 'active_326';
    const header = 'header_4f4';
    const title = 'title_236';
    const view = 'view_8c7';
    const sectionHeader = 'section-header_915';
    const fieldLabel = 'field-label_963';
    const labelBlock = 'label-block_515';
    const labelInline = 'label-inline_04f';
    const warn = 'warn_298';
    var css = {
        switch: 'switch_ddb',
        settings: settings,
        active: active,
        header: header,
        title: title,
        view: view,
        sectionHeader: sectionHeader,
        fieldLabel: fieldLabel,
        labelBlock: labelBlock,
        labelInline: labelInline,
        warn: warn,
    };

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
        const tabIndex = vue.ref(0);
        const tabVal = vue.computed(() => tabs[tabIndex.value] && tabs[tabIndex.value].val);
        const visible = vue.ref(false);

        settingsContainer.addEventListener('click', () => {
            visible.value = !visible.value;

            if (visible.value) {
                onClickOutside(settingsContainer, () => (visible.value = false));
            }
        });

        return Object.assign(
            Object.assign(
                Object.assign(
                    { css, tabs, tabIndex, tabVal, visible, downloadMode: GM_info.downloadMode },
                    useDownloaderSettings()
                ),
                useConfigSettings()
            ),
            useTeaserSettings()
        );
    }

    const settingsContainer = $(`<div id="enh-settings" class='header__link ${css.switch}'></div>`).get(0);
    let app;

    page('', '', (pageID, onLeave) => {
        const destination = $('.page .header__content:first-of-type .dropdown:last-of-type');

        if (destination.length) {
            // destination element will be destroyed everytime the page changes,
            // so we need to insert the container after every page change
            destination.before(settingsContainer);

            // lazy-init the app
            if (!app) {
                app = vue.createApp({
                    template,
                    setup,
                });

                app.use(i18n);

                {
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
    });

    const toggleButtonID = 'enh-hide-options-btn';

    page(['videoList', 'imageList'], '', (pageID, onLeave) => {
        const hideOptions = vue.ref(storage.get('hide_list_options'));
        const toggleText = vue.computed(() =>
            localize(hideOptions.value ? 'ui.show_list_options' : 'ui.hide_list_options')
        );

        const optionsContainer = $('.sortFilter').eq(0).closest('.col-lg-3');

        const toggleButton = $(
            `<button id="${toggleButtonID}" class="button button--primary button--ghost d-lg-none" type="button"></button>`
        )
            .insertBefore(optionsContainer)
            .on('click', () => (hideOptions.value = !hideOptions.value));

        vue.watchEffect(() => {
            storage.set('hide_list_options', hideOptions.value);
            optionsContainer.toggleClass('d-none', hideOptions.value);
        });

        vue.watchEffect(() => {
            toggleButton.text(toggleText.value);
        });
    });

    var index = '';

    async function main() {
        document.body.classList.add('enh-body');

        setupPaging();
    }

    main();
}

GM_addStyle(`
.switch_ddb {
    cursor: pointer;
}

.settings_cf1 {
    position: absolute;
    z-index: 1000;
    top: calc(100% + 2px); /* plus 2px border */
    right: 0;
    width: 400px;
    background: var(--body-darker);
    font-size: 14px;
    cursor: default;
}

.settings_cf1 nav {
    padding: 0 16px;
    border-bottom: 1px solid #444;
}

.settings_cf1 nav ul {
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
}

.settings_cf1 nav li {
    padding: 8px 16px;
    list-style-type: none;
    cursor: pointer;
}

.settings_cf1 nav li:hover {
    background: #3A3A3A;
}

.settings_cf1 nav li.active_326 {
    background-color: #444;
    color: #FFF
}

.settings_cf1 p, .settings_cf1 section {
    margin-bottom: 8px;
}

.settings_cf1 a {
    font-weight: bold;
    cursor: pointer;
}

.settings_cf1 ol {
    -webkit-padding-start: 20px;
    padding-inline-start: 20px;
}

.settings_cf1 table {
    margin: 16px 0;
    width: 100%;
    background: #3A3A3A;
    border: 1px solid #555;
    border-collapse: collapse;
}

.settings_cf1 table th {
    text-align: right;
}

.settings_cf1 table th, .settings_cf1 table td {
    padding: 4px 8px;
    border: 1px solid #555;
}

.settings_cf1 label {
    cursor: pointer;
}

.settings_cf1 label:hover {
    background-color: #444;
}

.settings_cf1 label input {
    cursor: pointer;
}

.settings_cf1 input[type='text'] {
    margin-bottom: 16px;
    width: 100%;
    padding: 8px;
    background: #444;
    color: #FFF;
    border: 2px solid #555;
    border-radius: 3px;
}

.settings_cf1 input[type='text']:hover, .settings_cf1 input[type='text']:focus {
    background: #4A4A4A;
}

.header_4f4 {
    padding: 0 16px;
}

.title_236 {
}

.view_8c7 {
    padding: 16px;
}

.section-header_915 {
    margin-bottom: 16px;
    color: #FFF;
}

.field-label_963 {
    position: relative;
    margin: 16px 0;
    padding-top: 16px;
    color: #FFF;
}

.field-label_963:not(:first-of-type) {
    border-top: 1px solid #444;
}

.label-block_515 {
    display: flex;
    padding: 8px 8px 8px 0;
}

.label-block_515 input[type=checkbox] {
    margin-left: auto;
}

.label-inline_04f {
    padding: 8px 8px 8px 0;
}

.label-inline_04f:not(:first-child) {
    padding-left: 8px;
}

.label-inline_04f:not(:last-child) {
    margin-right: 8px;
}

.warn_298 {
    padding: 8px;
    background-color: #594c00;
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
`);

_script_main($, Vue, VueI18n);
