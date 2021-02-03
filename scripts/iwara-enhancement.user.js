// ==UserScript==
// @name         Iwara Enhancement
// @name:zh-CN   Iwara增强
// @namespace    https://github.com/guansss/userscripts
// @version      0.1
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
// ==/UserScript==

const GLOBAL_STYLES =
    // large screen mode
    `
@media (min-width: 2560px) {
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
` +
    // auto-download actions
    `
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
}

#filename-preview {
    color: #666;
    font-size: 0.8em;
}`;

// the storage keys
const KEY_VOLUME = 'volume';
const KEY_FILENAME = 'filename';

const DEFAULT_FILENAME_TEMPLATE = 'DATE TITLE - AUTHOR (ID)';
let filenameTemplate = GM_getValue(KEY_FILENAME, DEFAULT_FILENAME_TEMPLATE);

(() => {
    'use strict';

    const ready = new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));

    // jQuery is available only when ready
    ready.then(() => window.$ = unsafeWindow.$ = unsafeWindow.jQuery);

    {
        general();
        enhanceList();

        if (location.pathname.match(/(videos|images)\//)) {
            prettifyContentPage();

            if (location.pathname.includes('videos')) {
                enhanceVideo();
                setupAutoDownload();
            }
        } else if (location.pathname.includes('search')) {
            enhanceSearch();
        }
    }

    async function general() {
        GM_addStyle(GLOBAL_STYLES);

        await ready;

        // remove R18 warning
        $('#r18-warning').remove();
    }

    async function enhanceList() {
        await ready;

        // display like rate and highlight
        $('.views-column').each(function () {
            const thiz = $(this);
            const children = $(this).find('.likes-icon');

            let likes = children.eq(0).contents().filter((i, e) => e.nodeType === 3).text().trim();
            let views = children.eq(1).contents().filter((i, e) => e.nodeType === 3).text().trim();

            views = views.includes('k') ? views.slice(0, -1) * 1000 : views;
            const likeRate = Math.round(1000 * likes / (+views || Infinity)) / 10;

            children.eq(1).text(likeRate + '%');

            if (likeRate >= 4) {
                thiz.css('background', '#79ecd6');
                thiz.find('.username').css('color', '#555');
            }
        });
    }

    async function enhanceVideo() {
        // remove old CSS of videojs
        for (const node of document.head.childNodes) {
            if (node && node.tagName === 'STYLE' && node.innerHTML.includes('video-js')) {
                node.innerHTML = node.innerHTML.replace(/.+?video-js\.min\.css.+/, '');
            }
        }

        // load newer CSS of videojs
        GM_addStyle(GM_getResourceText('vjs-css'));

        // patch the player.on() to return itself to support method chaining, which is no longer supported in the new version
        const Player = videojs.getComponent('Player');
        const readyFn = Player.prototype.ready;

        Player.prototype.ready = function () {
            const onFn = this.on;

            if (onFn && !onFn.patched) {
                this.on = function () {
                    onFn.apply(this, arguments);
                    return this;
                };
                this.on.patched = true;
            }
            return readyFn.apply(this, arguments);
        };

        // inject the videojs to page context
        unsafeWindow._videojs = videojs;

        // switch to newer version of videojs
        new MutationObserver((mutationsList, observer) => {
            mutationsList.forEach(mutation => {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node && node.src && node.src.includes('video-js/video.js')) {
                            observer.disconnect();

                            const script = document.createElement('script');
                            script.innerHTML = 'window.videojs = window._videojs';
                            node.after(script);
                            node.remove();
                        }
                    }
                }
            });
        }).observe(document.head, { childList: true });

        // recover the volume in incognito mode
        if (localStorage['-volume'] === undefined) {
            localStorage['-volume'] = GM_getValue(KEY_VOLUME, 0.5);
        }

        await ready;

        repeat(() => {
            const player = videojs.getPlayers()['video-player'];

            if (player) {
                player.ready(() => {
                    player.on('fullscreenchange', () => {
                        $('#video-player').focus();
                    })
                        .on('volumechange', () => {
                            // save volume when changed
                            GM_setValue(KEY_VOLUME, player.volume() || 0.5);
                        });
                });

                return true;
            }
        }, 200);
    }

    async function prettifyContentPage() {
        await ready;

        // show full description
        $('.field-name-body a.show').click();

        // enlarge content area
        $('.node-full .col-sm-12:last-child').removeClass('col-sm-12').addClass('col-sm-9').parent().append($('.container .sidebar'));
        $('.container>.col-sm-9, .node-full').removeClass('col-sm-9').addClass('col-sm-12');
        $('.extra-content-block').remove();

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
                DATE_TS: new Date(),
                UP_DATE: formatDate(new Date(uploadDate)),
                UP_DATE_TS: uploadDate
            };

            // the keys should be sorted to prevent certain keys from overriding its longer form
            // e.g. "DATE_TS" gets populated with DATE instead of DATE_TS
            const sortedKeys = Object.keys(vars).sort((a, b) => b.length - a.length);

            const filename = sortedKeys.reduce((_filename, key) => _filename.replace(key, vars[key]), template)
                // strip characters disallowed in file path
                .replace(/[*/:<>?\\|]/g, '');

            return {
                url,
                filename: filename + ext,
            };
        }

        const downloadBtn = $('#download-button');
        const downloadBtnText = downloadBtn.text();

        downloadBtn.off('click').click(function (e) {
            try {
                e.preventDefault();

                this.blur();

                const likeBtn = $('.flag-like a');

                // like the video if not liked
                if (!likeBtn.attr('href').includes('unflag')) {
                    likeBtn.click();
                }

                const downloadTarget = getDownloadTarget();

                downloadBtn.addClass('btn-disabled');

                let onprogress;

                // progress is only available in the "native" mode
                if (GM_info.downloadMode !== 'browser') {
                    onprogress = (e) => {
                        const progress = ~~(e.loaded / e.total * 100);
                        downloadBtn.text(downloadBtnText + ' ' + progress + '%');
                    };

                    onprogress({ loaded: 0, total: 1 });
                }

                GM_download({
                    url: downloadTarget.url,
                    name: downloadTarget.filename,
                    saveAs: true,
                    onload: downloadEnded,
                    onerror: downloadEnded,
                    ontimeout: downloadEnded,
                    onprogress,
                });
            } catch (e) {
                showError(e + '');
            }
        });

        function downloadEnded(e) {
            if (e && e.error) {
                console.warn('Download error', e);
                showError(`Download error (${e.error}): ${e.details.current}`);
            }

            downloadBtn.removeClass('btn-disabled').text(downloadBtnText);
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
            <h3>Download filename</h3>
            <p>The filename template to use when downloading a video.</p>
            <p>Note the userscript settings will be lost when exiting the incognito mode,
                so in order to apply the settings permanently, you need to modify them in non-incognito mode.</p>
            <pre>ID          the video's ID
TITLE       title
AUTHOR      author's name
DATE        date time when the download starts
DATE_TS     the DATE in timestamp format
UP_DATE     date time when the video was uploaded
UP_DATE_TS  the UP_DATE in timestamp format</pre>
            <input id="filename-input" value="${filenameTemplate}"></input>
            <a id="filename-submit" class="icon-btn glyphicon glyphicon-ok" title="Apply"></a>
            <a id="filename-reset" class="icon-btn glyphicon glyphicon-repeat" title="Reset to default"></a>
            <p id="filename-preview"></p>`)
            .prependTo('#download-options .panel-body');

        $('#filename-input').on('input', function (e) {
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

    async function enhanceSearch() {
        await ready;

        $('.node-image').each(function () {
            const thiz = $(this);
            const twitterShareLink = thiz.find('[title="Share on Twitter"]').attr('href');

            if (twitterShareLink) {
                let iwaraLink = twitterShareLink.slice(twitterShareLink.indexOf('http', 10));

                iwaraLink = decodeURIComponent(iwaraLink);

                thiz.find('h1').wrapInner(`<a href="${iwaraLink}"></a>`);
            }
        });
    }

    function repeat(fn, interval = 500) {
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
})();
