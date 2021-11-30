// ==UserScript==
// @name         Christina (Iwara)
// @namespace    https://github.com/guansss/userscripts
// @version      0.1
// @description  Userscript for Christina.
// @author       guansss
// @match        *://*.iwara.tv/*
// @connect      christina
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// ==/UserScript==

const CHRISTINA_DOWNLOAD = 'http://christina/api/videos';

(() => {
    'use strict';

    if (location.pathname.includes('videos')) {
        setupDownload().then();
    }

    async function setupDownload() {
        // wait for the initialization of Iwara Enhancement
        await delay(500);

        const downloadBtn = $('#download-button');

        downloadBtn.html(downloadBtn.html() + ' (Christina)');

        downloadBtn.off('click').click(async function(e) {
            try {
                e.preventDefault();

                this.blur();

                await request({
                    method: 'POST',
                    url: CHRISTINA_DOWNLOAD,
                    overrideMimeType: 'application/json',
                    data: JSON.stringify({
                        type: 'i',
                        url: location.href,
                        html: document.documentElement.outerHTML,
                    }),
                });

                // don't download again!
                downloadBtn.addClass('btn-disabled');
            } catch (e) {
                console.warn(e);
                showError(e + '');
            }
        });

        function showError(msg) {
            $('#download-options').before(`
                <div class="text-danger">${msg}</div>`);
        }
    }

    /**
     * @param details {GM_xmlhttpRequestParams}
     */
    function request(details) {
        return new Promise((resolve, reject) => {
            // the details is actually a function with some properties so we have to extract them
            const unwrapDetails = details => Object.assign({}, details);

            const rejectBy = method => details => {
                details = unwrapDetails(details);
                const err = new Error(method + ' ' + JSON.stringify(details));
                err.details = details;
                reject(err);
            };

            GM_xmlhttpRequest({
                ...details,
                onerror: rejectBy('onerror'),
                onabort: rejectBy('onabort'),
                ontimeout: rejectBy('ontimeout'),
                onload(details) {
                    resolve(unwrapDetails(details));
                },
            });
        });
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
})();
