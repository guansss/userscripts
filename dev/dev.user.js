// ==UserScript==
// @name         Dev script
// @version      0.1
// @match        *://*/*
// @grant        all
// ==/UserScript==

(async function() {
    'use strict';

    const host = 'http://127.0.0.1:3000';

    const viteClientImported = import(host + '/@vite/client');

    const scripts = await fetch(host + '/@userscripts/available').then(res => res.json());

    // wait for HMR setup
    await viteClientImported;

    for (const script of scripts) {
        console.log('Loading script:', script.name);

        import(host + '/' + script.url);
    }
})();
