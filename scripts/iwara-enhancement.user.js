// ==UserScript==
// @name         Iwara Enhancement
// @name:zh-CN   Iwara增强
// @namespace    https://github.com/guansss/userscripts
// @version      0.8
// @description  Multiple UI enhancements for better experience.
// @description:zh-CN 多种增强体验的界面优化
// @author       guansss
// @match        *://*.iwara.tv/*
// @require      https://cdn.jsdelivr.net/npm/video.js@7.10.1/dist/video.min.js#sha256=9HM07Of11yw3TL/m0BxP9pw08qXmG/xOTDc1d3sp2Wo=
// @resource     vjs-css https://cdn.jsdelivr.net/npm/video.js@7.10.1/dist/video-js.min.css#sha256=/fXfq3QrnWyMYmF0zX6ImdI1DTraNCAq1vPofa2rs2w=
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_download
// @grant        GM_info
// @grant        unsafeWindow
// @run-at       document-start
// @noframes
// ==/UserScript==

const VIDEOJS_THUMB_PLUGIN = 'https://cdn.jsdelivr.net/npm/videojs-thumbnail-sprite@0.1.1/dist/index.min.js';

// the storage keys
const KEY_VERSION = 'version';
const KEY_VOLUME = 'volume';
const KEY_FILENAME = 'filename';
const KEY_DARK_MODE = 'dark';
const KEY_LIKE_RATES = 'like_rates';
const KEY_PLAYER_SIZE = 'player_size';

const DEFAULT_FILENAME_TEMPLATE = '{DATE} {TITLE} - {AUTHOR} ({ID})';
let filenameTemplate = GM_getValue(KEY_FILENAME, DEFAULT_FILENAME_TEMPLATE);

