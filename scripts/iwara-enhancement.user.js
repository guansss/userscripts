// ==UserScript==
// @name         Iwara Enhancement
// @namespace    https://github.com/guansss/userscripts
// @version      0.1
// @description  Enhances UI for better experience
// @author       guansss
// @match        *://*.iwara.tv/*
// @require      https://cdn.jsdelivr.net/npm/video.js@7.10.1/dist/video.min.js#sha256=9HM07Of11yw3TL/m0BxP9pw08qXmG/xOTDc1d3sp2Wo=
// @resource     vjs-css https://cdn.jsdelivr.net/npm/video.js@7.10.1/dist/video-js.min.css#sha256=/fXfq3QrnWyMYmF0zX6ImdI1DTraNCAq1vPofa2rs2w=
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_download
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

const FILE_NAME = 'DATE TITLE - AUTHOR (ID)';

(() => {
    'use strict';

    const ready = new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));

    // jQuery is available only when ready
    ready.then(() => window.$ = unsafeWindow.$ = unsafeWindow.jQuery);

    {
        general();
        enhanceList();

        const secondSlashIndex = location.pathname.indexOf('/', 1);
        const place = location.pathname.slice(1, secondSlashIndex !== -1 ? secondSlashIndex : undefined);

        if ((place === 'videos' || place === 'images') && secondSlashIndex !== -1) {
            prettifyContentPage();
        }
        if (place === 'videos' && secondSlashIndex !== -1) {
            enhanceVideo();
            setupAutoDownload();
        }
    }

    async function general() {
        // large screen mode
        GM_addStyle(`
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
`);

        await ready;

        // remove R18 warning
        $('#r18-warning').remove();
    }

    async function enhanceList() {
        await ready;

        // display like rate and highlight
        $('.views-column').each(function() {
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
            localStorage['-volume'] = GM_getValue('volume', 0.5);
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
                            GM_setValue('volume', player.volume() || 0.5);
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

        $('#download-button').off('click').click(e => {
            e.preventDefault();

            // like the video
            $('.flag-like a').click();

            const id = location.pathname.slice(location.pathname.lastIndexOf('/') + 1);

            const url = $('#download-options li:first-child a')[0].href;
            const ext = url.match(/Source(\.[^&]+)/)[1];

            const title = $('.node-info .title').text();
            const author = $('.node-info .username').text();
            const fileName = Object.entries({
                    ID: id,
                    TITLE: title,
                    AUTHOR: author,
                    DATE: new Date().toLocaleString('zh-cn', { hour12: false }).replace(/[\/ :]/g, ''),
                })
                .reduce((fileName, [key, value]) => fileName.replace(key, value), FILE_NAME)
                .replace(/[*/:<>?\\|]/g, '');

            GM_download({
                url,
                name: fileName + ext,
                saveAs: true,
            });
        });
    }

    function repeat(fn, interval = 500) {
        if (fn()) {
            return undefined;
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
})();
