// ==UserScript==
// @name         Dev script
// @version      0.1
// @match        *://localhost:8080/*
// @match        *://staging.iwara.tv/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_download
// @grant        GM_info
// @grant        unsafeWindow
// ==/UserScript==

(async function () {
    ('use strict');

    // when in dev mode, we need to expose the GM APIs to unsafeWindow
    // so they can be referenced by modules imported by import(),
    // which are executed outside the userscript scope
    unsafeWindow.__GM = Object.fromEntries(
        [
            'unsafeWindow',
            'GM_addStyle',
            'GM_addElement',
            'GM_deleteValue',
            'GM_listValues',
            'GM_addValueChangeListener',
            'GM_removeValueChangeListener',
            'GM_setValue',
            'GM_getValue',
            'GM_log',
            'GM_getResourceText',
            'GM_getResourceURL',
            'GM_registerMenuCommand',
            'GM_unregisterMenuCommand',
            'GM_openInTab',
            'GM_xmlhttpRequest',
            'GM_download',
            'GM_getTab',
            'GM_saveTab',
            'GM_getTabs',
            'GM_notification',
            'GM_setClipboard',
            'GM_info',
        ].map((api) => [api, window[api]])
    );

    // prevent Sentry from tracking the console during dev because it breaks the log trace
    ['debug', 'info', 'warn', 'error', 'log', 'assert'].forEach((key) => {
        if (unsafeWindow.console[key].__sentry_original__) {
            unsafeWindow.console[key] = unsafeWindow.console[key].__sentry_original__;
        } else {
            const fn = unsafeWindow.console[key];
            Object.defineProperty(unsafeWindow.console, key, {
                set() {
                    // prevent assignment
                },
                get() {
                    return fn;
                },
            });
        }
    });

    // fully disable Sentry, I'm not 100% sure this works

    unsafeWindow.__SENTRY__ = {
        extensions: {},
    };

    let hub;

    Object.defineProperty(unsafeWindow.__SENTRY__, 'hub', {
        set(_hub) {
            hub = _hub;
            hub.getClient = () => undefined;
        },
        get() {
            return hub;
        },
    });

    const host = 'https://127.0.0.1:3000';

    const viteClientImported = import(host + '/@vite/client');

    const forceLoad = ['iwara-enhancement'].join(',');

    const scripts = await fetch(host + '/@userscripts/available?forceLoad=' + forceLoad).then((res) => res.json());

    // wait for HMR setup
    await viteClientImported;

    for (const script of scripts) {
        console.log('Loading script:', script.name);

        import(host + '/' + script.url);
    }
})();