function main() {
    'use strict';

    const ready = new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));

    // jQuery is available only when ready
    ready.then(() => window.$ = unsafeWindow.$ = unsafeWindow.jQuery);

    // retrieve the old version and write the new one
    let oldVersion = GM_getValue(KEY_VERSION, '0');
    GM_setValue(KEY_VERSION, GM_info.script.version);

    if (+oldVersion <= 0.6) {
        migrateFilename();
    }

    {
        general();
        enhanceList();

        if (location.pathname.match(/(videos|images)\//)) {
            prettifyContentPage();

            if (location.pathname.includes('videos')) {
                enhanceVideo();
                setupThumbnails();
                setupAutoDownload();
            }
        } else if (location.pathname.includes('search')) {
            enhanceSearch();
        }
    }

    async function general() {
        GM_addStyle(GLOBAL_STYLES);

        // dark mode
        if (GM_getValue(KEY_DARK_MODE, false)) {
            document.documentElement.classList.add('dark');
        }

        await ready;

        // remove R18 warning
        $('#r18-warning').remove();

        $('<a class="btn btn-info btn-sm" title="Dark mode"><i class="glyphicon glyphicon-eye-open"></i></a>')
            .insertAfter('#user-links .search-link')
            .on('click', () => {
                document.documentElement.classList.toggle('dark');
                GM_setValue(KEY_DARK_MODE, document.documentElement.classList.contains('dark'));
            });
    }

    async function enhanceList() {
        await ready;

        const likeRatesEnabled = GM_getValue(KEY_LIKE_RATES, true);

        $('#block-mainblocks-sub-menu .list-inline')
            .after(`<label for="check-like-rates" class="checkbox"><input type="checkbox" id="check-like-rates" ${likeRatesEnabled ? 'checked' : ''}>Display like rates</label>`);

        $('#check-like-rates').change(function() {
            GM_setValue(KEY_LIKE_RATES, this.checked);
            enableLikeRates(this.checked);
        });

        function enableLikeRates(enabled) {
            if (enabled) {
                $('body').removeClass('hide-like-rates');
            } else {
                $('body').addClass('hide-like-rates');
            }
        }

        enableLikeRates(likeRatesEnabled);

        // iterates over video/image items in the page
        $('.view-content .views-column, .view-content .col-sm-3').each(function() {
            const thiz = $(this);

            if (thiz.children(':first-child').is('.node-teaser, .node-sidebar_teaser')) {
                const url = thiz.find('.title a').attr('href');

                // set up like rates and highlights

                const viewsIcon = thiz.find('.likes-icon.left-icon');
                const likesIcon = thiz.find('.likes-icon.right-icon');

                // ensure the likes icon exists because it will be missing if the likes are 0
                if (likesIcon.length) {
                    let [views, likes] = [viewsIcon, likesIcon].map(icon => {
                        let value = icon.html().replace(/<i.*<\/i>/m, '').trim();

                        value = value.includes('k') ? value.slice(0, -1) * 1000 : value;

                        return +value;
                    });

                    const likeRatePercent = views === 0 ? 0 : Math.round(1000 * likes / views) / 10;

                    viewsIcon.after(`<div class="like-rate left-icon">${likeRatePercent}%</div>`);

                    if (likeRatePercent >= 4) {
                        thiz.addClass('highlight');
                    }
                }

                // differentiate images from videos in subscriptions page
                // by adding an "image" icon on the image item that's not denoted by a "multiple" icon

                if (location.href.includes('subscriptions') && !thiz.find('.multiple-icon').length) {
                    if (url.startsWith('/images')) {
                        viewsIcon.before('<div class="left-icon"><i class="glyphicon glyphicon-picture"></i></div>');
                    }
                }

                // fix broken preview images

                const placeholder = `<a href="${url}" class="preview-placeholder"><div>NO PREVIEW</div></a>`;
                const teaserContainer = thiz.find('.field-type-video .field-item');

                if (!teaserContainer.children().length) {
                    teaserContainer.append(placeholder);
                } else {
                    teaserContainer.find('img').error(function() {
                        teaserContainer.empty().append(placeholder);
                    });
                }
            }
        });
    }

    async function enhanceVideo() {
        // load CSS of the new videojs
        GM_addStyle(GM_getResourceText('vjs-css'));

        // patch the player.on() to return itself to support method chaining, which is no longer supported in the new version
        const Player = videojs.getComponent('Player');
        const readyFn = Player.prototype.ready;

        Player.prototype.ready = function() {
            const onFn = this.on;

            if (onFn && !onFn.patched) {
                this.on = function() {
                    onFn.apply(this, arguments);
                    return this;
                };
                this.on.patched = true;
            }
            return readyFn.apply(this, arguments);
        };

        // copy the plugins if the old videojs has already been loaded before this userscript is injected to the page
        if (unsafeWindow.videojs) {
            const oldVideojs = unsafeWindow.videojs;

            unsafeWindow.videojs = videojs;

            // registered plugins can be found by checking the <script> tags in page HTML
            const registeredPlugins = ['hotkeys', 'persistvolume', 'loopbutton', 'videoJsResolutionSwitcher'];

            // copy plugins to the new videojs
            for (const plugin of registeredPlugins) {
                const pluginMethod = oldVideojs.getComponent('Player').prototype[plugin];

                if (typeof pluginMethod === 'function') {
                    videojs.registerPlugin(plugin, pluginMethod);
                }
            }
        }
        // otherwise, prevent the old videojs from loading
        else {
            unsafeWindow.videojs = videojs;

            let scriptExists = false;

            // there's a chance that the <script> tag of videojs has already been inserted to the page,
            // I'm not quite sure though
            for (const element of document.head.children) {
                if (element.src && element.src.includes('video-js/video.js')) {
                    element.remove();
                    scriptExists = true;
                    break;
                }
            }

            if (!scriptExists) {
                // immediately remove the <script> tag once it's inserted to the HTML
                new MutationObserver((mutationsList, observer) => {
                    mutationsList.forEach(mutation => {
                        if (mutation.type === 'childList') {
                            for (const node of mutation.addedNodes) {
                                if (node && node.src && node.src.includes('video-js/video.js')) {
                                    observer.disconnect();
                                    node.remove();

                                    // though removed, the <script> still attempts to load on Firefox
                                    node.addEventListener('load', () => {
                                        unsafeWindow.videojs = videojs;
                                    });
                                }
                            }
                        }
                    });
                }).observe(document.head, { childList: true });
            }
        }

        // recover the volume in incognito mode
        if (localStorage['-volume'] === undefined) {
            localStorage['-volume'] = GM_getValue(KEY_VOLUME, 0.5);
        }

        await ready;

        // remove CSS of the old videojs
        for (const node of document.head.childNodes) {
            if (node && node.tagName === 'STYLE' && node.innerHTML.includes('video-js')) {
                node.innerHTML = node.innerHTML.replace(/.+?video-js\.min\.css.+/, '');
            }
        }

        const player = await repeatUntil(() => videojs.getPlayers()['video-player']);

        player
            .on('fullscreenchange', () => {
                $('#video-player').focus();
            })
            .on('volumechange', () => {
                // save volume when changed
                GM_setValue(KEY_VOLUME, player.volume() || 0.5);
            });

        // player size option

        let playerSize = GM_getValue(KEY_PLAYER_SIZE, 100);

        $(`
        <div class="page-node-edit">
            <h3>Player Size</h3>
            <p><input type="number" id="player-size-input" class="form-text" value="${playerSize}"> %</p>
        </div>`)
            .prependTo('#download-options .panel-body');

        $('#player-size-input').on('input', function(e) {
            if (Number(this.value) > 0) {
                playerSize = Number(this.value);
                GM_setValue(KEY_PLAYER_SIZE, playerSize);

                updatePlayerSize();
            }
        });

        function updatePlayerSize() {
            $('#video-player').each(function() {
                this.style.setProperty('width', playerSize + '%', 'important');
                this.style.setProperty('margin', '0 ' + (100 - playerSize) / 2 + '%');
            });
        }

        updatePlayerSize();
    }

    async function setupThumbnails() {
        await ready;

        const player = await repeatUntil(() => videojs.getPlayers()['video-player']);

        // e.g. //i.iwara.tv/sites/default/files/videos/thumbnails/1404656/thumbnail-1404656_0001.jpg
        const previewURL = player.poster();

        if (previewURL && previewURL.includes('thumbnail')) {
            // the thumbnail plugin is a commonjs module so we have to define these stuff for it
            unsafeWindow.exports = {};
            unsafeWindow.require = module => module === 'video.js' ? videojs : undefined;

            // load the thumbnail plugin
            await new Promise(resolve => {
                const script = document.createElement('script');
                script.onload = resolve;
                script.src = VIDEOJS_THUMB_PLUGIN;
                document.head.appendChild(script);
            });

            // duration and dimensions are included in the meta data
            player.on('loadedmetadata', () => {
                const division = 16;
                const interval = player.duration() / division;

                const width = 180;
                const height = width * player.videoHeight() / player.videoWidth();

                // strip the image number as well as the extension
                const thumbBaseURL = previewURL.slice(0, -6);

                const sprites = [];

                for (let i = 0; i < division - 1; i++) {
                    // append the base URL with numbers, starting from 01
                    const url = thumbBaseURL + (i + 1 + '').padStart(2, '0') + '.jpg';

                    // using (division-1) thumbnails to cover all the segments
                    //
                    //
                    // thumbs(index):        0       1       2       3           div-3   div-2
                    //                       v       v       v       v             v       v
                    // timeline:     +-------+-------+-------+-------+-- ... ------+-------+-------+
                    //               ^           ^       ^       ^             ^       ^           ^
                    // time spans:   |___________|_______|_______|______ ... __|_______|___________|
                    //                     0         1       2       3           div-3     div-2

                    let start, timeSpan;

                    switch (i) {
                        case 0:
                            start = 0;
                            timeSpan = interval * 1.5;
                            break;

                        case division - 2:
                            start = interval * (0.5 + i);

                            // add extra 0.1 due to the floating point computation...
                            timeSpan = interval * (1.5 + 0.1);
                            break;

                        default:
                            start = interval * (0.5 + i);
                            timeSpan = interval;
                    }

                    sprites.push({
                        url, width, height, start,
                        duration: timeSpan,
                        interval: timeSpan,
                    });
                }

                player.thumbnailSprite({ sprites });
            });
        }
    }

    async function prettifyContentPage() {
        await ready;

        // show full description
        $('.field-name-body a.show').click();

        // enlarge content area
        $('.node-full .col-sm-12:last-child').removeClass('col-sm-12').addClass('col-sm-9').parent().append($('.container .sidebar'));
        $('.container>.col-sm-9, .node-full').removeClass('col-sm-9').addClass('col-sm-12');
        // $('.extra-content-block').remove();

        // move "liked by" block to the bottom
        $('#block-views-likes-block').appendTo('.sidebar .region-sidebar');
    }

    async function setupAutoDownload() {
        await ready;

        // wait for Bootstrap's initialization
        await delay(200);

        function getDownloadTarget(template = filenameTemplate) {
            const url = $('#download-options li:first-child a')[0].href;
            const ext = url.match(/Source(\.[^&]+)/)[1];

            const urlMatches = unescape(url).match(/file=.+\/(\d+)_(\w+)_/);
            const uploadDate = urlMatches[1] * 1000;
            const id = urlMatches[2];

            const title = $('.node-info .title').text();
            const author = $('.node-info .username').text();

            const vars = {
                ID: id,
                TITLE: title,
                AUTHOR: author,
                DATE: formatDate(new Date()),
                DATE_TS: new Date().getTime(),
                UP_DATE: formatDate(new Date(uploadDate)),
                UP_DATE_TS: uploadDate,
            };

            let filename = template;

            for (const v in vars) {
                filename = filename.replaceAll('{' + v + '}', vars[v]);
            }

            // strip characters disallowed in file path
            filename = filename.replace(/[*/:<>?\\|]/g, '');

            return {
                url,
                filename: filename + ext,
            };
        }

        const downloadBtn = $('#download-button');
        const downloadBtnHTML = downloadBtn.html();

        // a function to abort the current download
        let abortDownload;

        unsafeWindow.onbeforeunload = () => {
            if (abortDownload) {
                // the message is unlikely to be displayed in modern browsers but, just in case
                return 'Download still in progress, would you like to abort it and exit?';
            }
        };

        unsafeWindow.onunload = () => abortDownload && abortDownload();

        if (GM_info.downloadMode !== 'disabled') {
            downloadBtn.off('click').click(function(e) {
                try {
                    e.preventDefault();

                    this.blur();

                    const likeBtn = $('.flag-like a');

                    // like button exists if user has logged in
                    if (likeBtn.length) {
                        // like the video if not liked
                        if (!likeBtn.attr('href').includes('unflag')) {
                            likeBtn.click();
                        }
                    }

                    const downloadTarget = getDownloadTarget();

                    downloadBtn.addClass('btn-disabled');

                    let onprogress;

                    // progress is only available in the "native" mode
                    if (GM_info.downloadMode !== 'browser') {
                        onprogress = (e) => {
                            const progress = ~~(e.loaded / e.total * 100);
                            downloadBtn.html(downloadBtnHTML + ' ' + progress + '%');
                        };

                        onprogress({ loaded: 0, total: 1 });
                    }

                    const { abort } = GM_download({
                        url: downloadTarget.url,
                        name: downloadTarget.filename,
                        saveAs: true,
                        onload: downloadEnded,
                        onerror: downloadEnded,
                        ontimeout: downloadEnded,
                        onprogress,
                    });

                    // aborting will be handled by the browser's download manager in non-native mode
                    if (GM_info.downloadMode === 'native') {
                        abortDownload = abort;
                    }
                } catch (e) {
                    showError(e + '');
                }
            });
        } else {
            showError(new Error('Download has been disabled, the default method will be used instead.'));
        }

        function downloadEnded(e) {
            if (e && e.error) {
                console.warn('Download error', e);
                showError(`Download error (${e.error}): ${e.details.current}`);
            }

            downloadBtn.removeClass('btn-disabled').html(downloadBtnHTML);

            abortDownload = undefined;
        }

        function showError(msg) {
            $('#download-options').before(`<div class="text-danger">${msg}</div>`);
        }

        $('<a id="options-switch" class="icon-btn glyphicon glyphicon-cog"></a>')
            .insertAfter('#download-button')
            .click(() => {
                $('#download-options').toggleClass('hidden');
                $('#filename-input').trigger('input');
            });

        $(`
        <div class="page-node-edit">
            <h3>Download filename</h3>
            <p>The filename template to use when downloading a video.</p>
            <p>Note the userscript settings will be lost when exiting the incognito mode,
              so in order to apply the settings permanently, you need to modify them in non-incognito mode.</p>
            <p>If you're using Tampermonkey, you can check the <a href="https://greasyfork.org/scripts/416003-iwara-enhancement">description</a>
              for how to improve the download experience.</p>
            <p>Each keyword should be surrounded by <code>{}</code>.</p>
            <pre>ID          the video's ID
TITLE       title
AUTHOR      author's name
DATE        date time when the download starts
DATE_TS     the DATE in timestamp format
UP_DATE     date time when the video was uploaded
UP_DATE_TS  the UP_DATE in timestamp format</pre>
            <input type="text" id="filename-input" class="form-text" value="${filenameTemplate}">
            <a id="filename-submit" class="icon-btn glyphicon glyphicon-ok" title="Apply"></a>
            <a id="filename-reset" class="icon-btn glyphicon glyphicon-repeat" title="Reset to default"></a>
            <p id="filename-preview"></p>
        </div>`)
            .prependTo('#download-options .panel-body');

        $('#filename-input').on('input', function(e) {
            $('#filename-preview').text(getDownloadTarget(this.value).filename);

            const isChanged = this.value !== filenameTemplate;
            const isDefault = this.value === DEFAULT_FILENAME_TEMPLATE;
            $('#filename-submit')[isChanged ? 'show' : 'hide']();
            $('#filename-reset')[!isDefault ? 'show' : 'hide']();
        });

        $('#filename-submit').hide().click(() => {
            filenameTemplate = $('#filename-input').val();
            GM_setValue(KEY_FILENAME, filenameTemplate);
            $('#filename-input').trigger('input');
        });

        $('#filename-reset').hide().click(() => {
            $('#filename-input').val(DEFAULT_FILENAME_TEMPLATE);
            $('#filename-submit').click();
        });
    }

    // migrate filename template like from KEYWORD to {KEYWORD}
    function migrateFilename() {
        if (filenameTemplate === DEFAULT_FILENAME_TEMPLATE) {
            return;
        }

        const vars = ['ID', 'TITLE', 'AUTHOR', 'DATE', 'DATE_TS', 'UP_DATE', 'UP_DATE_TS']
            .sort((a, b) => b.length - a.length);

        // surround keywords with {}
        for (const v of vars) {
            filenameTemplate = filenameTemplate.replace(new RegExp('(?<!\\{)' + v + '(?!\\})'), '{' + v + '}');
        }

        GM_setValue(KEY_FILENAME, filenameTemplate);
    }

    async function enhanceSearch() {
        await ready;

        $('.node-image').each(function() {
            const thiz = $(this);
            const twitterShareLink = thiz.find('[title="Share on Twitter"]').attr('href');

            if (twitterShareLink) {
                let iwaraLink = twitterShareLink.slice(twitterShareLink.indexOf('http', 10));

                iwaraLink = decodeURIComponent(iwaraLink);

                thiz.find('h1').wrapInner(`<a href="${iwaraLink}"></a>`);
            }
        });
    }

    function repeat(fn, interval = 200) {
        if (fn()) {
            return 0;
        }

        const id = setInterval(() => {
            try {
                fn() && clearInterval(id);
            } catch (e) {
                clearInterval(id);
            }
        }, interval);

        return id;
    }

    // non-cancelable
    function repeatUntil(fn, interval) {
        return new Promise(resolve => repeat(() => {
            const result = fn();

            if (result) {
                resolve(result);
                return true;
            }
        }, interval));
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function formatDate(date) {
        const pad = num => String(num).padStart(2, '0');
        return [
            date.getFullYear(), date.getMonth() + 1, date.getDate(),
            date.getHours(), date.getMinutes(), date.getSeconds(),
        ]
            .map(pad).join('');
    }
}

// language=CSS
const GLOBAL_STYLES = `
    /* ============================= large screen mode ============================= */

    @media (min-width: 2000px) {
        .container {
            width: 1984px;
        }

        .slick-slider {
            height: 920px !important;
        }

        .slick-list img {
            width: 1800px;
        }

        .comment .user-avatar {
            width: 8.33333333%;
        }
    }

    @media (min-width: 3000px) {
        .container {
            width: 2976px;
        }
    }

    /* ============================= dark mode ============================= */

    .dark {
        background-color: #222;
        color: #F8F8F8;
    }

    .dark li a.active {
        color: #02e8bb;
    }

    .dark body,
    .dark footer,
    .dark .panel,
    .dark section#content > .container,
    .dark .node.node-full.node-video .node-info,
    .dark .node.node-full.node-image .node-info,
    .dark tr.even,
    .dark tr.odd,
    .dark .table-striped > tbody > tr:nth-child(odd) > td,
    .dark .table-striped > tbody > tr:nth-child(odd) > th {
        background-color: inherit;
    }

    .dark .node.node-full .node-buttons,
    .dark .node.node-full .field-name-body a.show,
    .dark .node.node-full .field-name-field-categories .field-items .field-item,
    .dark .node.node-full .field-name-field-image-categories .field-items .field-item,
    .dark .panel-default > .panel-heading,
    .dark .panel-default > .panel-footer,
    .dark .table-striped > tbody > tr:nth-child(even) > td,
    .dark .table-striped > tbody > tr:nth-child(even) > th,
    .dark .views-field.views-field-last-updated.active,
    .dark .privatemsg-header-lastupdated.active,
    .dark .page-messages #privatemsg-list-form tr,
    .dark .page-messages .private-message .message.mine,
    .dark .view-profile.view-display-id-block,
    .dark .view-id-content table > tbody > tr:nth-child(odd) > td,
    .dark .view-id-content table > tbody > tr:nth-child(odd) > th,
    .dark table.sticky-header,
    .dark .well,
    .dark .jumbotron,
    .dark .node-video.node-full .playlist-button-wrapper .playlists,
    .dark .private-notice,
    .dark select option {
        background-color: #2a2a2a;
    }

    .dark .preview .node {
        background-color: #ffffea40;
    }

    .dark .page-messages .private-message .message.theirs,
    .dark .view-profile.view-display-id-block .views-field-field-about {
        background-color: #444;
    }

    .dark .page-node-add .form-textarea,
    .dark .page-node-edit .form-textarea,
    .dark .page-node-add .form-text,
    .dark .page-node-edit .form-text,
    .dark pre,
    .dark code,
    .dark select,
    .dark textarea,
    .dark input:not(.btn):not(.form-submit) {
        background-color: rgba(255, 255, 255, .05);
    }

    .dark code {
        color: #cd798e;
    }

    .dark .view-profile.view-display-id-block .views-field-field-about,
    .dark .panel-default,
    .dark .panel-default > .panel-heading,
    .dark .panel-default > .panel-footer,
    .dark .well,
    .dark #comments .indented,
    .dark pre,
    .dark textarea,
    .dark input[type="text"],
    .dark input[type="number"],
    .dark table,
    .dark thead,
    .dark tbody,
    .dark tfoot,
    .dark tr,
    .dark th,
    .dark td {
        border-color: #333 !important;
    }

    .dark h1,
    .dark h2,
    .dark h3,
    .dark h4,
    .dark h5,
    .dark h6 {
        border-color: #666 !important;
    }

    .dark body,
    .dark .form-control,
    .dark .node.node-teaser h3.title a,
    .dark .panel-default > .panel-heading,
    .dark .page-node-add .form-textarea,
    .dark .page-node-edit .form-textarea,
    .dark .page-node-add .form-text,
    .dark .page-node-edit .form-text {
        color: inherit;
    }

    /* ============================= item list ============================= */

    #block-mainblocks-sub-menu .list-inline {
        display: inline-block;
    }

    #block-mainblocks-sub-menu .checkbox {
        display: inline-block;
        margin: 0 16px;
        font-size: inherit;
    }

    /* hide likes icons only when displaying like rates */
    .hide-like-rates .like-rate,
    body:not(.hide-like-rates) .likes-icon.left-icon {
        margin: 0;
        width: 0;
        overflow: hidden;
    }

    .preview-placeholder {
        position: relative;
        display: block;
        padding-bottom: calc(100% * 150 / 220); /* numbers from the width and height attributes of preview images */
    }

    .preview-placeholder > * {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #888;
        font-size: 1.5em;
        text-align: center;
        line-height: 1.2;
        background: rgba(128, 128, 128, .1);
    }

    .highlight {
        background-color: #79ecd6;
    }

    .highlight .username {
        color: #555;
    }

    .highlight .preview-placeholder > * {
        color: #EEE;
    }

    .dark .highlight {
        background-color: #048c72;
    }

    .dark .highlight .username {
        color: #CCC;
    }

    /* ============================= progress bar thumbnails ============================= */

    .vjs-mouse-display .vjs-time-tooltip {
        background-size: cover;
        text-shadow: 0 0 2px black, 0 0 2px black !important;
    }

    /* ============================= auto-download options ============================= */

    .btn-disabled {
        opacity: 0.7;
        pointer-events: none;
    }

    .icon-btn {
        margin-left: 4px;
        padding: 8px 8px;
        cursor: pointer;
    }

    #options-switch {
        vertical-align: middle;
    }

    #filename-input {
        margin-top: 2px;
        width: 400px;
        max-width: 100%;
        display: inline;
    }

    #filename-preview {
        color: #777;
        font-size: 0.8em;
    }

    /* ============================= misc ============================= */

    video {
        outline: none !important;
    }

    #player-size-input {
        display: inline-block;
        width: 100px;
        text-align: right;
    }

    .vjs-big-play-button .vjs-icon-placeholder:before {
        line-height: 65px;
    }

    .vjs-icon-replay:before {
        font-size: 1.8em;
        line-height: 1.67;
    }

    .vjs-resolution-button .vjs-icon-placeholder:before {
        content: "\\f110";
        font-family: VideoJS;
    }
`;

main();
