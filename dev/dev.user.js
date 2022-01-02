// ==UserScript==
// @name         Dev script
// @version      0.1
// @match        *://localhost:8080/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_download
// @grant        GM_info
// @grant        unsafeWindow
// ==/UserScript==

(async function() {
    ('use strict');

    const host = 'http://127.0.0.1:3000';

    const viteClientImported = import(host + '/@vite/client');

    const forceLoad = ['iwara-enhancement'].join(',');

    const scripts = await fetch(host + '/@userscripts/available?forceLoad=' + forceLoad).then((res) => res.json());

    // wait for HMR setup
    await viteClientImported;

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

    for (const script of scripts) {
        console.log('Loading script:', script.name);

        import(host + '/' + script.url);
    }
})();
